/**
 * Voice recognition utility for parsing Bible references from speech
 */

export interface ParsedReference {
  book: string | null;
  chapter: number | null;
  verse: number | null;
  confidence: number;
}

// Common Bible book names (both full and abbreviated)
const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

// Abbreviations mapping
const BOOK_ABBREVIATIONS: Record<string, string> = {
  'gen': 'Genesis', 'exo': 'Exodus', 'ex': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deu': 'Deuteronomy',
  'jos': 'Joshua', 'josh': 'Joshua', 'jdg': 'Judges', 'judges': 'Judges', 'rut': 'Ruth', '1sa': '1 Samuel', '1 sam': '1 Samuel',
  '2sa': '2 Samuel', '2 sam': '2 Samuel', '1ki': '1 Kings', '1 kin': '1 Kings', '2ki': '2 Kings', '2 kin': '2 Kings',
  '1ch': '1 Chronicles', '1 chr': '1 Chronicles', '2ch': '2 Chronicles', '2 chr': '2 Chronicles', 'ezr': 'Ezra',
  'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job', 'psa': 'Psalms', 'ps': 'Psalms', 'pro': 'Proverbs', 'ecc': 'Ecclesiastes',
  'sng': 'Song of Solomon', 'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezk': 'Ezekiel', 'dan': 'Daniel',
  'hos': 'Hosea', 'joe': 'Joel', 'amo': 'Amos', 'oba': 'Obadiah', 'jon': 'Jonah', 'mic': 'Micah', 'nam': 'Nahum',
  'hab': 'Habakkuk', 'zep': 'Zephaniah', 'hag': 'Haggai', 'zec': 'Zechariah', 'mal': 'Malachi',
  'mat': 'Matthew', 'matt': 'Matthew', 'mrk': 'Mark', 'mar': 'Mark', 'luk': 'Luke', 'jhn': 'John', 'joh': 'John',
  'act': 'Acts', 'rom': 'Romans', '1co': '1 Corinthians', '1 cor': '1 Corinthians', '2co': '2 Corinthians', '2 cor': '2 Corinthians',
  'gal': 'Galatians', 'eph': 'Ephesians', 'php': 'Philippians', 'phi': 'Philippians', 'col': 'Colossians',
  '1th': '1 Thessalonians', '1 the': '1 Thessalonians', '2th': '2 Thessalonians', '2 the': '2 Thessalonians',
  '1ti': '1 Timothy', '1 tim': '1 Timothy', '2ti': '2 Timothy', '2 tim': '2 Timothy', 'tit': 'Titus', 'phm': 'Philemon',
  'heb': 'Hebrews', 'jam': 'James', 'jas': 'James', '1pe': '1 Peter', '1 pet': '1 Peter', '2pe': '2 Peter', '2 pet': '2 Peter',
  '1jo': '1 John', '1 joh': '1 John', '2jo': '2 John', '2 joh': '2 John', '3jo': '3 John', '3 joh': '3 John',
  'jud': 'Jude', 'rev': 'Revelation', 're': 'Revelation'
};

/**
 * Normalize book name - try to match against known books
 */
