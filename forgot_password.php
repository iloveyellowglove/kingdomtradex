<?php
/**
 * Forgot Password - user enters email to receive a reset link.
 */
require_once __DIR__ . '/includes/functions.php';

$flashes = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim(strtolower($_POST['email'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        flash('error', 'Please enter a valid email address.');
    } else {
        $db = getDB();
        // Check if user exists
        $rows = $db->query('users', ['email' => 'eq.' . $email], 'id,email', '', 1);
        $user = $rows[0] ?? null;

        if (!$user) {
            // Don't reveal whether the email exists, always show success
            flash('success', 'If that email is registered, a reset link has been sent.');
        } else {
            $token = bin2hex(random_bytes(32));

            // Try to store token in password_resets table
            $result = $db->post('password_resets', [
                'email' => $email,
                'token' => $token,
                'created_at' => date('Y-m-d\TH:i:s\Z'),
                'used' => false,
            ]);

            // If the password_resets table doesn't exist yet, post() returns empty array.
            // Log the error so the admin knows to run sql/create_password_resets.sql
            if (empty($result)) {
                error_log('[PASSWORD_RESET] ERROR: password_resets table may not exist. Run sql/create_password_resets.sql in Supabase SQL Editor.');
                flash('error', 'Password reset is not available right now. Please contact support.');
            } else {
                $resetUrl = ($_SERVER['REQUEST_SCHEME'] ?? 'https') . '://' . ($_SERVER['HTTP_HOST'] ?? 'kingdomtradex.vercel.app') . '/reset_password.php?token=' . $token;

                // On Vercel, mail() may not work -- log the reset link to error_log
                $mailed = @mail('iloveyellowglove@gmail.com', 'KingdomTrade Password Reset', "Reset link: $resetUrl\n\nThis link expires in 1 hour.");
                if (!$mailed) {
                    error_log('[PASSWORD_RESET] mail() not available. Reset token for ' . $email . ': ' . $resetUrl);
                } else {
                    error_log('[PASSWORD_RESET] Reset email sent to iloveyellowglove@gmail.com for user ' . $email);
                }

                flash('success', 'If that email is registered, a reset link has been sent.');
            }
        }
    }
}

$flashes = getFlashes();
$title = 'Forgot Password - KingdomTrade Exchange';
require __DIR__ . '/templates/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-5">
        <div class="card shadow">
            <div class="card-body p-4">
                <h3 class="card-title text-center mb-4"><i class="bi bi-key"></i> Forgot Password</h3>
                <p class="text-muted text-center mb-4">Enter your email address and we will send you a reset link.</p>
                <form method="POST" action="/forgot_password.php">
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" required autofocus>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Send Reset Link</button>
                </form>
                <p class="text-center mt-3 mb-0">
                    <a href="/login.php">Back to Login</a>
                </p>
            </div>
        </div>
    </div>
</div>

<?php require __DIR__ . '/templates/footer.php'; ?>
