import { createServiceClient } from '../supabase/service';

export async function logAdminAction(
  adminId: number,
  action: string,
  targetTable?: string | null,
  targetId?: number | null,
  oldValue?: string | null,
  newValue?: string | null,
  ip?: string | null
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('admin_logs').insert({
    admin_id: adminId,
    action,
    target_table: targetTable ?? null,
    target_id: targetId ?? null,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    ip: ip ?? '127.0.0.1',
    created_at: new Date().toISOString(),
  });
}

export async function getAdminLogs(limit = 100): Promise<unknown[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
