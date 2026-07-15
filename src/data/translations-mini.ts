import type { Translation } from '@/lib/types';

export const miniTranslations: Translation[] = [
  {
    id: 'KJV',
    name: 'King James Version',
    books: [
      {
        name: 'John',
        chapters: [
          {
            number: 3,
            verses: [
              {
                number: 16,
                text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
              },
              {
                number: 17,
                text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
              },
            ],
          },
        ],
      },
      {
        name: 'Psalms',
        chapters: [
          {
            number: 23,
            verses: [
              {
                number: 1,
                text: 'The LORD is my shepherd; I shall not want.',
              },
              {
                number: 2,
                text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
              },
              {
                number: 3,
                text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.',
              },
            ],
          },
        ],
      },
      {
        name: 'Romans',
        chapters: [
          {
            number: 8,
            verses: [
              {
                number: 28,
                text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
              },
              {
                number: 31,
                text: 'What shall we then say to these things? If God be for us, who can be against us?',
              },
            ],
          },
        ],
      },
    ],
  },
];
