import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function PATCH(request: NextRequest) {
  const { key, value } = await request.json();

  if (!key || value === undefined || value === null) {
    return NextResponse.json({ success: false, error: 'Missing key or value.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('settings')
    .update({ setting_value: value })
    .eq('setting_key', key);

  if (error) {
    console.log('[settings] update error:', JSON.stringify(error));
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
