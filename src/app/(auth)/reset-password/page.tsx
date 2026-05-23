import { createServiceClient } from '@/lib/supabase/service';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token || '';
  let tokenValid = false;
  let tokenEmail = '';
  let error = '';

  if (token) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .limit(1);

    const row = (data ?? [])[0] as unknown as { used: boolean; created_at: string; email: string } | undefined;
    if (!row) {
      error = 'Invalid or expired reset token.';
    } else if (row.used) {
      error = 'This reset token has already been used.';
    } else {
      const createdAt = new Date(row.created_at).getTime();
      if (Date.now() - createdAt > 3600000) {
        error = 'This reset token has expired. Please request a new one.';
        await supabase.from('password_resets').update({ used: true } as unknown as Record<string, unknown>).eq('token', token);
      } else {
        tokenValid = true;
        tokenEmail = row.email;
      }
    }
  }

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="card-body p-6">
            {tokenValid ? (
              <>
                <h3 className="text-center mb-4">Set New Password</h3>
                <ResetPasswordForm token={token} email={tokenEmail} />
              </>
            ) : (
              <>
                <h3 className="text-center mb-4">Reset Password</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="text-center">
                  <p className="text-text-muted mb-4">This reset link is invalid or has expired.</p>
                  <a href="/forgot-password" className="btn-primary inline-block px-6 py-3 rounded-lg">Request New Reset Link</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
