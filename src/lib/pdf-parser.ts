import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { Translation, Book, Chapter, Verse } from './store';

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

function parseBibleText(text: string, bookName: string): Chapter[] {
  const chapters: Chapter[] = [];
  
  // Common patterns for chapter markers
  // Handles: "Chapter 1", "CHAPTER 1", "TITUS 1", "BOOK_NAME 1", "1", "1:"
  const chapterPatterns = [
    /^Chapter\s+(\d+)/i,
    /^CHAPTER\s+(\d+)/i,
    /^[A-Z]+\s+(\d+)$/i,  // "TITUS 1", "BOOK_NAME 1"
    /^(\d+)\s*$/m,         // Standalone "1"
    /^(\d+):\s*$/m,        // "1:"
  ];
  
  // Common patterns for verse markers
  // Handles: "1. Text", "1: Text", "1 Text"
  const versePattern = /^(\d+)[\.\:\s]/m;
  
  // Split text into lines
  const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
  
  let currentChapter: Chapter | null = null;
  let currentVerse: Verse | null = null;
  let verseTextBuffer: string[] = [];
  
  // If document starts with verses (no chapter header), create chapter 1
  const firstLine = lines[0]?.trim() || '';
  const startsWithVerse = /^(\d+)[\.\:\s]+/.test(firstLine);
  const startsWithChapter = chapterPatterns.some(p => p.test(firstLine));
  
  if (startsWithVerse && !startsWithChapter) {
    currentChapter = { number: 1, verses: [] };
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a chapter marker
    let chapterMatch = null;
    for (const pattern of chapterPatterns) {
      chapterMatch = line.match(pattern);
      if (chapterMatch) break;
    }
    
    if (chapterMatch) {
      // Save previous chapter if exists
      if (currentChapter && currentVerse) {
        currentVerse.text = verseTextBuffer.join(' ').trim();
        currentChapter.verses.push(currentVerse);
        currentVerse = null;
        verseTextBuffer = [];
      }
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      
      // Start new chapter
      const chapterNum = parseInt(chapterMatch[1], 10);
      currentChapter = { number: chapterNum, verses: [] };
      continue;
    }
    
    // Check if this line starts with a verse number
    // Handle formats: "1. Text", "1: Text", "1 Text"
    const verseMatch = line.match(/^(\d+)[\.\:\s]+(.+)$/);
    if (verseMatch) {
      // If no chapter exists, create chapter 1
      if (!currentChapter) {
        currentChapter = { number: 1, verses: [] };
      }
      
      // Save previous verse if exists
      if (currentVerse && verseTextBuffer.length > 0) {
        currentVerse.text = verseTextBuffer.join(' ').trim();
        currentChapter.verses.push(currentVerse);
      }
      
      // Start new verse
      const verseNum = parseInt(verseMatch[1], 10);
      const verseText = verseMatch[2].trim(); // Get text after number and separator
      currentVerse = { number: verseNum, text: verseText };
      verseTextBuffer = [verseText];
      continue;
    }
    
    // If we have a current verse, this line is continuation of verse text
    if (currentVerse) {
      verseTextBuffer.push(line);
    } else if (currentChapter) {
      // If we have a chapter but no verse, try to detect verse number at start
      // Handle formats: "1. Text", "1: Text", "1 Text"
      const potentialVerse = line.match(/^(\d+)[\.\:\s]+(.+)$/);
      if (potentialVerse) {
        const verseNum = parseInt(potentialVerse[1], 10);
        const verseText = potentialVerse[2].trim();
        currentVerse = { number: verseNum, text: verseText };
        verseTextBuffer = [verseText];
      }
    }
  }
  
  // Save last verse and chapter
  if (currentVerse && verseTextBuffer.length > 0) {
    currentVerse.text = verseTextBuffer.join(' ').trim();
    currentChapter?.verses.push(currentVerse);
  }
  if (currentChapter && currentChapter.verses.length > 0) {
    chapters.push(currentChapter);
  }
  
  // If no chapters were found, try alternative parsing
  if (chapters.length === 0) {
    return parseAlternativeFormat(text);
  }
  
  return chapters;
}

function parseAlternativeFormat(text: string): Chapter[] {
  const chapters: Chapter[] = [];
  
  // Try to find chapter markers like "TITUS 1", "Chapter 1", "1", etc.
  const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
  let currentChapter: Chapter | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for chapter patterns: "TITUS 1", "Chapter 1", "1", "1:"
    const chapterMatch = trimmed.match(/^(?:[A-Z]+\s+)?(\d+)$/i) || 
                         trimmed.match(/^Chapter\s+(\d+)/i) ||
                         trimmed.match(/^(\d+):\s*$/);
    
    if (chapterMatch && parseInt(chapterMatch[1], 10) <= 150) {
      if (currentChapter && currentChapter.verses.length > 0) {
        chapters.push(currentChapter);
      }
      currentChapter = { number: parseInt(chapterMatch[1], 10), verses: [] };
      continue;
    }
    
    // Check for verse pattern: "1. Text", "1: Text", "1 Text"
    const verseMatch = trimmed.match(/^(\d+)[\.\:\s]+(.+)$/);
    if (verseMatch) {
      // If no chapter yet, create chapter 1
      if (!currentChapter) {
        currentChapter = { number: 1, verses: [] };
      }
      
      const verseNum = parseInt(verseMatch[1], 10);
      const verseText = verseMatch[2].trim();
      if (verseNum <= 200) { // Reasonable verse limit
        currentChapter.verses.push({ number: verseNum, text: verseText });
      }
    }
  }
  
  if (currentChapter && currentChapter.verses.length > 0) {
    chapters.push(currentChapter);
  }
  
  return chapters;
}

