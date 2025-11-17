export interface AudioBibleOptions {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  voice?: SpeechSynthesisVoice;
}

export class AudioBibleService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private currentText: string = '';
  private onVerseChange?: (verseNumber: number) => void;
  private verseMapping: Map<number, { start: number; end: number }> = new Map();
  private isPlaying: boolean = false;
  private options: AudioBibleOptions = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  constructor() {
    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isAvailable()) return [];
    return speechSynthesis.getVoices();
  }

  async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve([]);
        return;
      }

      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        speechSynthesis.addEventListener('voiceschanged', () => {
          resolve(speechSynthesis.getVoices());
        }, { once: true });
      }
    });
  }

  setOptions(options: Partial<AudioBibleOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.utterance) {
      if (options.rate !== undefined) this.utterance.rate = options.rate;
      if (options.pitch !== undefined) this.utterance.pitch = options.pitch;
      if (options.volume !== undefined) this.utterance.volume = options.volume;
      if (options.voice !== undefined) this.utterance.voice = options.voice;
    }
  }

  setOnVerseChange(callback: (verseNumber: number) => void): void {
    this.onVerseChange = callback;
  }

  private verseQueue: Array<{ number: number; text: string }> = [];
  private currentVerseIndex: number = 0;
  private isQueuePlaying: boolean = false;

  prepareText(verses: Array<{ number: number; text: string }>): string {
    this.verseMapping.clear();
    const parts: string[] = [];

    verses.forEach(verse => {
      const verseText = verse.text ? `Verse ${verse.number}. ${verse.text}` : '';
      if (verseText) {
        parts.push(verseText);
      }
    });

    this.currentText = parts.join(' ');
    return this.currentText;
  }

  play(
    verses: Array<{ number: number; text: string }>,
    startFromVerse?: number
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Text-to-speech is not available in this browser');
    }

    this.stop();

    // Filter out verses without text
    const validVerses = verses.filter(v => v.text && v.text.trim());
    if (validVerses.length === 0) {
      throw new Error('No text to speak');
    }

    // Find start index if specified
    let startIndex = 0;
    if (startFromVerse) {
      const foundIndex = validVerses.findIndex(v => v.number === startFromVerse);
      if (foundIndex >= 0) {
        startIndex = foundIndex;
      }
    }

    this.verseQueue = validVerses.slice(startIndex);
    this.currentVerseIndex = 0;
    this.isQueuePlaying = true;

    return this.playNextVerse();
  }

  private playNextVerse(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isQueuePlaying || this.currentVerseIndex >= this.verseQueue.length) {
        this.isQueuePlaying = false;
        this.isPlaying = false;
        resolve();
        return;
      }

      const verse = this.verseQueue[this.currentVerseIndex];
      const text = verse.text ? `Verse ${verse.number}. ${verse.text}` : '';

      if (!text.trim()) {
        // Skip empty verses
        this.currentVerseIndex++;
        return this.playNextVerse().then(resolve).catch(reject);
      }

      // Notify verse change
      if (this.onVerseChange) {
        this.onVerseChange(verse.number);
      }

      this.utterance = new SpeechSynthesisUtterance(text);

      // Set options
      this.utterance.rate = this.options.rate || 1.0;
      this.utterance.pitch = this.options.pitch || 1.0;
      this.utterance.volume = this.options.volume || 1.0;
      if (this.options.voice) {
        this.utterance.voice = this.options.voice;
      }

      this.utterance.onstart = () => {
        this.isPlaying = true;
      };

      this.utterance.onend = () => {
        this.currentVerseIndex++;
        if (this.isQueuePlaying && this.currentVerseIndex < this.verseQueue.length) {
          // Play next verse
          this.playNextVerse().then(resolve).catch(reject);
        } else {
          // Finished
          this.isQueuePlaying = false;
          this.isPlaying = false;
          this.utterance = null;
          resolve();
        }
      };

      this.utterance.onerror = (event) => {
        this.isQueuePlaying = false;
        this.isPlaying = false;
        this.utterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      speechSynthesis.speak(this.utterance);
    });
  }

  pause(): void {
    if (!this.isAvailable()) return;
    
    if (this.isPlaying) {
      speechSynthesis.pause();
      this.isPlaying = false;
    }
  }

  resume(): void {
    if (!this.isAvailable()) return;
    
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      this.isPlaying = true;
    }
  }

  stop(): void {
    if (!this.isAvailable()) return;
    
    speechSynthesis.cancel();
    this.isPlaying = false;
    this.isQueuePlaying = false;
    this.currentVerseIndex = 0;
    this.verseQueue = [];
    this.utterance = null;
  }

  getPlayingState(): 'playing' | 'paused' | 'stopped' {
    if (!this.isAvailable()) return 'stopped';
    
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      return 'playing';
    } else if (speechSynthesis.paused) {
      return 'paused';
    } else {
      return 'stopped';
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying && this.getPlayingState() === 'playing';
  }
}

