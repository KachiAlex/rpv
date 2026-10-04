import { NextRequest } from 'next/server';
import { userRepository } from './repositories/user-repository';
import type { PublicUser } from './repositories/user-repository';

export async function verifyBearerToken(request: NextRequest | Request): Promise<PublicUser> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const user = userRepository.verifyToken(token);

  if (!user) {
    throw new Error('Invalid token');
  }

  return user;
}

export async function getUserRole(userId: string): Promise<'user' | 'admin'> {
  const user = await userRepository.getUserByUid(userId);
  return user?.role || 'user';
}

export async function getUserByEmail(email: string): Promise<{ uid: string } | null> {
  const user = await userRepository.getUserByEmail(email);
  return user ? { uid: user.uid } : null;
}
