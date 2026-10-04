import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface PublicUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return JWT_SECRET;
}

function createR2Client() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 environment variables not configured');
  }

  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  if (endpoint) {
    clientConfig.endpoint = endpoint;
  }

  return { client: new S3Client(clientConfig), bucketName };
}

function userKey(email: string) {
  return `users/${email.toLowerCase()}.json`;
}

export class UserRepository {
  static isConfigured(): boolean {
    return !!(
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );
  }

  async createUser(email: string, password: string, displayName?: string): Promise<PublicUser> {
    const { client, bucketName } = createR2Client();

    // Check if user already exists
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isFirstUser = await this.isUserCountZero();

    const record: UserRecord = {
      uid,
      email: email.toLowerCase(),
      displayName: displayName || email.split('@')[0],
      passwordHash,
      role: isFirstUser ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: userKey(email),
        Body: JSON.stringify(record),
        ContentType: 'application/json',
      })
    );

    return this.toPublic(record);
  }

  async verifyUser(email: string, password: string): Promise<PublicUser> {
    const { client, bucketName } = createR2Client();

    let response;
    try {
      response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: userKey(email) })
      );
    } catch {
      throw new Error('Invalid email or password');
    }

    if (!response.Body) throw new Error('Invalid email or password');
    const text = await response.Body.transformToString();
    const record = JSON.parse(text) as UserRecord;

    const valid = await bcrypt.compare(password, record.passwordHash);
    if (!valid) throw new Error('Invalid email or password');

    return this.toPublic(record);
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new GetObjectCommand({ Bucket: bucketName, Key: userKey(email) })
      );
      if (!response.Body) return null;
      const text = await response.Body.transformToString();
      return JSON.parse(text) as UserRecord;
    } catch {
      return null;
    }
  }

  async updatePassword(email: string, newPassword: string): Promise<PublicUser> {
    const { client, bucketName } = createR2Client();

    const record = await this.getUserByEmail(email);
    if (!record) {
      throw new Error('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated: UserRecord = {
      ...record,
      passwordHash,
    };

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: userKey(email),
        Body: JSON.stringify(updated),
        ContentType: 'application/json',
      })
    );

    return this.toPublic(updated);
  }

  async getUserByUid(uid: string): Promise<UserRecord | null> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new ListObjectsV2Command({ Bucket: bucketName, Prefix: 'users/' })
      );
      const objects = response.Contents || [];
      for (const obj of objects) {
        if (!obj.Key) continue;
        const getResp = await client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: obj.Key })
        );
        if (!getResp.Body) continue;
        const text = await getResp.Body.transformToString();
        const record = JSON.parse(text) as UserRecord;
        if (record.uid === uid) return record;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async isUserCountZero(): Promise<boolean> {
    const { client, bucketName } = createR2Client();
    try {
      const response = await client.send(
        new ListObjectsV2Command({ Bucket: bucketName, Prefix: 'users/', MaxKeys: 1 })
      );
      return !response.Contents || response.Contents.length === 0;
    } catch {
      return false;
    }
  }

  signToken(user: PublicUser): string {
    return jwt.sign(
      { uid: user.uid, email: user.email, name: user.displayName, role: user.role },
      getJwtSecret(),
      { expiresIn: '30d' }
    );
  }

  verifyToken(token: string): PublicUser | null {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        uid: string;
        email: string;
        name: string;
        role: 'user' | 'admin';
      };
      return {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name,
        role: decoded.role,
      };
    } catch {
      return null;
    }
  }

  private toPublic(record: UserRecord): PublicUser {
    return {
      uid: record.uid,
      email: record.email,
      displayName: record.displayName,
      role: record.role,
    };
  }
}

export const userRepository = new UserRepository();
