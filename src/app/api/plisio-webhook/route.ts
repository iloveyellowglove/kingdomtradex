import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '@/lib/db/settings';
import { PlisioClient } from '@/lib/services/plisio-client';
import { PlisioDepositService } from '@/lib/services/plisio-deposit';

export async function POST(request: NextRequest) {
  const postData: Record<string, string> = {};
  const formData = await request.formData();
  formData.forEach((value, key) => {
    postData[key] = value.toString();
  });

  const plisioApiKey = await getSetting('plisio_api_key', '');
  if (!plisioApiKey) {
    return NextResponse.json({ success: false, error: 'Plisio not configured.' }, { status: 500 });
  }

  const client = new PlisioClient(plisioApiKey);
  const service = new PlisioDepositService(client);
  const result = await service.handleCallback(postData);

  return NextResponse.json(result);
}
