import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">A unique way to read and project the Bible</h1>
          <p className="text-neutral-700">Built for readers, preachers, and congregations. Upload translations, browse beautifully, and project verses live as they are mentioned.</p>
          <div className="flex gap-3">
            <Link href="/read" className="rounded-md bg-brand-600 hover:bg-brand-700 text-white px-4 py-2">Start Reading</Link>
            <Link href="/projector" className="rounded-md border px-4 py-2">Open Projector</Link>
          </div>
        </div>
        <div className="rounded-xl border p-6 bg-white shadow-sm">
          <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-100 to-brand-300" />
          <p className="mt-3 text-sm text-neutral-600">Clean reader and projector-friendly display with large typography and contrast.</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[{
          t: 'Admin Uploads', d: 'Import translations by books, chapters, and verses with validation.'
        },{
          t: 'Fast Navigation', d: 'Jump between translations, books, chapters, and verses effortlessly.'
        },{
          t: 'Smart Projection', d: 'Share a live channel so speaking a reference updates the projector.'
        }].map((f) => (
          <div key={f.t} className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-neutral-700">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}


