// Canonical Protestant Bible book order, keyed by normalized name.
// Normalization strips punctuation/spaces and folds common variants
// ("1st"→"first", "Psalms"→"psalm", parenthetical subtitles) so that
// naming differences across translations still land in the right slot.

const CANONICAL_ORDER: string[] = [
  'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
  'joshua', 'judges', 'ruth',
  'firstsamuel', 'secondsamuel', 'firstkings', 'secondkings',
  'firstchronicles', 'secondchronicles', 'ezra', 'nehemiah', 'esther',
  'job', 'psalm', 'proverbs', 'ecclesiastes', 'songofsolomon',
  'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel',
  'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum',
  'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
  'matthew', 'mark', 'luke', 'john', 'acts',
  'romans', 'firstcorinthians', 'secondcorinthians', 'galatians',
  'ephesians', 'philippians', 'colossians',
  'firstthessalonians', 'secondthessalonians',
  'firsttimothy', 'secondtimothy', 'titus', 'philemon',
  'hebrews', 'james', 'firstpeter', 'secondpeter',
  'firstjohn', 'secondjohn', 'thirdjohn', 'jude', 'revelation',
];

const orderIndex = new Map(CANONICAL_ORDER.map((k, i) => [k, i]));

export function normalizeBookName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')        // drop "(Jacob)" style subtitles
    .replace(/\b1st\b/g, 'first')
    .replace(/\b2nd\b/g, 'second')
    .replace(/\b3rd\b/g, 'third')
    .replace(/\b1\b/g, 'first')
    .replace(/\b2\b/g, 'second')
    .replace(/\b3\b/g, 'third')
    .replace(/\bbook of\b/g, '')      // "Book of X" → "X"
    .replace(/[^a-z]/g, '');
}

// Aliases for common alternate spellings/titles after normalization.
const ALIASES = new Map<string, string>([
  ['psalms', 'psalm'],
  ['songofsongs', 'songofsolomon'],
  ['song', 'songofsolomon'],
  ['canticles', 'songofsolomon'],
  ['actsoftheapostles', 'acts'],
  ['actsoftheapostle', 'acts'],
  ['actsapostles', 'acts'],
  ['revelationofjohn', 'revelation'],
  ['revelationofjesuschrist', 'revelation'],
  ['apocalypse', 'revelation'],
  ['apocalypseofjohn', 'revelation'],
  ['ecclesiasticus', 'ecclesiastes'],
]);

export function bookOrderIndex(name: string): number {
  const normalized = normalizeBookName(name);
  const idx = orderIndex.get(ALIASES.get(normalized) ?? normalized);
  return idx === undefined ? CANONICAL_ORDER.length : idx;
}

// Sorts books into canonical Bible order. Unknown/non-canonical books keep
// their relative order and sort after Revelation.
export function sortBooksCanonically<T extends { name: string }>(books: T[]): T[] {
  return [...books].sort((a, b) => {
    const diff = bookOrderIndex(a.name) - bookOrderIndex(b.name);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}
