import Dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/auth/protected-route';

const BookViewerClient = Dynamic(() => import('./BookViewerClient'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen"><p className="text-neutral-500">Loading...</p></div>,
});

// export const dynamic = 'force-dynamic';
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function BookViewerPage() {
  return (
    <ProtectedRoute children={<BookViewerClient />} />
  );
}
