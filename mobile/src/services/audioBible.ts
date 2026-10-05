import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface AudioBibleVerse {
  number: number;
  text: string;
}

export interface AudioBibleOptions {
  rate?: number;
  pitch?: number;
}

type VerseChangeCallback = (verseNumber: number) => void;
type StateCallback = (playing: boolean, paused: boolean) => void;

// TTS-backed audio bible — mobile equivalent of the web AudioBibleService
// (which wraps window.speechSynthesis).
// NOTE: Speech.pause()/resume() are iOS-only, so pause is implemented as
// stop-at-current-verse and resume restarts from that verse.
class AudioBible {
  private queue: AudioBibleVerse[] = [];
  private index = 0;
  private playing = false;
  private paused = false;
  private options: Required<AudioBibleOptions> = { rate: 1.0, pitch: 1.0 };
  private onVerse: VerseChangeCallback | null = null;
  private onState: StateCallback | null = null;
  private stopped = false;

  setCallbacks(onVerse: VerseChangeCallback | null, onState: StateCallback | null): void {
    this.onVerse = onVerse;
    this.onState = onState;
  }

  setOptions(options: AudioBibleOptions): void {
    this.options = { ...this.options, ...options };
  }

  private notify(): void {
    this.onState?.(this.playing, this.paused);
  }

  async play(verses: AudioBibleVerse[], startIndex = 0): Promise<void> {
    Speech.stop();
    this.queue = verses;
    this.index = startIndex;
    this.playing = true;
    this.paused = false;
    this.stopped = false;
    this.notify();
    this.speakCurrent();
  }

  private speakCurrent(): void {
    if (this.stopped || this.paused || this.index >= this.queue.length) {
      this.playing = false;
      this.paused = false;
      this.notify();
      return;
    }
    const verse = this.queue[this.index];
    this.onVerse?.(verse.number);
    Speech.speak(verse.text, {
      rate: this.options.rate,
      pitch: this.options.pitch,
      onDone: () => {
        if (this.stopped || this.paused) return;
        this.index += 1;
        this.speakCurrent();
      },
      onStopped: () => {},
      onError: () => {
        this.playing = false;
        this.paused = false;
        this.notify();
      },
    });
  }

  pause(): void {
    if (!this.playing || this.paused) return;
    this.paused = true;
    if (Platform.OS === 'ios') {
      Speech.pause();
    } else {
      Speech.stop();
    }
    this.notify();
  }

  resume(): void {
    if (!this.playing || !this.paused) return;
    this.paused = false;
    this.notify();
    if (Platform.OS === 'ios') {
      Speech.resume();
    } else {
      this.speakCurrent();
    }
  }

  stop(): void {
    this.stopped = true;
    Speech.stop();
    this.queue = [];
    this.index = 0;
    this.playing = false;
    this.paused = false;
    this.notify();
  }

  isSpeaking(): boolean {
    return this.playing && !this.paused;
  }
}

export default new AudioBible();
