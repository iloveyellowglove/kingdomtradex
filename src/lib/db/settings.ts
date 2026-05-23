import { createServiceClient } from '../supabase/service';
import type { Setting } from '../types';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('settings')
    .select('setting_value')
    .eq('setting_key', key)
    .limit(1);
  return data?.[0]?.setting_value ?? defaultValue;
}

export async function getAllSettings(): Promise<Setting[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('settings')
    .select('*')
    .order('id');
  return data ?? [];
}

export async function updateSetting(key: string, value: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('settings')
    .update({ setting_value: value })
    .eq('setting_key', key);
}
