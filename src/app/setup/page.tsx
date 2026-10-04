import dynamic from 'next/dynamic';

const SetupPageClient = dynamic(() => import('./SetupPageClient'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen"><p className="text-neutral-500">Loading...</p></div>,
});

export default function SetupPage() {
  return <SetupPageClient />;
}
