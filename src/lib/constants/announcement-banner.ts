export const ANNOUNCEMENT_BANNER_COLLECTION = 'announcement_banner';
export const ANNOUNCEMENT_BANNER_DOC = 'settings';

export interface AnnouncementBannerSettings {
  isEnabled: boolean;
  version: string;
  heading: string;
  message: string;
  badge?: string;
  ctaLabel?: string;
  targetDate?: string;
  accentColor?: string;
  textColor: string;
  background: {
    from: string;
    via?: string;
    to: string;
  };
  updatedAt?: Date;
}

export const DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS: AnnouncementBannerSettings = {
  isEnabled: false,
  version: 'v1.0',
  heading: 'New Publication Coming Soon',
  message: 'Stay tuned for our upcoming Bible publication release.',
  badge: 'Coming Soon',
  ctaLabel: 'Notify Me',
  accentColor: '#a5f3ff',
  textColor: '#ffffff',
  background: {
    from: '#1e3a5f',
    via: '#2d5a8e',
    to: '#1e3a5f',
  },
};
