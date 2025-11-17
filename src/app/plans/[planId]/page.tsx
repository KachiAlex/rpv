"use client";
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/lib/hooks/use-auth';
import { ReadingPlanService } from '@/lib/services/reading-plan-service';
import { useBibleStore } from '@/lib/store';
import { BookOpen, CheckCircle, Circle, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import type { ReadingPlan, UserReadingPlanProgress } from '@/lib/types';

function PlanDetailContent() {
  const params = useParams();
  const planId = params.planId as string;
  const { user, isAuthenticated } = useAuth();
  const { translations, setCurrent } = useBibleStore();
  const router = useRouter();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [progress, setProgress] = useState<UserReadingPlanProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const planService = new ReadingPlanService();

  useEffect(() => {
    if (isAuthenticated && user && planId) {
      loadData();
    }
  }, [isAuthenticated, user, planId]);

  const loadData = async () => {
    if (!user || !planId) return;
    
    setLoading(true);
    try {
      const [planData, progressData] = await Promise.all([
        planService.getPlan(planId),
        planService.getUserProgressForPlan(user.uid, planId),
      ]);
      
      setPlan(planData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = async () => {
    if (!user || !planId) return;
    
    try {
      await planService.startPlan(user.uid, planId);
      await loadData();
    } catch (error) {
      console.error('Error starting plan:', error);
      alert('Failed to start plan');
    }
  };

  const handleMarkDayComplete = async (day: number) => {
    if (!user || !progress) return;
    
    try {
      await planService.markDayComplete(user.uid, progress.id, day);
      await loadData();
    } catch (error) {
      console.error('Error marking day complete:', error);
      alert('Failed to mark day complete');
    }
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
          <p className="text-neutral-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-neutral-500 mb-4">Plan not found.</p>
        <Link
          href="/plans"
          className="text-brand-600 hover:text-brand-700 hover:underline"
        >
          ← Back to Reading Plans
        </Link>
      </div>
    );
  }

  const isStarted = !!progress;
  const completedDays = progress?.completedDays || [];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/plans"
        className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Reading Plans
      </Link>

      <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 bg-white dark:bg-neutral-800 p-6 mb-6 shadow-lg">
        <h1 className="text-3xl font-bold text-brand-700 dark:text-brand-300 mb-2">
          {plan.name}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {plan.description}
        </p>

        <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{plan.duration} days</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>{plan.dailyReadings.length} readings</span>
          </div>
        </div>

        {isStarted && progress && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              <span>Your Progress</span>
              <span className="font-medium">{completedDays.length} / {plan.duration} days ({Math.round((completedDays.length / plan.duration) * 100)}%)</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-brand-600 to-accent-purple h-3 rounded-full transition-all"
                style={{ width: `${(completedDays.length / plan.duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {!isStarted && (
          <button
            onClick={handleStartPlan}
            className="bg-gradient-to-r from-brand-600 to-accent-purple text-white px-6 py-3 rounded-lg hover:from-brand-700 hover:to-accent-purple/90 transition-all font-medium"
          >
            Start This Plan
          </button>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-700 dark:text-brand-300">
          Daily Readings
        </h2>
        {plan.dailyReadings.map((reading) => {
          const isDayComplete = isStarted && completedDays.includes(reading.day);
          const isCurrentDay = isStarted && progress && progress.currentDay === reading.day;
          
          return (
            <div
              key={reading.day}
              className={`rounded-xl border-2 p-4 transition-all ${
                isCurrentDay
                  ? 'border-brand-500 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20 shadow-lg'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    isDayComplete
                      ? 'bg-green-500 text-white'
                      : isCurrentDay
                      ? 'bg-brand-600 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {reading.day}
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-700 dark:text-brand-300">
                      Day {reading.day}
                    </h3>
                    {isCurrentDay && (
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                        Today's Reading
                      </span>
                    )}
                  </div>
                </div>
                {isStarted && (
                  <button
                    onClick={() => handleMarkDayComplete(reading.day)}
                    className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {isDayComplete ? (
                      <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle size={20} className="text-neutral-400" />
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2 ml-11">
                {reading.references.map((ref, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateToReading(ref)}
                    className="block w-full text-left text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
                  >
                    {ref.book} {ref.chapter}
                    {ref.verses && `:${ref.verses[0]}-${ref.verses[1]}`}
                  </button>
                ))}
              </div>

              {reading.notes && (
                <p className="mt-3 ml-11 text-sm text-neutral-600 dark:text-neutral-400 italic">
                  {reading.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlanDetailPage() {
  return (
    <ProtectedRoute>
      <PlanDetailContent />
    </ProtectedRoute>
  );
}