function normalizeBookName(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  
  if (!normalized) return null;
  
  console.log('[VoiceRecognition] Normalizing book name:', text);
  
  // Direct match
  const directMatch = BIBLE_BOOKS.find(book => book.toLowerCase() === normalized);
  if (directMatch) {
    console.log('[VoiceRecognition] Direct match:', directMatch);
    return directMatch;
  }
  
  // Check abbreviations
  if (BOOK_ABBREVIATIONS[normalized]) {
    console.log('[VoiceRecognition] Abbreviation match:', BOOK_ABBREVIATIONS[normalized]);
    return BOOK_ABBREVIATIONS[normalized];
  }
  
  // Remove common words that might interfere
  const cleaned = normalized.replace(/\b(the|a|an|of|and|or)\b/g, '').trim();
  
  // Try partial match (e.g., "john" matches "John", "first john" matches "1 John")
  const partialMatch = BIBLE_BOOKS.find(book => {
    const bookLower = book.toLowerCase();
    const bookWords = bookLower.split(/\s+/);
    const textWords = cleaned.split(/\s+/);
    
    // Check if all text words are in book name
    const allWordsMatch = textWords.every(word => 
      bookWords.some(bw => bw.startsWith(word) || word.startsWith(bw))
    );
    
    // Check if book name starts with text
    const startsWith = bookLower.startsWith(cleaned) || cleaned.startsWith(bookWords[0]);
    
    // Check if text contains key words from book name
    const containsKeyWords = bookWords.some(bw => cleaned.includes(bw)) || 
                             textWords.some(tw => bookLower.includes(tw));
    
    return allWordsMatch || startsWith || containsKeyWords;
  });
  
  if (partialMatch) {
    console.log('[VoiceRecognition] Partial match:', partialMatch);
    return partialMatch;
  }
  
  // Try fuzzy match - check if text contains book name or vice versa
  const fuzzyMatch = BIBLE_BOOKS.find(book => {
    const bookLower = book.toLowerCase();
    // Remove numbers for fuzzy matching
    const bookNoNum = bookLower.replace(/^\d+\s*/, '');
    const textNoNum = cleaned.replace(/^\d+\s*/, '');
    
    return bookNoNum.includes(textNoNum) || textNoNum.includes(bookNoNum) ||
           bookLower.split(/\s+/).some(word => textNoNum.includes(word)) ||
           cleaned.split(/\s+/).some(word => bookNoNum.includes(word));
  });
  
  if (fuzzyMatch) {
    console.log('[VoiceRecognition] Fuzzy match:', fuzzyMatch);
    return fuzzyMatch;
  }
  
  console.warn('[VoiceRecognition] No match found for:', text);
  return null;
}

/**
 * Parse Bible reference from text
 * Handles formats like:
 * - "John 3:16"
 * - "John chapter 3 verse 16"
 * - "John three sixteen"
 * - "John 3 16"
 * - "John chapter three verse sixteen" (word numbers)
 */
