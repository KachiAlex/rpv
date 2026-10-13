import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2BucketName, isR2Configured } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

// App installers live in R2 under downloads/ — this endpoint issues a
// short-lived presigned URL so the bytes stream straight from Cloudflare's
// edge instead of through this Node process.
const FILES: Record<string, { key: string; filename: string }> = {
  desktop: { key: 'downloads/rpv-bible-setup.exe', filename: 'RPV-Bible-Setup.exe' },
  windows: { key: 'downloads/rpv-bible-setup.exe', filename: 'RPV-Bible-Setup.exe' },
  android: { key: 'downloads/rpvbible.apk', filename: 'rpvbible.apk' },
  apk: { key: 'downloads/rpvbible.apk', filename: 'rpvbible.apk' },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { file: string } }
) {
  const entry = FILES[params.file?.toLowerCase()];
  if (!entry) {
    return NextResponse.json({ error: 'Unknown download' }, { status: 404 });
  }
  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Downloads unavailable' }, { status: 503 });
  }
  try {
    const url = await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: entry.key,
        ResponseContentDisposition: `attachment; filename="${entry.filename}"`,
      }),
      { expiresIn: 300 }
    );
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error('[Download] Presign failed:', error);
    return NextResponse.json({ error: 'Download unavailable' }, { status: 500 });
  }
}
