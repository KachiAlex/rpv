"use client";
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/hooks/use-auth';
import { ReadingPlanService } from '@/lib/services/reading-plan-service';
import { useBibleStore } from '@/lib/store';
import { BookOpen, CheckCircle, Circle, Calendar, Target, TrendingUp, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlanDetailClient } from './plan-detail-client';
import type { ReadingPlan, UserReadingPlanProgress } from '@/lib/types';

function ReadingPlansContent() {
  const { user, isAuthenticated } = useAuth();
  const { translations, current, setCurrent } = useBibleStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [userProgress, setUserProgress] = useState<UserReadingPlanProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-plans'>('available');
  const planService = new ReadingPlanService();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [publicPlans, progress] = await Promise.all([
        planService.getPublicPlans(20),
        planService.getUserProgress(user.uid),
      ]);
      
      setPlans(publicPlans);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading reading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = async (planId: string) => {
    if (!user) return;
    
    try {
      await planService.startPlan(user.uid, planId);
      await loadData();
      setActiveTab('my-plans');
    } catch (error) {
      console.error('Error starting plan:', error);
      alert('Failed to start plan');
    }
  };

  const handleMarkDayComplete = async (progressId: string, day: number) => {
    if (!user) return;
    
    try {
      await planService.markDayComplete(user.uid, progressId, day);
      await loadData();
    } catch (error) {
      console.error('Error marking day complete:', error);
      alert('Failed to mark day complete');
    }
  };

  const getProgressForPlan = (planId: string): UserReadingPlanProgress | null => {
    return userProgress.find(p => p.planId === planId) || null;
  };

  const navigateToReading = (ref: { book: string; chapter: number; verses?: [number, number] }) => {
    const translation = translations.find(t => t.id === 'RPV') || translations[0];
    if (translation) {
      setCurrent(translation.id);
      router.push(`/read?book=${encodeURIComponent(ref.book)}&chapter=${ref.chapter}&verse=${ref.verses?.[0] || 1}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading reading plans...</p>
        </div>
      </div>
    );
  }

  const activePlans = plans.filter(plan => {
    const progress = getProgressForPlan(plan.id);
    return progress && !progress.completed;
  });

  // Show plan detail if planId is in query params
  if (planId) {
    return (
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/plans')}
          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Reading Plans
        </button>
        <PlanDetailClient planId={planId} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 via-accent-purple to-accent-pink bg-clip-text text-transparent mb-2">
          Reading Plans
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Choose a plan to read through the Bible systematically
        </p>
      </div>

      <div className="flex gap-2 border-b mb-6">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'available'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Available Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('my-plans')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'my-plans'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          My Plans ({activePlans.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500">
              No reading plans available yet. Check back soon!
            </div>
          ) : (
            plans.map((plan) => {
              const progress = getProgressForPlan(plan.id);
              const isStarted = !!progress;
              
              return (
                <div
                  key={plan.id}
                  className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-white dark:bg-neutral-800 p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-brand-700 dark:text-brand-300 mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        {plan.description}
                      </p>
                    </div>
                    {isStarted && (
                      <div className="ml-2">
                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{plan.duration} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target size={16} />
                      <span>{plan.dailyReadings.length} readings</span>
                    </div>
                  </div>

                  {isStarted && progress && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                        <span>Progress</span>
                        <span>{progress.completedDays.length} / {plan.duration} days</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-600 to-accent-purple h-2 rounded-full transition-all"
                          style={{ width: `${(progress.completedDays.length / plan.duration) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isStarted ? (
                      <Link
                        href={`/plans?planId=${plan.id}`}
                        className="flex-1 text-center bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        Continue Plan
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleStartPlan(plan.id)}
                        className="flex-1 bg-gradient-to-r from-brand-600 to-accent-purple text-white px-4 py-2 rounded-lg hover:from-brand-700 hover:to-accent-purple/90 transition-all"
                      >
                        Start Plan
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'my-plans' && (
        <div className="space-y-6">
          {activePlans.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 rounded-xl border bg-white dark:bg-neutral-800 p-6">
              <BookOpen size={48} className="mx-auto mb-4 text-neutral-400" />
              <p className="mb-4">You haven't started any reading plans yet.</p>
              <button
                onClick={() => setActiveTab('available')}
                className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors"
              >
                Browse Available Plans
              </button>
            </div>
          ) : (
            activePlans.map((plan) => {
              const progress = getProgressForPlan(plan.id);
              if (!progress) return null;

              const currentDayReading = plan.dailyReadings.find(d => d.day === progress.currentDay);
              const isDayComplete = progress.completedDays.includes(progress.currentDay);

              return (
                <div
                  key={plan.id}
                  className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-white dark:bg-neutral-800 p-6 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-brand-700 dark:text-brand-300 mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Day {progress.currentDay} of {plan.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} className="text-brand-600 dark:text-brand-400" />
                      <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                        {Math.round((progress.completedDays.length / plan.duration) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      <span>Progress</span>
                      <span>{progress.completedDays.length} / {plan.duration} days</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-brand-600 to-accent-purple h-3 rounded-full transition-all"
                        style={{ width: `${(progress.completedDays.length / plan.duration) * 100}%` }}
                      />
                    </div>
                  </div>

                  {currentDayReading && (
                    <div className="mb-4 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-brand-700 dark:text-brand-300">
                          Today's Reading
                        </h4>
                        {isDayComplete ? (
                          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle size={20} className="text-neutral-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        {currentDayReading.references.map((ref, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigateToReading(ref)}
                            className="block w-full text-left text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
                          >
                            {ref.book} {ref.chapter}
                            {ref.verses && `:${ref.verses[0]}-${ref.verses[1]}`}
                          </button>
                        ))}
                      </div>
                      {currentDayReading.notes && (
                        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                          {currentDayReading.notes}
                        </p>
                      )}
                      {!isDayComplete && (
                        <button
                          onClick={() => handleMarkDayComplete(progress.id, progress.currentDay)}
                          className="mt-3 w-full bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm"
                        >
                          Mark as Complete
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/plans?planId=${plan.id}`}
                      className="flex-1 text-center bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      View Full Plan
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function ReadingPlansPage() {
  return (
    <ProtectedRoute>
      <ReadingPlansContent />
    </ProtectedRoute>
  );
}

