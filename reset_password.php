<?php
/**
 * Reset Password - user arrives with ?token= from the reset email.
 * GET: validates token, shows new password form.
 * POST: updates password hash, deletes used token, redirects to login.
 */
require_once __DIR__ . '/includes/functions.php';

$flashes = [];
$token = $_GET['token'] ?? ($_POST['token'] ?? '');
$tokenValid = false;
$tokenEmail = '';

if ($token) {
    $db = getDB();
    // Look up the token
    $rows = $db->query('password_resets', ['token' => 'eq.' . $token], '*', '', 1);
    $row = $rows[0] ?? null;

    if (!$row) {
        flash('error', 'Invalid or expired reset token.');
    } elseif (!empty($row['used'])) {
        flash('error', 'This reset token has already been used.');
    } else {
        // Check expiry (1 hour)
        $createdAt = strtotime($row['created_at'] ?? '');
        if ($createdAt && (time() - $createdAt) > 3600) {
            flash('error', 'This reset token has expired. Please request a new one.');
            // Mark as used so it can't be retried
            $db->patch('password_resets', ['token' => 'eq.' . $token], ['used' => true]);
        } else {
            $tokenValid = true;
            $tokenEmail = $row['email'];
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $tokenValid) {
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if (strlen($password) < 8) {
        flash('error', 'Password must be at least 8 characters.');
    } elseif ($password !== $confirm) {
        flash('error', 'Passwords do not match.');
    } else {
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $db = getDB();

        // Update user's password
        $updated = $db->patch('users', ['email' => 'eq.' . $tokenEmail], ['password_hash' => $hash]);
        error_log('[PASSWORD_RESET] Password updated for ' . $tokenEmail . ', rows affected: ' . $updated);

        // Mark token as used
        $db->patch('password_resets', ['token' => 'eq.' . $token], ['used' => true]);

        flash('success', 'Your password has been reset. Please log in with your new password.');
        header('Location: /login.php');
        exit;
    }
}

$flashes = getFlashes();
$title = 'Reset Password - KingdomTrade Exchange';
require __DIR__ . '/templates/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-5">
        <div class="card shadow">
            <div class="card-body p-4">
                <?php if ($tokenValid): ?>
                    <h3 class="card-title text-center mb-4"><i class="bi bi-shield-lock"></i> Set New Password</h3>
                    <p class="text-muted text-center mb-4">Enter your new password for <?= h($tokenEmail) ?>.</p>
                    <form method="POST" action="/reset_password.php">
                        <input type="hidden" name="token" value="<?= h($token) ?>">
                        <div class="mb-3">
                            <label for="password" class="form-label">New Password</label>
                            <input type="password" class="form-control" id="password" name="password" required minlength="8" autofocus>
                        </div>
                        <div class="mb-3">
                            <label for="confirm" class="form-label">Confirm Password</label>
                            <input type="password" class="form-control" id="confirm" name="confirm" required minlength="8">
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Reset Password</button>
                    </form>
                <?php else: ?>
                    <h3 class="card-title text-center mb-4"><i class="bi bi-shield-lock"></i> Reset Password</h3>
                    <div class="text-center">
                        <p class="text-muted">This reset link is invalid or has expired.</p>
                        <a href="/forgot_password.php" class="btn btn-primary">Request New Reset Link</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php require __DIR__ . '/templates/footer.php'; ?>
