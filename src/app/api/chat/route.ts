import { NextRequest, NextResponse } from 'next/server';
import { queryOracle } from '@/lib/services/oracle';

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  const reply = await queryOracle(message || '');
  return NextResponse.json({ reply });
}
