export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { name: string; chapters: Chapter[] };
export type Translation = { 
  id: string; 
  name: string; 
  books: Book[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type Reference = { book: string; chapter: number; verse: number };

export type ProjectorRef = {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  timestamp?: Date;
};

// Verse Highlighting
export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface Highlight {
  id: string;
  userId: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Reading Plans
export interface DailyReading {
  day: number;
  references: Array<{
    book: string;
    chapter: number;
    verses?: [number, number]; // optional verse range
  }>;
  notes?: string;
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  dailyReadings: DailyReading[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean; // whether plan is available to all users
  createdBy?: string; // userId of creator
}

export interface UserReadingPlanProgress {
  id: string;
  userId: string;
  planId: string;
  startDate: Date;
  completedDays: number[]; // array of day numbers completed
  currentDay: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cross-References
export interface CrossReference {
  id: string;
  fromTranslationId: string;
  fromBook: string;
  fromChapter: number;
  fromVerse: number;
  toTranslationId?: string; // optional, defaults to same translation
  toBook: string;
  toChapter: number;
  toVerse: number;
  type?: 'quotation' | 'similar' | 'parallel' | 'related'; // type of reference
  note?: string;
}

