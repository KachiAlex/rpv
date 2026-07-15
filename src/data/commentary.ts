import type { CommentaryEntry } from '@/lib/types';

export const commentaryEntries: CommentaryEntry[] = [
  {
    id: 'john-3-16-radiant-love',
    translationId: 'KJV',
    book: 'John',
    chapter: 3,
    verse: 16,
    title: 'Radiant Love of God',
    body:
      'This verse compresses the entire gospel narrative into a single sentence. John pairs the divine motive (love) with the divine action (giving the Son). The verb “gave” points both to the incarnation and the cross, highlighting that divine self-giving is the center of redemption.',
    sources: ['Gospel of John Study Notes', 'Classic Evangelical Commentary'],
    tags: ['love', 'salvation', 'gospel'],
    createdAt: new Date('2024-01-07T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
  },
  {
    id: 'psalm-23-1-shepherd-king',
    translationId: 'KJV',
    book: 'Psalms',
    chapter: 23,
    verse: 1,
    title: 'Shepherd-King Imagery',
    body:
      'David blends covenantal leadership with pastoral care. The shepherd metaphor suggests nourishment, guidance, and protection. The absence of lack is not about abundance of goods but about the sufficiency of God’s presence.',
    sources: ['Shepherd Imagery in Ancient Israel', 'Hebrew Poetry Notes'],
    tags: ['trust', 'shepherd', 'presence'],
    createdAt: new Date('2024-02-15T00:00:00.000Z'),
    updatedAt: new Date('2024-06-10T00:00:00.000Z'),
  },
  {
    id: 'romans-8-28-unshakeable-good',
    translationId: 'KJV',
    book: 'Romans',
    chapter: 8,
    verse: 28,
    title: 'Unshakeable Good',
    body:
      'Paul does not claim every circumstance is good; instead, he argues that God can weave every circumstance into a tapestry of ultimate good for those who love Him. The verb “work together” (synergeo) implies coordination of diverse threads.',
    sources: ['Pauline Theology Primer'],
    tags: ['providence', 'hope'],
    createdAt: new Date('2024-03-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-20T00:00:00.000Z'),
  },
];
