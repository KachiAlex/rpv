'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { announcementBannerService } from '@/lib/services/announcement-banner-service';
import { DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS } from '@/lib/constants/announcement-banner';
import type { AnnouncementBannerSettings } from '@/lib/constants/announcement-banner';

export function BannerManagementSection() {
  const [settings, setSettings] = useState<AnnouncementBannerSettings>(DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    announcementBannerService
      .getSettings()
      .then((s) => {
        if (mounted) {
          setSettings(s);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load settings');
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await announcementBannerService.updateSettings(settings);
      setSuccess('Settings saved successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const handleReset = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await announcementBannerService.resetToDefaults();
      setSettings(DEFAULT_ANNOUNCEMENT_BANNER_SETTINGS);
      setSuccess('Settings reset to defaults.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset settings');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const update = (partial: Partial<AnnouncementBannerSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center text-gray-600">Loading banner settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Announcement Banner</h2>
            <p className="text-gray-600 mt-1">Manage the publication announcement banner</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Enabled toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => update({ isEnabled: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-900">Banner Enabled</span>
            </label>
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version Label</label>
            <input
              type="text"
              value={settings.version}
              onChange={(e) => update({ version: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Heading */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
            <input
              type="text"
              value={settings.heading}
              onChange={(e) => update({ heading: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={settings.message}
              onChange={(e) => update({ message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Badge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
            <input
              type="text"
              value={settings.badge || ''}
              onChange={(e) => update({ badge: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* CTA Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Label</label>
            <input
              type="text"
              value={settings.ctaLabel || ''}
              onChange={(e) => update({ ctaLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (ISO string)</label>
            <input
              type="text"
              value={settings.targetDate || ''}
              onChange={(e) => update({ targetDate: e.target.value })}
              placeholder="e.g. 2025-12-31T00:00:00.000Z"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <input
                type="text"
                value={settings.accentColor || ''}
                onChange={(e) => update({ accentColor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Background colors */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BG From</label>
              <input
                type="text"
                value={settings.background.from}
                onChange={(e) => update({ background: { ...settings.background, from: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BG Via</label>
              <input
                type="text"
                value={settings.background.via || ''}
                onChange={(e) => update({ background: { ...settings.background, via: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BG To</label>
              <input
                type="text"
                value={settings.background.to}
                onChange={(e) => update({ background: { ...settings.background, to: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
