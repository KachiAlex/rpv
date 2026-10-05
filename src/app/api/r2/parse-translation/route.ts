import { NextRequest, NextResponse } from 'next/server';
import { R2Repository } from '@/lib/repositories/r2-repository';
import { verifyBearerToken } from '@/lib/server-auth';
import { parseBibleText } from '@/lib/bible-text-parser';
import type { Translation, Chapter } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    const user = await verifyBearerToken(request);
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

async function extractText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileName.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }

  if (fileName.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (fileName.endsWith('.pdf')) {
    // pdf-parse is used server-side because pdfjs-dist requires DOM APIs
    // that are unavailable in the Node.js runtime.
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  throw new Error('Unsupported file type. Upload a PDF, DOCX, or TXT file.');
}

// POST /api/r2/parse-translation — parse a Bible document and merge it into R2.
// Accepts multipart: file (PDF/DOCX/TXT/JSON), translationId, translationName, bookName.
// JSON files may contain a full Translation object ({ id, name, books: [...] }).
export async function POST(request: NextRequest) {
  try {
    if (!R2Repository.isConfigured()) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
    }
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const translationId = (formData.get('translationId') as string || '').trim();
    const translationName = (formData.get('translationName') as string || '').trim() || translationId;
    const bookName = (formData.get('bookName') as string || '').trim();

    if (!file || !translationId) {
      return NextResponse.json({ error: 'Missing file or translationId' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Maximum file size is 50MB' }, { status: 400 });
    }

    const repo = new R2Repository();
    const fileName = file.name.toLowerCase();
    let translation: Translation;

    if (fileName.endsWith('.json')) {
      // Structured translation JSON — pass straight through to the merge
      const raw = JSON.parse(await file.text());
      const source = raw.translations?.[0] || raw.translation || raw;
      if (!Array.isArray(source.books) || source.books.length === 0) {
        return NextResponse.json({ error: 'JSON does not contain books' }, { status: 400 });
      }
      translation = {
        ...source,
        id: translationId,
        name: translationName,
        books: bookName
          ? source.books.filter((b: any) => b.name.toLowerCase() === bookName.toLowerCase())
          : source.books,
      };
      if (translation.books.length === 0) {
        return NextResponse.json({ error: `No book named "${bookName}" in the JSON file` }, { status: 400 });
      }
    } else {
      if (!bookName) {
        return NextResponse.json({ error: 'bookName is required for PDF/DOCX/TXT uploads' }, { status: 400 });
      }
      const text = await extractText(file);
      const chapters: Chapter[] = parseBibleText(text, bookName);
      if (chapters.length === 0) {
        return NextResponse.json(
          { error: 'No chapters or verses could be parsed from the document. Check the formatting tips.' },
          { status: 422 }
        );
      }
      translation = {
        id: translationId,
        name: translationName,
        books: [{ name: bookName, chapters }],
      };
    }

    // Merge-safe write — other translations and books are untouched
    const merged = await repo.mergeTranslation(translation);
    const books = merged.books.filter((b) =>
      translation.books.some((tb) => tb.name === b.name)
    );
    const chaptersCount = books.reduce((sum, b) => sum + b.chapters.length, 0);
    const versesCount = books.reduce(
      (sum, b) => sum + b.chapters.reduce((s, c) => s + c.verses.length, 0),
      0
    );

    return NextResponse.json({
      success: true,
      translationId,
      booksImported: translation.books.map((b) => b.name),
      chaptersCount,
      versesCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[R2 API] parse-translation error:', message);
    return NextResponse.json(
      { error: 'Failed to parse document', details: message },
      { status: 500 }
    );
  }
}
