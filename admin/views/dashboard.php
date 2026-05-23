<?php
$title = 'Admin Dashboard';
require __DIR__ . '/../../templates/header.php';
?>

<div class="row">
    <div class="col-md-3">
        <div class="card bg-dark text-white mb-4 admin-sidebar">
            <div class="card-header"><h5 class="mb-0"><i class="bi bi-shield-lock"></i> Administering<br>the Kingdom's Treasury</h5></div>
            <div class="card-body p-0">
                <nav class="nav flex-column p-2">
                    <a class="nav-link active" href="/admin/dashboard.php"><i class="bi bi-speedometer2"></i> Dashboard</a>
                    <a class="nav-link" href="/admin/users.php"><i class="bi bi-people"></i> Users</a>
                    <a class="nav-link" href="/admin/deposits.php"><i class="bi bi-download"></i> Pending Deposits</a>
                    <a class="nav-link" href="/admin/withdrawals.php"><i class="bi bi-send"></i> Withdrawals</a>
                    <a class="nav-link" href="/admin/commissions.php"><i class="bi bi-cash-stack"></i> Blessings Records</a>
                    <a class="nav-link" href="/admin/settings.php"><i class="bi bi-gear"></i> Settings</a>
                </nav>
            </div>
        </div>
    </div>

    <div class="col-md-9">
        <h3 class="mb-4">Admin Dashboard</h3>
        <p class="text-muted mb-4"><i class="bi bi-key"></i> Administering the Kingdom's treasury.</p>

        <div class="row">
            <div class="col-md-4">
                <div class="card mb-3 kingdom-card">
                    <div class="card-body text-center">
                        <h1 class="text-primary"><?= number_format($totalUsers) ?></h1>
                        <h6>Total Stewards</h6>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card mb-3 kingdom-card">
                    <div class="card-body text-center">
                        <h1 class="text-success"><?= number_format((float)$totalDeposits, 2) ?></h1>
                        <h6>Total Deposits (USDT)</h6>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card mb-3 kingdom-card">
                    <div class="card-body text-center">
                        <h1 class="text-warning"><?= (int)$pendingWithdrawals ?></h1>
                        <h6>Pending Withdrawals</h6>
                    </div>
                </div>
            </div>
        </div>

        <div class="card kingdom-card">
            <div class="card-header"><h5 class="mb-0">Quick Actions</h5></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6 col-md-3 mb-2"><a href="/admin/deposits.php" class="btn btn-outline-primary w-100">Manage Deposits</a></div>
                    <div class="col-6 col-md-3 mb-2"><a href="/admin/withdrawals.php" class="btn btn-outline-warning w-100">Withdrawals</a></div>
                    <div class="col-6 col-md-3 mb-2"><a href="/admin/users.php" class="btn btn-outline-info w-100">Users</a></div>
                    <div class="col-6 col-md-3 mb-2"><a href="/admin/settings.php" class="btn btn-outline-secondary w-100">Settings</a></div>
                </div>
            </div>
        </div>

        <div class="card mt-4 kingdom-card">
            <div class="card-header"><h5 class="mb-0">Cron Jobs</h5></div>
            <div class="card-body">
                <ul class="mb-0">
                    <li><code>cron/process_withdrawals.php</code> - Hourly, processes eligible withdrawals</li>
                    <li><code>cron/apply_daily_profit.php</code> - Daily midnight, applies daily harvest (trading profits)</li>
                    <li><code>cron/send_reminder_emails.php</code> - Daily, sends reminders (optional)</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<?php require __DIR__ . '/../../templates/footer.php'; ?>
