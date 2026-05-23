import { getCsrfToken } from '@/lib/auth/csrf';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const csrfToken = getCsrfToken();

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="card-body p-6">
            <h3 className="text-center mb-6">Log In</h3>
            <LoginForm csrfToken={csrfToken} />
            <div className="text-center mt-4 pt-4 border-t border-border">
              <small className="text-text-muted">Don&apos;t have an account? <a href="/register" className="text-temple-gold">Register</a></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
