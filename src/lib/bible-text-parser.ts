import type { Chapter, Verse } from './types';

export function parseBibleText(text: string, bookName: string): Chapter[] {
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

  // Split text into lines - preserve empty lines for context but filter completely empty ones
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  let currentChapter: Chapter | null = null;
  let currentVerse: Verse | null = null;
  let verseTextBuffer: string[] = [];

  // If document starts with verses (no chapter header), create chapter 1
  const firstLine = lines[0] || '';
  const startsWithVerse = /^(\d+)[\.\:\s]+/.test(firstLine);
  const startsWithChapter = chapterPatterns.some(p => p.test(firstLine));

  if (startsWithVerse && !startsWithChapter) {
    currentChapter = { number: 1, verses: [] };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a chapter marker
    let chapterMatch = null;
    for (const pattern of chapterPatterns) {
      chapterMatch = line.match(pattern);
      if (chapterMatch) {
        // Make sure it's not just a verse number at the start of a line
        // If line has text after the number, it's likely a verse, not a chapter
        const afterMatch = line.substring(chapterMatch[0].length).trim();
        if (afterMatch.length > 0 && /^[a-zA-Z]/.test(afterMatch)) {
          // Has text after, likely a verse, skip
          chapterMatch = null;
          continue;
        }
        break;
      }
    }

    if (chapterMatch) {
      // Save previous verse if exists
      if (currentChapter && currentVerse) {
        currentVerse.text = verseTextBuffer.join(' ').trim();
        if (currentVerse.text) {
          currentChapter.verses.push(currentVerse);
        }
        currentVerse = null;
        verseTextBuffer = [];
      }

      // Save previous chapter if exists
      if (currentChapter && currentChapter.verses.length > 0) {
        chapters.push(currentChapter);
      }

      // Start new chapter
      const chapterNum = parseInt(chapterMatch[1], 10);
      currentChapter = { number: chapterNum, verses: [] };
      continue;
    }

    // Check if this line starts with a verse number
    // Handle formats: "1. Text", "1: Text", "1 Text", "1 Text here", "1Text" (no space)
    const verseMatch = line.match(/^(\d+)[\.\:\s]+(.+)$/) || line.match(/^(\d+)([a-zA-Z].+)$/);
    if (verseMatch) {
      // If no chapter exists, create chapter 1
      if (!currentChapter) {
        currentChapter = { number: 1, verses: [] };
      }

      // Save previous verse if exists
      if (currentVerse) {
        currentVerse.text = verseTextBuffer.join(' ').trim();
        if (currentVerse.text) {
          currentChapter.verses.push(currentVerse);
        }
      }

      // Start new verse
      const verseNum = parseInt(verseMatch[1], 10);
      // Get text after number and separator (handle both formats)
      const verseText = verseMatch[2] ? verseMatch[2].trim() : '';
      currentVerse = { number: verseNum, text: verseText };
      verseTextBuffer = verseText ? [verseText] : [];
      continue;
    }

    // If we have a current verse, this line is continuation of verse text
    // This handles verses that span multiple lines
    if (currentVerse) {
      // Check if this line might be a new verse (starts with a number)
      const potentialNewVerse = line.match(/^(\d+)[\.\:\s]+(.+)$/) || line.match(/^(\d+)([a-zA-Z].+)$/);
      if (potentialNewVerse) {
        const potentialVerseNum = parseInt(potentialNewVerse[1], 10);
        const potentialText = potentialNewVerse[2] ? potentialNewVerse[2].trim() : '';

        // If this verse number is greater than current, it's likely a new verse
        const isSequential = potentialVerseNum === currentVerse.number + 1;
        const isWithinRange = potentialVerseNum > currentVerse.number && potentialVerseNum <= currentVerse.number + 50;
        const isReset = potentialVerseNum === 1 && currentVerse.number > 10;

        if (isSequential || isWithinRange || isReset) {
          // Save current verse
          currentVerse.text = verseTextBuffer.join(' ').trim();
          if (currentVerse.text) {
            currentChapter?.verses.push(currentVerse);
          }

          // Start new verse
          currentVerse = { number: potentialVerseNum, text: potentialText };
          verseTextBuffer = potentialText ? [potentialText] : [];
          continue;
        }
      }

      // Otherwise, continue accumulating verse text
      verseTextBuffer.push(line);
    } else if (currentChapter) {
      // If we have a chapter but no verse, try to detect verse number at start
      const potentialVerse = line.match(/^(\d+)[\.\:\s]+(.+)$/) || line.match(/^(\d+)([a-zA-Z].+)$/);
      if (potentialVerse) {
        const verseNum = parseInt(potentialVerse[1], 10);
        const verseText = potentialVerse[2] ? potentialVerse[2].trim() : '';
        currentVerse = { number: verseNum, text: verseText };
        verseTextBuffer = verseText ? [verseText] : [];
      }
    }
  }

  // Save last verse and chapter
  if (currentVerse) {
    currentVerse.text = verseTextBuffer.join(' ').trim();
    if (currentVerse.text && currentChapter) {
      currentChapter.verses.push(currentVerse);
    }
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

export function parseAlternativeFormat(text: string): Chapter[] {
  const chapters: Chapter[] = [];

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
      if (!currentChapter) {
        currentChapter = { number: 1, verses: [] };
      }

      const verseNum = parseInt(verseMatch[1], 10);
      const verseText = verseMatch[2].trim();
      if (verseNum <= 200) {
        currentChapter.verses.push({ number: verseNum, text: verseText });
      }
    }
  }

  if (currentChapter && currentChapter.verses.length > 0) {
    chapters.push(currentChapter);
  }

  return chapters;
}
