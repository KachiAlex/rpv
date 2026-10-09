import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getR2BucketName, isR2Configured } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

// Cross-device projector channels. The web projector/remote originally synced
// via localStorage (same browser only); this endpoint lets any device — web
// projector on a TV, mobile remote on a phone — share the same channel.
// Each channel is a small JSON ref stored at projector/{channel}.json in R2.

const channelKey = (channel: string) => `projector/${channel}.json`;

function sanitizeChannel(raw: string | null): string | null {
  if (!raw) return null;
  const channel = raw.trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(channel)) return null;
  return channel;
}

export async function GET(request: NextRequest) {
  try {
    const channel = sanitizeChannel(new URL(request.url).searchParams.get('channel'));
    if (!channel) {
      return NextResponse.json({ error: 'Missing or invalid channel' }, { status: 400 });
    }
    if (!isR2Configured()) {
      return NextResponse.json({ ref: null });
    }

    try {
      const res = await getR2Client().send(
        new GetObjectCommand({ Bucket: getR2BucketName(), Key: channelKey(channel) })
      );
      const text = await res.Body!.transformToString();
      const ref = JSON.parse(text);
      return NextResponse.json({ ref });
    } catch (err: any) {
      const code = err?.$metadata?.httpStatusCode;
      if (code === 404 || err?.name === 'NoSuchKey' || err?.name === 'NotFound') {
        return NextResponse.json({ ref: null });
      }
      throw err;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Projector GET error:', message);
    return NextResponse.json({ error: 'Projector request failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const channel = sanitizeChannel(body?.channel);
    const ref = body?.ref;

    if (!channel || !ref || typeof ref !== 'object') {
      return NextResponse.json({ error: 'Missing channel or ref' }, { status: 400 });
    }
    const isBlank = ref.blank === true;
    if (!isBlank && (!ref.book || typeof ref.chapter !== 'number' || typeof ref.verse !== 'number')) {
      return NextResponse.json({ error: 'Invalid ref payload' }, { status: 400 });
    }
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Projector store not configured' }, { status: 503 });
    }

    const payload = {
      translation: ref.translation || '',
      book: String(ref.book ?? ''),
      chapter: typeof ref.chapter === 'number' ? ref.chapter : 0,
      verse: typeof ref.verse === 'number' ? ref.verse : 0,
      ...(typeof ref.endVerse === 'number' && ref.endVerse > (ref.verse ?? 0)
        ? { endVerse: ref.endVerse }
        : {}),
      text: ref.text || '',
      timestamp: ref.timestamp || new Date().toISOString(),
      ...(isBlank ? { blank: true } : {}),
    };

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: channelKey(channel),
        Body: JSON.stringify(payload),
        ContentType: 'application/json',
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Projector POST error:', message);
    return NextResponse.json({ error: 'Projector write failed', details: message }, { status: 500 });
  }
}
