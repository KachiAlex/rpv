import Link from 'next/link';
import { HomePreview } from '@/components/home/home-preview';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-brand-600 via-accent-purple to-accent-pink bg-clip-text text-transparent">
            A unique way to read and project the Bible
          </h1>
          <p className="text-neutral-700 dark:text-neutral-300">Built for readers, preachers, and congregations. Upload translations, browse beautifully, and project verses live as they are mentioned.</p>
          <div className="flex gap-3">
            <Link 
              href="/read" 
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-accent-purple hover:from-brand-700 hover:to-accent-purple/90 text-white px-6 py-3 font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Start Reading
            </Link>
            <Link 
              href="/projector" 
              className="inline-flex items-center justify-center rounded-lg border-2 border-accent-teal hover:border-accent-teal/80 hover:bg-accent-teal/10 text-accent-teal px-6 py-3 font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
            >
              Open Projector
            </Link>
          </div>
        </div>
        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 p-6 bg-gradient-to-br from-brand-50 to-accent-purple/10 dark:from-neutral-800 dark:to-accent-purple/20 shadow-lg">
          <HomePreview />
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">Clean reader and projector-friendly display with large typography and contrast.</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[{
          t: 'Admin Uploads', 
          d: 'Import translations by books, chapters, and verses with validation.',
          color: 'from-accent-blue to-accent-teal'
        },{
          t: 'Fast Navigation', 
          d: 'Jump between translations, books, chapters, and verses effortlessly.',
          color: 'from-accent-purple to-accent-pink'
        },{
          t: 'Smart Projection', 
          d: 'Share a live channel so speaking a reference updates the projector.',
          color: 'from-accent-orange to-accent-amber'
        }].map((f, i) => (
          <div key={f.t} className={`rounded-xl border-2 border-transparent bg-gradient-to-br ${f.color} p-[2px] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <div className="rounded-[10px] bg-white dark:bg-neutral-800 p-6 h-full">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-brand-700 to-brand-600 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
                {f.t}
              </h3>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{f.d}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}


