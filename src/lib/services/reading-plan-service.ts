import { getFirebase } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import type { ReadingPlan, UserReadingPlanProgress, DailyReading } from '../types';

export class ReadingPlanService {
  private getDb() {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  // Public Reading Plans (available to all users)
  async getPublicPlans(limitCount: number = 20): Promise<ReadingPlan[]> {
    const db = this.getDb();
    const plansRef = collection(db, 'readingPlans');
    const q = query(
      plansRef,
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dailyReadings: doc.data().dailyReadings || [],
    })) as ReadingPlan[];
  }

  async getPlan(planId: string): Promise<ReadingPlan | null> {
    const db = this.getDb();
    const planDoc = await getDoc(doc(db, 'readingPlans', planId));
    
    if (!planDoc.exists()) return null;
    
    return {
      id: planDoc.id,
      ...planDoc.data(),
      createdAt: planDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: planDoc.data().updatedAt?.toDate() || new Date(),
      dailyReadings: planDoc.data().dailyReadings || [],
    } as ReadingPlan;
  }

  async createPlan(plan: Omit<ReadingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = this.getDb();
    const plansRef = collection(db, 'readingPlans');
    const docRef = doc(plansRef);
    const now = new Date();
    
    await setDoc(docRef, {
      ...plan,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
    
    return docRef.id;
  }

  // User Reading Plan Progress
  async getUserProgress(userId: string): Promise<UserReadingPlanProgress[]> {
    const db = this.getDb();
    const progressRef = collection(db, 'users', userId, 'readingPlanProgress');
    const q = query(progressRef, orderBy('updatedAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedDays: doc.data().completedDays || [],
    })) as UserReadingPlanProgress[];
  }

  async getUserProgressForPlan(
    userId: string,
    planId: string
  ): Promise<UserReadingPlanProgress | null> {
    const db = this.getDb();
    const progressRef = collection(db, 'users', userId, 'readingPlanProgress');
    const q = query(progressRef, where('planId', '==', planId), limit(1));
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedDays: doc.data().completedDays || [],
    } as UserReadingPlanProgress;
  }

  async startPlan(
    userId: string,
    planId: string,
    startDate?: Date
  ): Promise<string> {
    const db = this.getDb();
    
    // Check if plan already started
    const existing = await this.getUserProgressForPlan(userId, planId);
    if (existing) {
      return existing.id; // Return existing progress ID
    }

    const progressRef = collection(db, 'users', userId, 'readingPlanProgress');
    const docRef = doc(progressRef);
    const now = new Date();
    const start = startDate || now;
    
    await setDoc(docRef, {
      userId,
      planId,
      startDate: Timestamp.fromDate(start),
      completedDays: [],
      currentDay: 1,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  }

  async markDayComplete(
    userId: string,
    progressId: string,
    day: number
  ): Promise<void> {
    const db = this.getDb();
    const progressDoc = await getDoc(doc(db, 'users', userId, 'readingPlanProgress', progressId));
    
    if (!progressDoc.exists()) {
      throw new Error('Reading plan progress not found');
    }

    const progress = progressDoc.data() as UserReadingPlanProgress;
    const completedDays = progress.completedDays || [];
    
    if (!completedDays.includes(day)) {
      completedDays.push(day);
      completedDays.sort((a, b) => a - b);
    }

    // Get the plan to check if all days are complete
    const plan = await this.getPlan(progress.planId);
    const isCompleted = plan && completedDays.length >= plan.duration;

    await updateDoc(doc(db, 'users', userId, 'readingPlanProgress', progressId), {
      completedDays,
      currentDay: Math.max(...completedDays, day) + 1,
      completed: isCompleted || false,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  async getCurrentDay(userId: string, progressId: string): Promise<number> {
    const db = this.getDb();
    const progressDoc = await getDoc(doc(db, 'users', userId, 'readingPlanProgress', progressId));
    
    if (!progressDoc.exists()) {
      return 1;
    }

    const progress = progressDoc.data();
    const startDate = progress.startDate?.toDate() || new Date();
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(1, daysSinceStart + 1);
  }

  async deleteProgress(userId: string, progressId: string): Promise<void> {
    const db = this.getDb();
    await deleteDoc(doc(db, 'users', userId, 'readingPlanProgress', progressId));
  }
}

