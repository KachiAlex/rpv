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

