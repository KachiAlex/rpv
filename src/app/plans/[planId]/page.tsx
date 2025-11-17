import { ProtectedRoute } from '@/components/auth/protected-route';
import { PlanDetailClient } from './plan-detail-client';

// For static export - generateStaticParams must be exported from page
export function generateStaticParams() {
  // Return empty array since plans are loaded dynamically from Firestore
  // This allows the route to work with static export while loading data client-side
  return [];
}

export default function PlanDetailPage({ params }: { params: { planId: string } }) {
  return (
    <ProtectedRoute>
      <PlanDetailClient planId={params.planId} />
    </ProtectedRoute>
  );
}