export function parseBibleReference(text: string): ParsedReference {
  console.log('[VoiceRecognition] Parsing text:', text);
  
  // Clean and normalize the text
  let cleanedText = text.trim();
  // Remove common speech artifacts but keep "the" if it's part of a book name
  cleanedText = cleanedText.replace(/\b(uh|um|ah|er)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  
  console.log('[VoiceRecognition] Cleaned text:', cleanedText);
  
  let book: string | null = null;
  let chapter: number | null = null;
  let verse: number | null = null;
  let confidence = 0;

  // Word to number mapping for speech recognition
  const wordToNumber: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
    'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100
  };

  // Convert word numbers to digits
  const convertWordToNumber = (word: string): number | null => {
    const lower = word.toLowerCase();
    if (wordToNumber[lower]) return wordToNumber[lower];
    const num = parseInt(word, 10);
    return isNaN(num) ? null : num;
  };

  // Pattern 1: "Book Chapter:Verse" (e.g., "John 3:16", "John 3 verse 16", "John three colon sixteen")
  // More flexible - allows "colon", "verse", or just whitespace
  const pattern1 = /^(.+?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s*(?:[:]|colon|verse|verses|versus)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)/i;
  const match1 = cleanedText.match(pattern1);
  if (match1) {
    const bookPart = match1[1].trim();
    book = normalizeBookName(bookPart);
    const chNum = convertWordToNumber(match1[2].trim());
    const vNum = convertWordToNumber(match1[3].trim());
    console.log('[VoiceRecognition] Pattern 1 match:', { bookPart, book, chNum, vNum });
    if (book && chNum !== null && vNum !== null) {
      confidence = 0.9;
      return { book, chapter: chNum, verse: vNum, confidence };
    }
  }

  // Pattern 2: "Book Chapter Verse" (e.g., "John 3 16", "John three sixteen")
  const pattern2 = /^(.+?)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)/i;
  const match2 = cleanedText.match(pattern2);
  if (match2) {
    book = normalizeBookName(match2[1].trim());
    const chNum = convertWordToNumber(match2[2].trim());
    const vNum = convertWordToNumber(match2[3].trim());
    if (book && chNum !== null && vNum !== null) {
      confidence = 0.85;
      return { book, chapter: chNum, verse: vNum, confidence };
    }
  }

  // Pattern 3: "Book chapter X verse Y" (e.g., "John chapter 3 verse 16", "John chapter three verse sixteen")
  const pattern3 = /^(.+?)\s+chapter\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s+verse\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)/i;
  const match3 = cleanedText.match(pattern3);
  if (match3) {
    book = normalizeBookName(match3[1].trim());
    const chNum = convertWordToNumber(match3[2].trim());
    const vNum = convertWordToNumber(match3[3].trim());
    if (book && chNum !== null && vNum !== null) {
      confidence = 0.9;
      return { book, chapter: chNum, verse: vNum, confidence };
    }
  }

  // Pattern 4: Try to find book name and numbers separately (more lenient)
  const words = cleanedText.split(/\s+/);
  const numbers: number[] = [];
  const bookWords: string[] = [];
  
  for (const word of words) {
    const num = convertWordToNumber(word);
    if (num !== null) {
      numbers.push(num);
    } else {
      // Skip common words that aren't part of book names
      const lower = word.toLowerCase();
      if (!['chapter', 'verse', 'verses', 'versus', 'colon', 'and', 'a', 'an', 'of'].includes(lower)) {
        bookWords.push(word);
      }
    }
  }
  
  console.log('[VoiceRecognition] Pattern 4 - words:', words, 'bookWords:', bookWords, 'numbers:', numbers);
  
  // If we have at least 1 book word and 2+ numbers, try to match
  if (bookWords.length > 0 && numbers.length >= 2) {
    // Try different combinations of book words (start from end to catch "1 John" type books)
    for (let i = bookWords.length; i >= 1; i--) {
      const potentialBook = bookWords.slice(0, i).join(' ');
      const normalized = normalizeBookName(potentialBook);
      console.log('[VoiceRecognition] Trying book:', potentialBook, '->', normalized);
      if (normalized) {
        book = normalized;
        chapter = numbers[0];
        verse = numbers[1];
        confidence = 0.75;
        console.log('[VoiceRecognition] Pattern 4 success:', { book, chapter, verse });
        return { book, chapter, verse, confidence };
      }
    }
    
    // Also try with "the" prefix (e.g., "the John 3 16")
    if (bookWords.length > 1 && bookWords[0].toLowerCase() === 'the') {
      for (let i = bookWords.length; i >= 2; i--) {
        const potentialBook = bookWords.slice(1, i).join(' ');
        const normalized = normalizeBookName(potentialBook);
        if (normalized) {
          book = normalized;
          chapter = numbers[0];
          verse = numbers[1];
          confidence = 0.7;
          console.log('[VoiceRecognition] Pattern 4 (with "the") success:', { book, chapter, verse });
          return { book, chapter, verse, confidence };
        }
      }
    }
  }

  console.warn('[VoiceRecognition] Failed to parse:', text);
  return { book: null, chapter: null, verse: null, confidence: 0 };
}

/**
 * Speech Recognition hook
 */
export class VoiceRecognition {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (text: string) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true; // Show interim results for better feedback
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3; // Get multiple alternatives

