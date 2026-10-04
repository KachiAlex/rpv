"use client";

import type { AnnouncementBannerSettings } from '../constants/announcement-banner';
import { DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS } from '../constants/announcement-banner';

class AnnouncementBannerService {
  async getSettings(): Promise<AnnouncementBannerSettings> {
    return DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS;
  }

  async updateSettings(_updates: Partial<AnnouncementBannerSettings> & { updatedBy?: string }): Promise<void> {}

  async resetToDefaults(): Promise<void> {}

  subscribe(callback: (settings: AnnouncementBannerSettings) => void): () => void {
    callback(DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS);
    return () => {};
  }

  async addSubscriber(_email: string, _source: string): Promise<void> {}
}

export const announcementBannerService = new AnnouncementBannerService();
