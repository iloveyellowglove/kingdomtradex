<?php
$title = 'Register - QuantumTrade Exchange';
$csrfToken = csrfToken();
$ref = $_GET['ref'] ?? ($ref ?? '');
require __DIR__ . '/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-6">
        <div class="card shadow">
            <div class="card-body p-4">
                <h3 class="card-title text-center mb-4"><i class="bi bi-person-plus"></i> Register</h3>
                <form method="POST" action="/register.php">
                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control" id="username" name="username" required minlength="3" maxlength="50">
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control" id="password" name="password" required minlength="8">
                    </div>
                    <div class="mb-3">
                        <label for="referral_code" class="form-label">Referral Code (optional)</label>
                        <input type="text" class="form-control" id="referral_code" name="referral_code" maxlength="8" value="<?= h($ref) ?>" placeholder="Enter referral code">
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Register</button>
                </form>
                <p class="text-center mt-3 mb-0">
                    Already have an account? <a href="/login.php">Login</a>
                </p>
            </div>
        </div>
    </div>
</div>

<?php require __DIR__ . '/footer.php'; ?>