        this.recognition.onresult = (event: any) => {
          console.log('[VoiceRecognition] Result event:', event);
          
          // Get the final result (most confident)
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Use final transcript if available, otherwise use interim
          const transcript = finalTranscript || interimTranscript;
          console.log('[VoiceRecognition] Transcript:', { final: finalTranscript, interim: interimTranscript, used: transcript });
          
          if (transcript && this.onResultCallback) {
            this.onResultCallback(transcript.trim());
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('[VoiceRecognition] Error:', event);
          this.isListening = false;
          
          let errorMessage = 'Speech recognition error: ';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please speak clearly into your microphone.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found or microphone not accessible. Please check your microphone connection.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            case 'aborted':
              errorMessage = 'Speech recognition was aborted.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service not allowed. Please check your browser settings.';
              break;
            default:
              errorMessage += event.error || 'Unknown error';
          }
          
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error(errorMessage));
          }
        };

        this.recognition.onend = () => {
          console.log('[VoiceRecognition] Recognition ended');
          this.isListening = false;
        };
        
        this.recognition.onstart = () => {
          console.log('[VoiceRecognition] Recognition started - microphone is active');
        };
        
        this.recognition.onspeechstart = () => {
          console.log('[VoiceRecognition] Speech detected');
        };
        
        this.recognition.onspeechend = () => {
          console.log('[VoiceRecognition] Speech ended');
        };
        
        this.recognition.onsoundstart = () => {
          console.log('[VoiceRecognition] Sound detected');
        };
        
        this.recognition.onsoundend = () => {
          console.log('[VoiceRecognition] Sound ended');
        };
      }
    }
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }

  async start(onResult: (text: string) => void, onError?: (error: Error) => void): Promise<void> {
    if (!this.recognition) {
      console.error('[VoiceRecognition] Speech recognition not supported');
      if (onError) {
        onError(new Error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.'));
      }
      return;
    }

    // Check and request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[VoiceRecognition] Microphone access granted');
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (permissionError: any) {
      console.error('[VoiceRecognition] Microphone permission denied:', permissionError);
      this.isListening = false;
      if (onError) {
        let errorMessage = 'Microphone access denied. ';
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          errorMessage += 'Please allow microphone access in your browser settings and try again.';
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else {
          errorMessage += permissionError.message || 'Unknown error';
        }
        onError(new Error(errorMessage));
      }
      return;
    }

    // Stop if already listening
    if (this.isListening) {
      console.log('[VoiceRecognition] Stopping previous recognition');
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('[VoiceRecognition] Error stopping previous recognition:', e);
        // Ignore errors when stopping
      }
      this.isListening = false;
    }

    // Wait a bit before starting to ensure previous instance is fully stopped
    setTimeout(() => {
      try {
        console.log('[VoiceRecognition] Starting recognition...');
        this.onResultCallback = onResult;
        this.onErrorCallback = onError;
        this.isListening = true;
        this.recognition.start();
        console.log('[VoiceRecognition] Recognition started successfully');
        
        // Set a timeout to handle cases where no speech is detected
        // Speech recognition typically times out after 5-10 seconds of silence
        // We'll add an additional safety timeout
        setTimeout(() => {
          if (this.isListening) {
            console.log('[VoiceRecognition] Timeout - no speech detected, stopping recognition');
            try {
              this.recognition.stop();
            } catch (e) {
              // Ignore errors when stopping
            }
            this.isListening = false;
            if (this.onErrorCallback) {
              this.onErrorCallback(new Error('No speech detected. Please speak clearly into your microphone.'));
            }
          }
        }, 15000); // 15 second timeout
      } catch (error: any) {
        console.error('[VoiceRecognition] Failed to start:', error);
        this.isListening = false;
        if (onError) {
          let errorMessage = 'Failed to start speech recognition. ';
          if (error.name === 'InvalidStateError') {
            errorMessage += 'Recognition is already running. Please wait a moment and try again.';
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Unknown error occurred.';
          }
          onError(new Error(errorMessage));
        }
      }
    }, 200); // Increased delay to ensure clean restart
  }

  stop(): void {
    if (this.recognition) {
      try {
        if (this.isListening) {
          this.recognition.stop();
        }
      } catch (e) {
        // Ignore errors when stopping
      } finally {
        this.isListening = false;
      }
    }
  }

  isActive(): boolean {
    return this.isListening;
  }
}

