<?php
$title = 'Login - KingdomTrade Exchange';
$csrfToken = csrfToken();
require __DIR__ . '/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-5">
        <div class="card shadow">
            <div class="card-body p-4">
                <h3 class="card-title text-center mb-4"><i class="bi bi-lock"></i> Login</h3>
                <form method="POST" action="/login.php">
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" required autofocus>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Login</button>
                </form>
                <p class="text-center mt-3 mb-0">
                    <a href="/forgot_password.php">Forgot Password?</a>
                </p>
                <p class="text-center mt-2 mb-0">
                    Don't have an account? <a href="/register.php">Register</a>
                </p>
            </div>
        </div>
    </div>
</div>

<?php require __DIR__ . '/footer.php'; ?>
