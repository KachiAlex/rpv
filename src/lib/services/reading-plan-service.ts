import type { ReadingPlan, UserReadingPlanProgress } from '../types';
import { getApiUrl } from '../api-config';
import { getAuthToken } from '../client-auth';

async function apiCall<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data as T;
}

function mapPlan(row: any): ReadingPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    duration: row.duration_days,
    dailyReadings: Array.isArray(row.schedule) ? row.schedule : [],
    isPublic: row.is_public,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: undefined,
  };
}

function mapProgress(row: any): UserReadingPlanProgress {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    startDate: new Date(row.start_date),
    completedDays: Array.isArray(row.completed_days) ? row.completed_days : [],
    currentDay: row.current_day,
    completed: false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ReadingPlanService {
  async getPublicPlans(limitCount?: number): Promise<ReadingPlan[]> {
    const data = await apiCall<{ plans: any[] }>(`/api/reading-plans/?limit=${limitCount || 20}`);
    return data.plans.map(mapPlan);
  }

  async getPlan(planId: string): Promise<ReadingPlan | null> {
    const data = await apiCall<{ plan: any }>(`/api/reading-plans/?planId=${planId}`);
    return data.plan ? mapPlan(data.plan) : null;
  }

  async createPlan(plan: Omit<ReadingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = await apiCall<{ id: string }>('/api/reading-plans/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        plan: {
          name: plan.name,
          description: plan.description,
          durationDays: plan.duration,
          isPublic: plan.isPublic,
          schedule: plan.dailyReadings,
        },
      }),
    });
    return data.id;
  }

  async getUserProgress(userId: string): Promise<UserReadingPlanProgress[]> {
    const data = await apiCall<{ myProgress: any[] }>('/api/reading-plans/');
    return data.myProgress.map(mapProgress);
  }

  async getUserProgressForPlan(_userId: string, planId: string): Promise<UserReadingPlanProgress | null> {
    const data = await apiCall<{ progress: any }>(`/api/reading-plans/?planId=${planId}`);
    return data.progress ? mapProgress(data.progress) : null;
  }

  async startPlan(_userId: string, planId: string, startDate?: Date): Promise<string> {
    const data = await apiCall<{ id: string }>('/api/reading-plans/', {
      method: 'POST',
      body: JSON.stringify({
        action: 'start',
        planId,
        startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
      }),
    });
    return data.id;
  }

  async markDayComplete(_userId: string, progressId: string, day: number): Promise<void> {
    await apiCall('/api/reading-plans/', {
      method: 'POST',
      body: JSON.stringify({ action: 'completeDay', progressId, day }),
    });
  }

  async getCurrentDay(_userId: string, progressId: string): Promise<number> {
    const progress = await this.getUserProgress(_userId);
    const p = progress.find(x => x.id === progressId);
    return p ? p.currentDay : 1;
  }

  async deleteProgress(_userId: string, progressId: string): Promise<void> {
    await apiCall('/api/reading-plans/', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', progressId }),
    });
  }
}
