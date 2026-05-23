import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';

export async function POST() {
  return NextResponse.json({ hash: hashPassword('admin123') });
}
