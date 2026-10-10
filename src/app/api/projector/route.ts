import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getR2BucketName, isR2Configured } from '@/lib/r2-client';
import { createHash, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

// Cross-device projector channels. The web projector/remote originally synced
// via localStorage (same browser only); this endpoint lets any device — web
// projector on a TV, mobile remote on a phone — share the same channel.
// Each channel record is stored at projector/{channel}.json in R2 as
// { ref, pinHash? } — the hash is stripped before the ref is ever returned.
//
// Write protection: a channel is "claimed" by the first POST that carries a
// `pin`. Once claimed, every subsequent write must present the same PIN;
// reads stay open (a projector display only ever GETs). Channels that were
// never claimed accept unauthenticated writes for backwards compatibility.

const channelKey = (channel: string) => `projector/${channel}.json`;
const PIN_PATTERN = /^[0-9a-zA-Z_-]{4,64}$/;

const hashPin = (channel: string, pin: string) =>
  createHash('sha256').update(`rpv-projector:${channel}:${pin}`).digest('hex');

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

function sanitizeChannel(raw: string | null): string | null {
  if (!raw) return null;
  const channel = raw.trim();
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(channel)) return null;
  return channel;
}

async function readRecord(channel: string): Promise<{ ref: any; pinHash?: string } | null> {
  try {
    const res = await getR2Client().send(
      new GetObjectCommand({ Bucket: getR2BucketName(), Key: channelKey(channel) })
    );
    const obj = JSON.parse(await res.Body!.transformToString());
    // Legacy files stored the bare ref object rather than { ref, pinHash }.
    return obj?.ref ? obj : { ref: obj };
  } catch (err: any) {
    const code = err?.$metadata?.httpStatusCode;
    if (code === 404 || err?.name === 'NoSuchKey' || err?.name === 'NotFound') return null;
    throw err;
  }
}

export async function GET(request: NextRequest) {
  try {
    const channel = sanitizeChannel(new URL(request.url).searchParams.get('channel'));
    if (!channel) {
      return NextResponse.json({ error: 'Missing or invalid channel' }, { status: 400 });
    }
    if (!isR2Configured()) {
      return NextResponse.json({ ref: null, protected: false });
    }

    const record = await readRecord(channel);
    return NextResponse.json({ ref: record?.ref ?? null, protected: Boolean(record?.pinHash) });
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
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
    if (pin && !PIN_PATTERN.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4–64 characters: letters, digits, - or _' },
        { status: 400 }
      );
    }
    if (!isR2Configured()) {
      return NextResponse.json({ error: 'Projector store not configured' }, { status: 503 });
    }

    const existing = await readRecord(channel);
    if (existing?.pinHash) {
      if (!pin) {
        return NextResponse.json(
          { error: 'This channel is protected — enter its PIN to write', pinRequired: true },
          { status: 401 }
        );
      }
      if (!safeEqual(hashPin(channel, pin), existing.pinHash)) {
        return NextResponse.json(
          { error: 'Incorrect PIN for this channel', pinRequired: true },
          { status: 403 }
        );
      }
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

    // Keep the existing PIN; a PIN on an unclaimed channel claims it.
    const pinHashForRecord = existing?.pinHash ?? (pin ? hashPin(channel, pin) : undefined);

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: channelKey(channel),
        Body: JSON.stringify({
          ref: payload,
          ...(pinHashForRecord ? { pinHash: pinHashForRecord } : {}),
        }),
        ContentType: 'application/json',
      })
    );

    return NextResponse.json({
      success: true,
      protected: Boolean(pinHashForRecord),
      claimed: !existing?.pinHash && Boolean(pinHashForRecord),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Projector POST error:', message);
    return NextResponse.json({ error: 'Projector write failed', details: message }, { status: 500 });
  }
}
