import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirebase } from '../firebase';

export class AuthService {
  async signIn(email: string, password: string): Promise<User> {
    const { auth } = getFirebase();
    if (!auth) throw new Error('Firebase not initialized');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    const { auth } = getFirebase();
    if (!auth) throw new Error('Firebase not initialized');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential.user;
  }

  async signInWithGoogle(): Promise<User> {
    const { auth } = getFirebase();
    if (!auth) throw new Error('Firebase not initialized');
    
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  }

  async signOut(): Promise<void> {
    const { auth } = getFirebase();
    if (!auth) throw new Error('Firebase not initialized');
    
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    const { auth } = getFirebase();
    if (!auth) throw new Error('Firebase not initialized');
    
    await sendPasswordResetEmail(auth, email);
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { auth } = getFirebase();
    if (!auth) {
      callback(null);
      return () => {};
    }
    
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): User | null {
    const { auth } = getFirebase();
    if (!auth) return null;
    
    return auth.currentUser;
  }
}

