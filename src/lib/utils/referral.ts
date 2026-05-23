import crypto from 'crypto';
import { createServiceClient } from '../supabase/service';

export async function generateReferralCode(): Promise<string> {
  const supabase = createServiceClient();

  let code: string;
  let attempts = 0;
  do {
    code = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .limit(1);
    if (!data || data.length === 0) break;
    attempts++;
  } while (attempts < 20);

  return code;
}

export function generatePlisioUid(userId: number, email: string): string {
  const hash = crypto.createHash('md5').update(email + Date.now()).digest('hex').substring(0, 8);
  return `user_${userId}_${hash}`;
}
