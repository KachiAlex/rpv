"use client";
import { useEffect, useState } from 'react';
import { useBibleStore } from '@/lib/store';

export default function ProjectorPage() {
  const { projectorRef, subscribeToChannel, setChannelId } = useBibleStore();
  const [channel, setChannel] = useState('default');

  useEffect(() => {
    setChannelId(channel);
    subscribeToChannel();
  }, [channel, setChannelId, subscribeToChannel]);

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full rounded-2xl border bg-black text-white p-10 shadow-2xl">
        <div className="text-sm text-white/70">{projectorRef.translation} • {projectorRef.book} {projectorRef.chapter}:{projectorRef.verse}</div>
        <div className="mt-4 text-4xl leading-relaxed">{projectorRef.text || 'Waiting for verse...'}</div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
        <span>Channel:</span>
        <input className="rounded-md border px-2 py-1" value={channel} onChange={(e) => setChannel(e.target.value)} />
        <span className="ml-2">Open Remote at /remote to control this screen.</span>
      </div>
    </div>
  );
}


