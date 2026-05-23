import { NextRequest, NextResponse } from 'next/server';
import { updateSetting } from '@/lib/db/settings';

export async function PATCH(request: NextRequest) {
  const { key, value } = await request.json();

  if (!key || value === undefined || value === null) {
    return NextResponse.json({ success: false, error: 'Missing key or value.' }, { status: 400 });
  }

  await updateSetting(key, value);
  return NextResponse.json({ success: true });
}
