const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rpvbible.com';

export interface ProjectorRef {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  timestamp?: string;
}

export async function getChannel(channel: string): Promise<ProjectorRef | null> {
  const res = await fetch(
    `${API_URL}/api/projector?channel=${encodeURIComponent(channel)}`,
    { headers: { Accept: 'application/json' } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
  return (data.ref as ProjectorRef) || null;
}

export async function sendToChannel(channel: string, ref: ProjectorRef): Promise<void> {
  const res = await fetch(`${API_URL}/api/projector`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ channel, ref }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
}
