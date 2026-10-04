import { S3Client } from '@aws-sdk/client-s3';

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!client) {
    const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME!;
}

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}
