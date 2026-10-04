import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/user-repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await userRepository.createUser(email, password, displayName);
    const token = userRepository.signToken(user);

    return NextResponse.json({ user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign up failed';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
