import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST() {
  const hash = await bcrypt.hash('admin123', 12);
  return NextResponse.json({ hash });
}
