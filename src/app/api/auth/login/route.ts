import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/user-repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await userRepository.verifyUser(email, password);
    const token = userRepository.signToken(user);

    return NextResponse.json({ user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
