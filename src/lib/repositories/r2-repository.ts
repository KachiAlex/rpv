import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import type { Translation, Book, Chapter, Verse } from '../types';
import { sortBooksCanonically } from '../book-order';

function createR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 environment variables not configured');
  }

  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  if (endpoint) {
    clientConfig.endpoint = endpoint;
  }

  const client = new S3Client(clientConfig);

  return { client, bucketName };
}

function isNotFoundError(error: unknown): boolean {
  const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === 'NoSuchKey' || e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404;
}

function translationKey(id: string) {
  return `translations/${id}.json`;
}
function bookKey(translationId: string, bookName: string) {
  return `translations/${translationId}/books/${bookName}.json`;
}
function rawFileKey(translationId: string, fileName: string) {
  return `raw/${translationId}/${fileName}`;
}

export class R2Repository {
  static isConfigured(): boolean {
    return !!(
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );
  }

  async getAllTranslations(): Promise<Translation[]> {
    const { client, bucketName } = createR2Client();
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'translations/',
        Delimiter: '/',
      })
    );

    const translations: Translation[] = [];
    const prefixes = response.CommonPrefixes || [];

    for (const prefix of prefixes) {
      if (!prefix.Prefix) continue;
      const id = prefix.Prefix.replace('translations/', '').replace('/', '');
      if (!id || id.endsWith('.json')) continue;

      try {
        const meta = await this.getTranslationMetadata(id);
        if (meta) {
          translations.push(meta);
        }
      } catch {
        // Skip if metadata can't be loaded
      }
    }

    // Also check for direct .json files (simpler structure)
    const objects = response.Contents || [];
    for (const obj of objects) {
      if (!obj.Key || !obj.Key.endsWith('.json')) continue;
      const id = obj.Key.replace('translations/', '').replace('.json', '');
      if (translations.find(t => t.id === id)) continue;

      try {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: obj.Key })
        );
        if (!response.Body) continue;
        const text = await response.Body.transformToString();
        const translation = JSON.parse(text) as Translation;
        translations.push(translation);
      } catch {
        // Skip on error
      }
    }

    return translations;
  }

  async discoverBooks(id: string): Promise<string[]> {
    const { client, bucketName } = createR2Client();
    const prefix = `translations/${id}/books/`;
    let continuationToken: string | undefined;
    const bookNames: string[] = [];

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      for (const obj of response.Contents || []) {
        if (obj.Key && obj.Key.endsWith('.json')) {
          const name = obj.Key.replace(prefix, '').replace('.json', '');
          if (name) bookNames.push(name);
        }
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return bookNames;
  }

  async getTranslationMetadata(id: string): Promise<Translation | null> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: translationKey(id) })
      );
      if (!response.Body) return null;
      const text = await response.Body.transformToString();
      const translation = JSON.parse(text) as Translation;

      // Auto-discover books from R2 if metadata has none but book files exist
      if (translation.books.length === 0) {
        const discoveredBooks = await this.discoverBooks(id);
        if (discoveredBooks.length > 0) {
          translation.books = discoveredBooks.map(name => ({
            name,
            published: true,
            introduction: '',
            chapters: [],
          }));
        }
      }

      // Return metadata-only (books with empty chapters for quick loading)
      return {
        ...translation,
        books: sortBooksCanonically(translation.books).map(book => ({
          name: book.name,
          published: book.published,
          introduction: book.introduction,
          chapters: book.chapters.map(c => ({
            number: c.number,
            verses: [],
          })),
        })),
      };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async getTranslation(id: string, loadContent: boolean = false): Promise<Translation | null> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: translationKey(id) })
      );
      if (!response.Body) return null;
      const text = await response.Body.transformToString();
      const translation = JSON.parse(text) as Translation;

      // Auto-discover books from R2 if metadata has none but book files exist
      if (translation.books.length === 0) {
        const discoveredBooks = await this.discoverBooks(id);
        if (discoveredBooks.length > 0) {
          translation.books = discoveredBooks.map(name => ({
            name,
            published: true,
            introduction: '',
            chapters: [],
          }));
        }
      }

      if (loadContent) {
        // Load full book content
        const fullBooks: Book[] = [];
        for (const book of translation.books) {
          const fullBook = await this.getBookContent(id, book.name);
          if (fullBook) {
            fullBooks.push({ ...fullBook, published: book.published, introduction: book.introduction });
          } else {
            fullBooks.push(book);
          }
        }
        return { ...translation, books: sortBooksCanonically(fullBooks) };
      }

      return { ...translation, books: sortBooksCanonically(translation.books) };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async getTranslationLazy(id: string, loadContent: boolean = false): Promise<Translation | null> {
    return this.getTranslation(id, loadContent);
  }

  async saveTranslation(translation: Translation): Promise<void> {
    const { client, bucketName } = createR2Client();
    const now = new Date();
    const translationWithTimestamps: Translation = {
      ...translation,
      // Keep the stored manifest in canonical Bible order so newly merged
      // books slot into position instead of appending after Revelation.
      books: sortBooksCanonically(translation.books),
      createdAt: translation.createdAt || now,
      updatedAt: now,
    };

    // Save each book separately only when it carries real verse content.
    // Manifest-style stubs (chapters present but verses empty) must never be
    // written to the per-book objects — doing so wipes the stored verses.
    for (const book of translationWithTimestamps.books) {
      const hasContent = Array.isArray(book.chapters) && book.chapters.some(
        (c) => Array.isArray(c?.verses) && c.verses.length > 0
      );
      if (hasContent) {
        await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: bookKey(translationWithTimestamps.id, book.name),
            Body: JSON.stringify(book),
            ContentType: 'application/json',
          })
        );
      }
    }

    // Save translation metadata (with book list but empty chapters)
    const metadata: Translation = {
      ...translationWithTimestamps,
      books: translationWithTimestamps.books.map(book => ({
        name: book.name,
        published: book.published,
        introduction: book.introduction,
        chapters: book.chapters.map(c => ({ number: c.number, verses: [] })),
      })),
    };

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: translationKey(translationWithTimestamps.id),
        Body: JSON.stringify(metadata),
        ContentType: 'application/json',
      })
    );
  }

  async mergeTranslation(newTranslation: Translation): Promise<Translation> {
    const existing = await this.getTranslation(newTranslation.id, false);
    if (!existing) {
      await this.saveTranslation(newTranslation);
      return newTranslation;
    }

    // Merge books
    for (const newBook of newTranslation.books) {
      const existingIndex = existing.books.findIndex(b => b.name === newBook.name);
      if (existingIndex === -1) {
        existing.books.push(newBook);
        continue;
      }

      const existingBook = existing.books[existingIndex];
      const hasChapterPayload = Array.isArray(newBook.chapters) && newBook.chapters.length > 0;

      if (!hasChapterPayload) {
        // Metadata-only update — preserve the stored chapter list.
        existing.books[existingIndex] = {
          ...existingBook,
          ...newBook,
          chapters: existingBook.chapters,
        };
        continue;
      }

      // Chapter payloads must merge against the full stored book, not the
      // manifest stub. getBookContent throws on transient read failures, so a
      // partial merge can never overwrite stored verses.
      const fullBook = await this.getBookContent(newTranslation.id, existingBook.name);
      if (!fullBook) {
        throw new Error(`Cannot merge into '${existingBook.name}': stored content unavailable`);
      }
      const target: Book = {
        ...fullBook,
        published: existingBook.published ?? newBook.published,
        introduction: existingBook.introduction ?? newBook.introduction,
      };
      for (const newChapter of newBook.chapters) {
        const existingChapter = target.chapters.find(c => c.number === newChapter.number);
        if (existingChapter) {
          for (const newVerse of newChapter.verses) {
            const existingVerse = existingChapter.verses.find(v => v.number === newVerse.number);
            if (existingVerse) {
              existingVerse.text = newVerse.text;
            } else {
              existingChapter.verses.push(newVerse);
              existingChapter.verses.sort((a, b) => a.number - b.number);
            }
          }
        } else {
          target.chapters.push(newChapter);
          target.chapters.sort((a, b) => a.number - b.number);
        }
      }
      existing.books[existingIndex] = target;
    }

    await this.saveTranslation(existing);
    return existing;
  }

  async getBookContent(
    translationId: string,
    bookName: string
  ): Promise<Book | null> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: bookKey(translationId, bookName) })
      );
      if (!response.Body) return null;
      const text = await response.Body.transformToString();
      return JSON.parse(text) as Book;
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
      // Book file is genuinely missing — fall back to the manifest stub
      // (metadata only; loading content here would recurse into this method).
      const translation = await this.getTranslation(translationId, false);
      if (translation) {
        return translation.books.find(b => b.name === bookName) || null;
      }
      return null;
    }
  }

  async getChapterContent(
    translationId: string,
    bookName: string,
    chapterNumber: number
  ): Promise<Chapter | null> {
    const book = await this.getBookContent(translationId, bookName);
    if (!book) return null;
    return book.chapters.find(c => c.number === chapterNumber) || null;
  }

  async updateBookPublicationStatus(
    translationId: string,
    bookName: string,
    published: boolean
  ): Promise<void> {
    const translation = await this.getTranslation(translationId);
    if (!translation) throw new Error(`Translation ${translationId} not found`);

    const book = translation.books.find(b => b.name === bookName);
    if (!book) throw new Error(`Book ${bookName} not found`);

    book.published = published;
    await this.saveTranslation(translation);
  }

  async toggleBookPublicationStatus(translationId: string, bookName: string): Promise<boolean> {
    const translation = await this.getTranslation(translationId);
    if (!translation) throw new Error(`Translation ${translationId} not found`);

    const book = translation.books.find(b => b.name === bookName);
    if (!book) throw new Error(`Book ${bookName} not found`);

    const currentStatus = book.published !== undefined ? book.published : true;
    const newStatus = !currentStatus;
    book.published = newStatus;
    await this.saveTranslation(translation);
    return newStatus;
  }

  async bulkUpdateBookPublicationStatus(
    translationId: string,
    bookUpdates: Array<{ bookName: string; published: boolean }>
  ): Promise<void> {
    const translation = await this.getTranslation(translationId);
    if (!translation) throw new Error(`Translation ${translationId} not found`);

    for (const update of bookUpdates) {
      const book = translation.books.find(b => b.name === update.bookName);
      if (book) {
        book.published = update.published;
      }
    }
    await this.saveTranslation(translation);
  }

  async getTranslationsWithPublishedBooks(): Promise<Translation[]> {
    const translations = await this.getAllTranslations();
    return translations.map(t => ({
      ...t,
      books: t.books.filter(b => b.published !== false),
    }));
  }

  async publishBook(translationId: string, bookName: string): Promise<void> {
    await this.updateBookPublicationStatus(translationId, bookName, true);
  }

  async unpublishBook(translationId: string, bookName: string): Promise<void> {
    await this.updateBookPublicationStatus(translationId, bookName, false);
  }

  async deleteBook(translationId: string, bookName: string): Promise<void> {
    const { client, bucketName } = createR2Client();
    await client.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: bookKey(translationId, bookName) })
    );

    // Update metadata to remove the book
    const translation = await this.getTranslation(translationId);
    if (translation) {
      translation.books = translation.books.filter(b => b.name !== bookName);
      await this.saveTranslation(translation);
    }
  }

  async updateBookIntroduction(
    translationId: string,
    bookName: string,
    introduction: string
  ): Promise<void> {
    const translation = await this.getTranslation(translationId);
    if (!translation) throw new Error(`Translation ${translationId} not found`);

    const book = translation.books.find(b => b.name === bookName);
    if (!book) throw new Error(`Book ${bookName} not found`);

    book.introduction = introduction;
    await this.saveTranslation(translation);
  }

  async uploadFile(translationId: string, file: File): Promise<string> {
    const { client, bucketName } = createR2Client();
    const key = rawFileKey(translationId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    );
    return key;
  }

  async uploadRawFile(
    translationId: string,
    fileName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const { client, bucketName } = createR2Client();
    const key = rawFileKey(translationId, fileName);
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return key;
  }

  async getRawFile(translationId: string, fileName: string): Promise<Buffer | null> {
    const { client, bucketName } = createR2Client();
    const key = rawFileKey(translationId, fileName);
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: key })
      );
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  async getRawFileByKey(key: string): Promise<Buffer | null> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: key })
      );
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  subscribeToAllTranslations(callback: (translations: Translation[]) => void): () => void {
    // R2 doesn't support real-time subscriptions; use polling
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        if (R2Repository.isConfigured()) {
          const translations = await this.getAllTranslations();
          if (active) callback(translations);
        }
      } catch (error) {
        console.warn('R2 polling failed:', error);
      }
      if (active) {
        setTimeout(poll, 30000); // Poll every 30 seconds
      }
    };
    poll();
    return () => { active = false; };
  }
}
