import type { DevotionalEntry } from '@/lib/types';
import { devotionalEntries } from '@/data/devotionals';

export interface DevotionalFilters {
  date?: string;
  from?: string;
  to?: string;
}

export class DevotionalService {
  async list(filters: DevotionalFilters = {}): Promise<DevotionalEntry[]> {
    const { date, from, to } = filters;
    let results = devotionalEntries;

    if (date) {
      results = results.filter((entry) => entry.date === date);
    }

    if (from) {
      results = results.filter((entry) => entry.date >= from);
    }

    if (to) {
      results = results.filter((entry) => entry.date <= to);
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getByDate(date: string): Promise<DevotionalEntry | null> {
    const match = devotionalEntries.find((entry) => entry.date === date);
    return match ?? null;
  }
}
