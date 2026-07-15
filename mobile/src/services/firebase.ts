import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  setDoc,
  doc,
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
let auth: any;
let db: any;

export async function initializeFirebase(): Promise<void> {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export async function signUp(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function saveBookmark(
  userId: string,
  verseId: string,
  verseData: any
): Promise<void> {
  try {
    await addDoc(collection(db, 'users', userId, 'bookmarks'), {
      verseId,
      ...verseData,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving bookmark:', error);
    throw error;
  }
}

export async function getBookmarks(userId: string): Promise<any[]> {
  try {
    const q = query(collection(db, 'users', userId, 'bookmarks'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
}

export async function savePreferences(
  userId: string,
  preferences: any
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId, 'preferences', 'settings'), preferences);
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
}

export async function getPreferences(userId: string): Promise<any> {
  try {
    const docSnap = await getDocs(
      query(collection(db, 'users', userId, 'preferences'))
    );
    if (docSnap.empty) {
      return null;
    }
    return docSnap.docs[0].data();
  } catch (error) {
    console.error('Error getting preferences:', error);
    throw error;
  }
}

export function getAuth_(): any {
  return auth;
}

export function getDb(): any {
  return db;
}
