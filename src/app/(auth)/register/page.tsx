import { getCsrfToken } from '@/lib/auth/csrf';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const csrfToken = getCsrfToken();

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="card-body p-6">
            <h3 className="text-center mb-6">Create Account</h3>
            <RegisterForm csrfToken={csrfToken} />
            <div className="text-center mt-4 pt-4 border-t border-border">
              <small className="text-text-muted">Already have an account? <a href="/login" className="text-temple-gold">Log In</a></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
