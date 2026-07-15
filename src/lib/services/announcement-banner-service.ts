"use client";

import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Timestamp,
  type Firestore
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { AnnouncementBannerSettings } from '../constants/announcement-banner';
import {
  ANNOUNCEMENT_BANNER_COLLECTION,
  ANNOUNCEMENT_BANNER_DOC,
  DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS
} from '../constants/announcement-banner';

function normalizeTargetDate(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'string') {
    date = new Date(value);
  }

  if (!date || Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function normalizeSettings(data: Partial<AnnouncementBannerSettings> | undefined): AnnouncementBannerSettings {
  if (!data) {
    return DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS;
  }

  const merged: AnnouncementBannerSettings = {
    ...DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS,
    ...data,
    background: {
      ...DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS.background,
      ...(data.background || {})
    }
  };

  if (merged.updatedAt instanceof Timestamp) {
    merged.updatedAt = merged.updatedAt.toDate();
  }

  const normalizedTargetDate = normalizeTargetDate(merged.targetDate);
  if (normalizedTargetDate) {
    merged.targetDate = normalizedTargetDate;
  } else {
    delete merged.targetDate;
  }

  return merged;
}

function prepareForWrite(settings: Partial<AnnouncementBannerSettings>) {
  const payload: Record<string, unknown> = { ...settings };

  if (settings.updatedAt instanceof Date) {
    payload.updatedAt = Timestamp.fromDate(settings.updatedAt);
  } else if (!settings.updatedAt) {
    payload.updatedAt = Timestamp.now();
  }

  const normalizedTargetDate = normalizeTargetDate(settings.targetDate);
  if (normalizedTargetDate) {
    payload.targetDate = normalizedTargetDate;
  } else {
    delete payload.targetDate;
  }

  if (settings.background) {
    payload.background = {
      ...DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS.background,
      ...settings.background
    };
  }

  return payload;
}

class AnnouncementBannerService {
  private getDb(): Firestore {
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized. Check your configuration.');
    }
    return db;
  }

  private getDocRef() {
    const db = this.getDb();
    return doc(db, ANNOUNCEMENT_BANNER_COLLECTION, ANNOUNCEMENT_BANNER_DOC);
  }

  async getSettings(): Promise<AnnouncementBannerSettings> {
    const docRef = this.getDocRef();
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS;
    }

    return normalizeSettings(snapshot.data() as AnnouncementBannerSettings);
  }

  async updateSettings(
    updates: Partial<AnnouncementBannerSettings> & { updatedBy?: string }
  ): Promise<void> {
    const docRef = this.getDocRef();
    const payload = prepareForWrite({
      ...updates,
      updatedAt: new Date()
    });

    await setDoc(docRef, payload, { merge: true });
  }

  async resetToDefaults(): Promise<void> {
    const docRef = this.getDocRef();
    const payload = prepareForWrite({
      ...DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS,
      updatedAt: new Date()
    });
    await setDoc(docRef, payload, { merge: false });
  }

  subscribe(callback: (settings: AnnouncementBannerSettings) => void) {
    const docRef = this.getDocRef();
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS);
          return;
        }
        callback(normalizeSettings(snapshot.data() as AnnouncementBannerSettings));
      },
      () => {
        callback(DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS);
      }
    );
  }

  async addSubscriber(email: string, source: string): Promise<void> {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }
    const { db } = getFirebase();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    const { collection, addDoc } = await import('firebase/firestore');
    await addDoc(collection(db, 'newsletter_subscribers'), {
      email: email.trim(),
      source,
      subscribedAt: Timestamp.now(),
    });
  }
}

export const announcementBannerService = new AnnouncementBannerService();
