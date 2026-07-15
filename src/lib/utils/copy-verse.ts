export interface VerseToCopy {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translationName?: string;
}

export interface CopyOptions {
  includeReference?: boolean;
  includeTranslation?: boolean;
  format?: 'default' | 'compact' | 'full';
  separator?: string;
}

export function formatVerseForCopy(
  verse: VerseToCopy,
  options: CopyOptions = {}
): string {
  const {
    includeReference = true,
    includeTranslation = false,
    format = 'default',
    separator = '\n',
  } = options;

  let reference = '';
  if (includeReference) {
    reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
  }

  let formatted = '';
  
  switch (format) {
    case 'compact':
      // Format: "Book Chapter:Verse Text"
      formatted = reference ? `${reference} ${verse.text}` : verse.text;
      break;
    
    case 'full':
      // Format: "Book Chapter:Verse\nText"
      if (includeTranslation && verse.translationName) {
        formatted = `${verse.translationName}\n${reference}\n${verse.text}`;
      } else {
        formatted = reference ? `${reference}\n${verse.text}` : verse.text;
      }
      break;
    
    case 'default':
    default:
      // Format: "Book Chapter:Verse - Text"
      if (includeTranslation && verse.translationName) {
        formatted = `${verse.translationName} - ${reference} - ${verse.text}`;
      } else {
        formatted = reference ? `${reference} - ${verse.text}` : verse.text;
      }
      break;
  }

  return formatted;
}

export function formatVersesForCopy(
  verses: VerseToCopy[],
  options: CopyOptions = {}
): string {
  const {
    includeReference = true,
    includeTranslation = false,
    format = 'default',
    separator = '\n\n',
  } = options;

  if (verses.length === 0) return '';
  
  if (verses.length === 1) {
    return formatVerseForCopy(verses[0], options);
  }

  // Multiple verses - format with range or individually
  const sortedVerses = [...verses].sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });

  const first = sortedVerses[0];
  const last = sortedVerses[sortedVerses.length - 1];
  
  // Check if verses are consecutive
  const isConsecutive = sortedVerses.every((verse, index) => {
    if (index === 0) return true;
    const prev = sortedVerses[index - 1];
    return verse.chapter === prev.chapter && verse.verse === prev.verse + 1;
  });

  let header = '';
  if (isConsecutive && first.chapter === last.chapter) {
    // Same chapter, consecutive verses
    if (first.verse === last.verse) {
      header = `${first.book} ${first.chapter}:${first.verse}`;
    } else {
      header = `${first.book} ${first.chapter}:${first.verse}-${last.verse}`;
    }
  } else {
    // Multiple chapters or non-consecutive
    header = `${first.book} ${first.chapter}:${first.verse}${sortedVerses.length > 1 ? `-${last.chapter}:${last.verse}` : ''}`;
  }

  if (includeTranslation && first.translationName) {
    header = `${first.translationName} - ${header}`;
  }

  const formattedVerses = sortedVerses.map(v => {
    if (format === 'compact') {
      return `${v.book} ${v.chapter}:${v.verse} ${v.text}`;
    } else if (format === 'full') {
      return `${v.book} ${v.chapter}:${v.verse}\n${v.text}`;
    } else {
      return `${v.book} ${v.chapter}:${v.verse} - ${v.text}`;
    }
  });

  return `${header}\n\n${formattedVerses.join(separator)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

