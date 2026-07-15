// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array
require('@testing-library/jest-dom');

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  },
  writable: true,
});

// Mock Firebase for tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date('2023-01-01T00:00:00Z'),
      seconds: 1672531200,
      nanoseconds: 0
    })),
    fromDate: jest.fn((date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    }))
  },
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    commit: jest.fn()
  }))
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));