export type Verse = { number: number; text: string };
export type Chapter = { number: number; verses: Verse[] };
export type Book = { name: string; chapters: Chapter[]; published?: boolean };
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

// Commentary
export interface CommentaryEntry {
  id: string;
  translationId: string;
  book: string;
  chapter: number;
  verse: number;
  title: string;
  body: string;
  sources?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DevotionalEntry {
  id: string;
  date: string; // ISO string (yyyy-mm-dd)
  title: string;
  summary: string;
  body: string;
  scriptures: Array<{
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  }>;
  reflectionQuestions?: string[];
  prayerFocus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantResponse {
  answer: string;
  verses: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
    translationId: string;
  }>;
  suggestions: string[];
}
// Blog System Types
export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface VideoEmbed {
  id: string;
  platform: 'youtube' | 'vimeo';
  videoId: string;
  embedCode: string;
  thumbnailUrl?: string;
  title?: string;
  position: number; // Position in content
}

export interface BlogPost {
  id: string;
  title: string;
  content: string; // Rich HTML content
  excerpt: string; // Auto-generated or manual
  slug: string; // URL-friendly version of title
  author: string; // Admin user ID
  authorName: string; // Display name
  status: BlogPostStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[]; // Future enhancement
  featuredImage?: string; // Future enhancement
  videoEmbeds: VideoEmbed[];
  seoTitle?: string; // Future enhancement
  seoDescription?: string; // Future enhancement
}

export interface BlogMetadata {
  postsPerPage: number;
  allowComments: boolean;
  moderationEnabled: boolean;
}

// Blog Service Interfaces
export interface BlogServiceInterface {
  createPost(post: Partial<BlogPost>): Promise<BlogPost>;
  updatePost(id: string, updates: Partial<BlogPost>): Promise<void>;
  deletePost(id: string): Promise<void>;
  getPost(id: string): Promise<BlogPost | null>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  getPublishedPosts(limit?: number, offset?: number): Promise<BlogPost[]>;
  getAllPosts(): Promise<BlogPost[]>; // admin only
  publishPost(id: string): Promise<void>;
  unpublishPost(id: string): Promise<void>;
  generateSlug(title: string): string;
}

export interface VideoEmbedResult {
  platform: 'youtube' | 'vimeo' | 'unknown';
  videoId?: string;
  embedCode: string;
  thumbnailUrl?: string;
  title?: string;
  isValid: boolean;
}