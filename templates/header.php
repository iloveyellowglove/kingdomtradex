<?php
/**
 * Common header template
 */
$currentUser = currentUser();
$siteName = 'KingdomTrade Exchange';
try {
    $siteName = getSetting(getDB(), 'site_name', $siteName);
} catch (Throwable $e) {}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($title ?? $siteName) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/custom.css">
    <?= $extraHead ?? '' ?>
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark mb-0">
    <div class="container">
        <a class="navbar-brand fw-bold" href="/">
            🕊️ <?= h($siteName) ?>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <?php if ($currentUser): ?>
                    <li class="nav-item">
                        <a class="nav-link" href="/dashboard.php"><i class="bi bi-speedometer2"></i> Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/trading.php"><i class="bi bi-graph-up"></i> Trading</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/withdrawals.php"><i class="bi bi-wallet2"></i> Withdrawals</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/referral.php"><i class="bi bi-people"></i> Disciples</a>
                    </li>
                    <?php if ($currentUser['role'] === 'admin'): ?>
                        <li class="nav-item">
                            <a class="nav-link text-warning" href="/admin/dashboard.php"><i class="bi bi-shield-lock"></i> Admin</a>
                        </li>
                    <?php endif; ?>
                <?php endif; ?>
                <li class="nav-item">
                    <a class="nav-link" href="/about/"><i class="bi bi-book"></i> About</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/covenant/"><i class="bi bi-journal-text"></i> Covenant</a>
                </li>
            </ul>
            <ul class="navbar-nav">
                <?php if ($currentUser): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i> <?= h($currentUser['username']) ?>
                            <span class="badge bg-secondary"><?= h($currentUser['role']) ?></span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><span class="dropdown-item-text">
                                Balance: <strong><?= number_format((float)$currentUser['display_balance'], 8) ?> USDT</strong>
                            </span></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="/logout.php"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
                        </ul>
                    </li>
                <?php else: ?>
                    <li class="nav-item">
                        <a class="nav-link" href="/login.php">Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/register.php">Register</a>
                    </li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>

<?php if (!empty($flashes)): ?>
    <div class="container mt-3">
        <?php foreach ($flashes as $type => $msg): ?>
            <div class="alert alert-<?= $type === 'error' ? 'danger' : $type ?> alert-dismissible fade show" role="alert">
                <?= h($msg) ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<main class="container mt-3">
