import type { DevotionalEntry } from '@/lib/types';

export const devotionalEntries: DevotionalEntry[] = [
  {
    id: '2025-01-01-morning-new-mercies',
    date: '2025-01-01',
    title: 'New Mercies Every Morning',
    summary: 'Start the year resting in the unfailing compassion of God.',
    body:
      'Lamentations was written in the middle of ruin, yet the writer still proclaimed that God’s mercies are new every morning. When we step into a new year, the circumstances may not change instantly, but the posture of our heart can: confident that God’s compassion has not run dry.',
    scriptures: [
      { book: 'Lamentations', chapter: 3, verseStart: 22, verseEnd: 24 },
      { book: 'Philippians', chapter: 1, verseStart: 6 },
    ],
    reflectionQuestions: [
      'Where have you experienced God’s faithfulness recently?',
      'How can you anchor your routines around remembering His mercies?',
    ],
    prayerFocus: 'Ask the Spirit to awaken renewed hope as you enter the year.',
    createdAt: new Date('2024-12-01T00:00:00.000Z'),
    updatedAt: new Date('2024-12-15T00:00:00.000Z'),
  },
  {
    id: '2025-02-14-love-rooted-in-truth',
    date: '2025-02-14',
    title: 'Love Rooted in Truth',
    summary: 'Biblical love is more than sentiment; it is anchored in the character of God.',
    body:
      'John reminds the church that love and truth are inseparable. To love one another is to reflect the very nature of God. Our devotion is to be shaped by obedience to His commands and a willingness to walk in light.',
    scriptures: [
      { book: '1 John', chapter: 3, verseStart: 16 },
      { book: '1 Corinthians', chapter: 13, verseStart: 4, verseEnd: 7 },
    ],
    reflectionQuestions: [
      'Where can you choose sacrificial love today?',
      'How does obedience to Jesus deepen your love for others?',
    ],
    prayerFocus: 'Invite God to teach you how to love from a place of truth and integrity.',
    createdAt: new Date('2024-12-10T00:00:00.000Z'),
    updatedAt: new Date('2024-12-20T00:00:00.000Z'),
  },
  {
    id: '2025-03-30-rest-in-green-pastures',
    date: '2025-03-30',
    title: 'Rest in Green Pastures',
    summary: 'The Shepherd leads weary souls into restorative rest.',
    body:
      'Psalm 23 is not sentimental poetry; it is a defiant confession that God is attentive to our needs. Rest is not passive—it is the courageous trust that the Shepherd is guiding even when the valley is shadowed.',
    scriptures: [
      { book: 'Psalms', chapter: 23, verseStart: 1, verseEnd: 3 },
      { book: 'Matthew', chapter: 11, verseStart: 28, verseEnd: 30 },
    ],
    reflectionQuestions: [
      'What burdens are you carrying that need to be surrendered to the Shepherd?',
      'How can your schedule make space for soul-rest this week?',
    ],
    prayerFocus: 'Pray for the grace to slow down and let God restore your soul.',
    createdAt: new Date('2024-12-18T00:00:00.000Z'),
    updatedAt: new Date('2024-12-30T00:00:00.000Z'),
  },
];
