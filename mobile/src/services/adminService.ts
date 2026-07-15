import * as firebaseService from './firebase';

interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
  role: 'admin' | 'user';
}

export async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const db = firebaseService.getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const db = firebaseService.getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) {
      return {
        uid: userId,
        ...adminDoc.data(),
      } as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

export async function createAdminUser(userId: string, email: string): Promise<void> {
  try {
    const db = firebaseService.getDb();
    const { doc, setDoc } = await import('firebase/firestore');
    
    await setDoc(doc(db, 'admins', userId), {
      email,
      isAdmin: true,
      role: 'admin',
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

export async function removeAdminUser(userId: string): Promise<void> {
  try {
    const db = firebaseService.getDb();
    const { doc, deleteDoc } = await import('firebase/firestore');
    
    await deleteDoc(doc(db, 'admins', userId));
  } catch (error) {
    console.error('Error removing admin user:', error);
    throw error;
  }
}
