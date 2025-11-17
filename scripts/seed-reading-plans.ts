/**
 * Script to seed sample reading plans into Firestore
 * Run with: npx ts-node scripts/seed-reading-plans.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get service account key from environment or default location
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '..', 'redemptionprojectversion-firebase-adminsdk-fbsvc-05e915ed68.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Make sure GOOGLE_APPLICATION_CREDENTIALS is set or service account key is in the scripts directory');
    process.exit(1);
  }
}

const db = admin.firestore();

interface DailyReading {
  day: number;
  references: Array<{
    book: string;
    chapter: number;
    verses?: [number, number];
  }>;
  notes?: string;
}

interface ReadingPlan {
  name: string;
  description: string;
  duration: number;
  dailyReadings: DailyReading[];
  isPublic: boolean;
}

// Generate Bible in a Year plan (chronological reading)
function generateBibleInAYearPlan(): ReadingPlan {
  const books = [
    { name: 'Genesis', chapters: 50 },
    { name: 'Exodus', chapters: 40 },
    { name: 'Leviticus', chapters: 27 },
    { name: 'Numbers', chapters: 36 },
    { name: 'Deuteronomy', chapters: 34 },
    { name: 'Joshua', chapters: 24 },
    { name: 'Judges', chapters: 21 },
    { name: 'Ruth', chapters: 4 },
    { name: '1 Samuel', chapters: 31 },
    { name: '2 Samuel', chapters: 24 },
    { name: '1 Kings', chapters: 22 },
    { name: '2 Kings', chapters: 25 },
    { name: '1 Chronicles', chapters: 29 },
    { name: '2 Chronicles', chapters: 36 },
    { name: 'Ezra', chapters: 10 },
    { name: 'Nehemiah', chapters: 13 },
    { name: 'Esther', chapters: 10 },
    { name: 'Job', chapters: 42 },
    { name: 'Psalms', chapters: 150 },
    { name: 'Proverbs', chapters: 31 },
    { name: 'Ecclesiastes', chapters: 12 },
    { name: 'Song of Solomon', chapters: 8 },
    { name: 'Isaiah', chapters: 66 },
    { name: 'Jeremiah', chapters: 52 },
    { name: 'Lamentations', chapters: 5 },
    { name: 'Ezekiel', chapters: 48 },
    { name: 'Daniel', chapters: 12 },
    { name: 'Hosea', chapters: 14 },
    { name: 'Joel', chapters: 3 },
    { name: 'Amos', chapters: 9 },
    { name: 'Obadiah', chapters: 1 },
    { name: 'Jonah', chapters: 4 },
    { name: 'Micah', chapters: 7 },
    { name: 'Nahum', chapters: 3 },
    { name: 'Habakkuk', chapters: 3 },
    { name: 'Zephaniah', chapters: 3 },
    { name: 'Haggai', chapters: 2 },
    { name: 'Zechariah', chapters: 14 },
    { name: 'Malachi', chapters: 4 },
    { name: 'Matthew', chapters: 28 },
    { name: 'Mark', chapters: 16 },
    { name: 'Luke', chapters: 24 },
    { name: 'John', chapters: 21 },
    { name: 'Acts', chapters: 28 },
    { name: 'Romans', chapters: 16 },
    { name: '1 Corinthians', chapters: 16 },
    { name: '2 Corinthians', chapters: 13 },
    { name: 'Galatians', chapters: 6 },
    { name: 'Ephesians', chapters: 6 },
    { name: 'Philippians', chapters: 4 },
    { name: 'Colossians', chapters: 4 },
    { name: '1 Thessalonians', chapters: 5 },
    { name: '2 Thessalonians', chapters: 3 },
    { name: '1 Timothy', chapters: 6 },
    { name: '2 Timothy', chapters: 4 },
    { name: 'Titus', chapters: 3 },
    { name: 'Philemon', chapters: 1 },
    { name: 'Hebrews', chapters: 13 },
    { name: 'James', chapters: 5 },
    { name: '1 Peter', chapters: 5 },
    { name: '2 Peter', chapters: 3 },
    { name: '1 John', chapters: 5 },
    { name: '2 John', chapters: 1 },
    { name: '3 John', chapters: 1 },
    { name: 'Jude', chapters: 1 },
    { name: 'Revelation', chapters: 22 },
  ];

  const dailyReadings: DailyReading[] = [];
  let currentDay = 1;
  let currentBookIndex = 0;
  let currentChapter = 1;

  while (currentDay <= 365 && currentBookIndex < books.length) {
    const book = books[currentBookIndex];
    const readings: DailyReading['references'] = [];

    // Each day has 3-4 chapters
    const chaptersPerDay = currentDay % 7 === 0 ? 3 : 4; // Fewer on Sundays
    
    for (let i = 0; i < chaptersPerDay && currentBookIndex < books.length; i++) {
      if (currentChapter <= book.chapters) {
        readings.push({
          book: book.name,
          chapter: currentChapter,
        });
        currentChapter++;
      } else {
        currentBookIndex++;
        if (currentBookIndex < books.length) {
          currentChapter = 1;
          readings.push({
            book: books[currentBookIndex].name,
            chapter: currentChapter,
          });
          currentChapter++;
        }
      }
    }

    if (readings.length > 0) {
      dailyReadings.push({
        day: currentDay,
        references: readings,
      });
      currentDay++;
    }
  }

  return {
    name: 'Bible in a Year',
    description: 'Read through the entire Bible in 365 days with a balanced reading schedule.',
    duration: 365,
    dailyReadings,
    isPublic: true,
  };
}

// Generate Gospels in 30 Days plan
function generateGospelsIn30Days(): ReadingPlan {
  const gospels = [
    { name: 'Matthew', chapters: 28 },
    { name: 'Mark', chapters: 16 },
    { name: 'Luke', chapters: 24 },
    { name: 'John', chapters: 21 },
  ];

  const dailyReadings: DailyReading[] = [];
  let currentDay = 1;
  let currentGospelIndex = 0;
  let currentChapter = 1;

  while (currentDay <= 30 && currentGospelIndex < gospels.length) {
    const gospel = gospels[currentGospelIndex];
    const readings: DailyReading['references'] = [];

    // Each day has 2-3 chapters
    const chaptersPerDay = 2 + (currentDay % 3 === 0 ? 1 : 0);
    
    for (let i = 0; i < chaptersPerDay && currentGospelIndex < gospels.length; i++) {
      if (currentChapter <= gospel.chapters) {
        readings.push({
          book: gospel.name,
          chapter: currentChapter,
        });
        currentChapter++;
      } else {
        currentGospelIndex++;
        if (currentGospelIndex < gospels.length) {
          currentChapter = 1;
          readings.push({
            book: gospels[currentGospelIndex].name,
            chapter: currentChapter,
          });
          currentChapter++;
        }
      }
    }

    if (readings.length > 0) {
      dailyReadings.push({
        day: currentDay,
        references: readings,
        notes: currentDay === 1 ? 'Start your journey through the life of Jesus Christ.' : undefined,
      });
      currentDay++;
    }
  }

  return {
    name: 'Gospels in 30 Days',
    description: 'Read through all four Gospels (Matthew, Mark, Luke, John) in 30 days.',
    duration: 30,
    dailyReadings,
    isPublic: true,
  };
}

// Generate Psalms in 30 Days plan
function generatePsalmsIn30Days(): ReadingPlan {
  const dailyReadings: DailyReading[] = [];
  
  for (let day = 1; day <= 30; day++) {
    const startPsalm = (day - 1) * 5 + 1;
    const endPsalm = Math.min(day * 5, 150);
    
    const readings: DailyReading['references'] = [];
    for (let psalm = startPsalm; psalm <= endPsalm; psalm++) {
      readings.push({
        book: 'Psalms',
        chapter: psalm,
      });
    }

    dailyReadings.push({
      day,
      references: readings,
      notes: day === 1 ? 'Begin with praise and worship through the Psalms.' : undefined,
    });
  }

  return {
    name: 'Psalms in 30 Days',
    description: 'Read through all 150 Psalms in 30 days (5 psalms per day).',
    duration: 30,
    dailyReadings,
    isPublic: true,
  };
}

// Generate Proverbs in 31 Days plan
function generateProverbsIn31Days(): ReadingPlan {
  const dailyReadings: DailyReading[] = [];
  
  for (let day = 1; day <= 31; day++) {
    dailyReadings.push({
      day,
      references: [{
        book: 'Proverbs',
        chapter: day,
      }],
      notes: day === 1 ? 'One chapter per day of wisdom literature.' : undefined,
    });
  }

  return {
    name: 'Proverbs in 31 Days',
    description: 'Read through the book of Proverbs, one chapter per day for 31 days.',
    duration: 31,
    dailyReadings,
    isPublic: true,
  };
}

async function seedReadingPlans() {
  console.log('Starting to seed reading plans...');

  const plans = [
    generateBibleInAYearPlan(),
    generateGospelsIn30Days(),
    generatePsalmsIn30Days(),
    generateProverbsIn31Days(),
  ];

  for (const plan of plans) {
    try {
      // Check if plan already exists
      const existingQuery = await db.collection('readingPlans')
        .where('name', '==', plan.name)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        console.log(`Plan "${plan.name}" already exists, skipping...`);
        continue;
      }

      const planRef = db.collection('readingPlans').doc();
      await planRef.set({
        ...plan,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Created plan: "${plan.name}" (${plan.duration} days)`);
    } catch (error) {
      console.error(`❌ Error creating plan "${plan.name}":`, error);
    }
  }

  console.log('\n✅ Finished seeding reading plans!');
  process.exit(0);
}

seedReadingPlans().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

