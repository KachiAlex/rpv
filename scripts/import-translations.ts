/*
  Import full translations (ASV/KJV) into Firestore using Firebase Admin SDK.

  Usage:
    - Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
      or set FIREBASE_ADMIN_CREDENTIALS to a JSON string of the credentials.
    - Place source JSON files under ./datasets (default) or pass paths:
        npm run import:translations -- ./datasets/asv.json ./datasets/kjv.json

  Expected JSON schemas supported:
    1) { translations: Translation[] }
    2) { id: string, name: string, books: Book[] }
    3) { [bookName: string]: { [chapterNumber: string]: { [verseNumber: string]: string } } }
*/

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

type Verse = { number: number; text: string };
type Chapter = { number: number; verses: Verse[] };
type Book = { name: string; chapters: Chapter[] };
type Translation = { id: string; name: string; books: Book[] };

const STANDARD_BOOK_ORDER: string[] = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

function loadCredentials(credsPath?: string) {
  if (credsPath) {
    const raw = fs.readFileSync(path.resolve(credsPath), 'utf-8');
    const json = JSON.parse(raw);
    return admin.credential.cert(json as admin.ServiceAccount);
  }
  const inline = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (inline) {
    const cred = JSON.parse(inline);
    return admin.credential.cert(cred as admin.ServiceAccount);
  }
  // Fallback to GOOGLE_APPLICATION_CREDENTIALS
  return admin.credential.applicationDefault();
}

function ensureFirebase(credsPath?: string) {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: loadCredentials(credsPath),
    });
  }
  return admin.firestore();
}

function normalizeFromMapSchema(id: string, name: string, data: any): Translation {
  const books: Book[] = [];
  for (const bookName of Object.keys(data)) {
    const chaptersRaw = data[bookName];
    const chapters: Chapter[] = [];
    for (const chStr of Object.keys(chaptersRaw)) {
      const chNum = Number(chStr);
      const versesRaw = chaptersRaw[chStr];
      const verses: Verse[] = Object.keys(versesRaw)
        .map(vStr => ({ number: Number(vStr), text: String(versesRaw[vStr]) }))
        .sort((a, b) => a.number - b.number);
      chapters.push({ number: chNum, verses });
    }
    chapters.sort((a, b) => a.number - b.number);
    books.push({ name: bookName, chapters });
  }
  return { id, name, books };
}

function readJson(filePath: string): any {
  const abs = path.resolve(filePath);
  let raw = fs.readFileSync(abs, 'utf-8');
  // Strip UTF-8 BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }
  return JSON.parse(raw);
}

function coerceToTranslations(input: any, fallbackId: string, fallbackName: string): Translation[] {
  // Case 1: already an array of translations
  if (Array.isArray(input?.translations)) {
    return input.translations as Translation[];
  }
  if (Array.isArray(input)) {
    // Detect thiagobodruk schema: array of books with chapters: string[][]
    if (input.length > 0 && input[0]?.chapters && Array.isArray(input[0].chapters)) {
      const books: Book[] = (input as any[]).map((bk, idx) => {
        const name = STANDARD_BOOK_ORDER[idx] || bk.name || `Book ${idx+1}`;
        const chapters: Chapter[] = (bk.chapters as string[][]).map((chapterArr: string[], chIdx: number) => {
          const verses: Verse[] = chapterArr.map((text, vIdx) => ({ number: vIdx + 1, text }));
          return { number: chIdx + 1, verses };
        });
        return { name, chapters };
      });
      return [{ id: fallbackId, name: fallbackName, books }];
    }

    // Otherwise assume already Translation[]
    return input as Translation[];
  }

  // Case 2: single translation object
  if (input && input.books) {
    const t: Translation = {
      id: input.id || fallbackId,
      name: input.name || fallbackName,
      books: input.books,
    };
    return [t];
  }

  // Case 3: map schema Book->Chapter->Verse
  if (input && typeof input === 'object') {
    return [normalizeFromMapSchema(fallbackId, fallbackName, input)];
  }

  throw new Error('Unrecognized JSON schema for translation input');
}

async function saveTranslation(db: admin.firestore.Firestore, t: Translation) {
  const ref = db.collection('translations').doc(t.id);
  await ref.set({ id: t.id, name: t.name }, { merge: true });

  // Save books/chapters/verses in one doc (simple) under a subcollection
  // or as a single document payload depending on your existing repository.
  // Here we mirror existing app expectations: a single doc with full structure.
  await ref.set({ id: t.id, name: t.name, books: t.books }, { merge: true });
}

async function main() {
  const argv = process.argv.slice(2);
  let credsPath: string | undefined;
  const args: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--creds') {
      credsPath = argv[i + 1];
      i++;
    } else {
      args.push(token);
    }
  }

  const db = ensureFirebase(credsPath);

  const inputs = args.length > 0 ? args : [
    path.join(process.cwd(), 'datasets', 'asv.json'),
    path.join(process.cwd(), 'datasets', 'kjv.json'),
  ];

  for (const inputPath of inputs) {
    if (!fs.existsSync(inputPath)) {
      console.warn(`Skipping: ${inputPath} (not found)`);
      continue;
    }
    const data = readJson(inputPath);
    const lower = path.basename(inputPath).toLowerCase();
    const fallbackId = lower.includes('kjv') ? 'kjv' : lower.includes('asv') ? 'asv' : 'unknown';
    const fallbackName = fallbackId.toUpperCase();

    const translations = coerceToTranslations(data, fallbackId, fallbackName);
    for (const t of translations) {
      console.log(`Importing translation: ${t.id} (${t.name}) with ${t.books.length} books`);
      await saveTranslation(db, t);
    }
  }

  console.log('Import complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


