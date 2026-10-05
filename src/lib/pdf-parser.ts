import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { Translation, Book, Chapter, Verse } from './types';
import { parseBibleText } from './bible-text-parser';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Use CDN for worker in browser
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export async function parseDocument(file: File, translationId: string, translationName: string, bookName: string): Promise<Translation> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  let fullText = '';
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    // Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    // Parse DOCX
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    fullText = result.value;
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Please upload a PDF or DOCX file.`);
  }
  
  // Parse chapters and verses
  const chapters = parseBibleText(fullText, bookName);
  
  // Debug: Log parsing results
  const totalChapters = chapters.length;
  const totalVerses = chapters.reduce((sum, ch) => sum + ch.verses.length, 0);
  console.log(`Parsed ${totalChapters} chapters with ${totalVerses} total verses`);
  chapters.forEach((ch, idx) => {
    console.log(`Chapter ${ch.number}: ${ch.verses.length} verses`);
  });
  
  return {
    id: translationId,
    name: translationName,
    books: [{
      name: bookName,
      chapters
    }]
  };
}

// Keep old function name for backward compatibility
export async function parsePDF(file: File, translationId: string, translationName: string, bookName: string): Promise<Translation> {
  return parseDocument(file, translationId, translationName, bookName);
}
