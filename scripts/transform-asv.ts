import fs from 'fs';
import path from 'path';

type Verse = { number: number; text: string };
type Chapter = { number: number; verses: Verse[] };
type Book = { name: string; chapters: Chapter[] };
type Translation = { id: string; name: string; books: Book[] };

const STANDARD_BOOK_ORDER: string[] = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

function readJson(filePath: string): any {
  const abs = path.resolve(filePath);
  let raw = fs.readFileSync(abs, 'utf-8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

function transformAsv(inputPath: string, outputPath: string) {
  const input = readJson(inputPath);
  if (!Array.isArray(input) || !input[0]?.chapters) {
    throw new Error('Unexpected ASV input schema');
  }

  const books: Book[] = (input as any[]).map((bk, idx) => {
    const name = STANDARD_BOOK_ORDER[idx] || `Book ${idx+1}`;
    const chapters: Chapter[] = (bk.chapters as string[][]).map((chapterArr: string[], chIdx: number) => {
      const verses: Verse[] = chapterArr.map((text, vIdx) => ({ number: vIdx + 1, text }));
      return { number: chIdx + 1, verses };
    });
    return { name, chapters };
  });

  const t: Translation = { id: 'asv', name: 'ASV', books };
  const out = { translations: [t] };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(out));
}

const inPath = process.argv[2] || path.join(process.cwd(), 'datasets', 'asv.json');
const outPath = process.argv[3] || path.join(process.cwd(), 'public', 'translations', 'asv.json');

transformAsv(inPath, outPath);
console.log('Wrote', outPath);


