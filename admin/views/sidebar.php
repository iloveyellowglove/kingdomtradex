<?php
$currentPath = $_SERVER['SCRIPT_NAME'] ?? '';
?>
<div class="card bg-dark text-white mb-4 admin-sidebar">
    <div class="card-header"><h5 class="mb-0"><i class="bi bi-shield-lock"></i> Administering<br>the Kingdom's Treasury</h5></div>
    <div class="card-body p-0">
        <nav class="nav flex-column p-2">
            <a class="nav-link <?= str_ends_with($currentPath, '/admin/dashboard.php') ? 'active' : '' ?>" href="/admin/dashboard.php"><i class="bi bi-speedometer2"></i> Dashboard</a>
            <a class="nav-link <?= str_ends_with($currentPath, '/admin/users.php') ? 'active' : '' ?>" href="/admin/users.php"><i class="bi bi-people"></i> Users</a>
            <a class="nav-link <?= str_ends_with($currentPath, '/admin/deposits.php') ? 'active' : '' ?>" href="/admin/deposits.php"><i class="bi bi-download"></i> Pending Deposits</a>
            <a class="nav-link <?= str_ends_with($currentPath, '/admin/withdrawals.php') ? 'active' : '' ?>" href="/admin/withdrawals.php"><i class="bi bi-send"></i> Withdrawals</a>
            <a class="nav-link <?= str_ends_with($currentPath, '/admin/commissions.php') ? 'active' : '' ?>" href="/admin/commissions.php"><i class="bi bi-cash-stack"></i> Blessings Records</a>
            <a class="nav-link <?= str_ends_with($currentPath, '/admin/settings.php') ? 'active' : '' ?>" href="/admin/settings.php"><i class="bi bi-gear"></i> Settings</a>
        </nav>
    </div>
</div>
