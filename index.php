<?php
/**
 * Router / Homepage - DEMO MODE
 * Christian Crypto Exchange - KingdomTrade
 *
 * When used as PHP built-in server router, return false for existing
 * static files and PHP scripts so they're served directly.
 */
if (php_sapi_name() === 'cli-server') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $file = __DIR__ . $uri;
    // Serve existing files and PHP scripts directly (bypass router)
    // Skip the root path (/) - we handle that ourselves.
    if ($uri !== '/' && $uri !== '' && file_exists($file) && !is_dir($file)) {
        return false;
    }
    // Serve directory index for subdirectories (not root)
    if ($uri !== '/' && $uri !== '' && is_dir($file) && file_exists($file . '/index.php')) {
        return false;
    }
}

require_once __DIR__ . '/includes/functions.php';
$currentUser = currentUser();

if ($currentUser) {
    header('Location: /dashboard.php');
    exit;
}

$title = 'KingdomTrade Exchange - The Parable of the Talents';
ob_start();
?>

<!-- Urgency Banner -->
<div class="urgency-banner">
    🔥 The next 3-4 months are a prophetic window. End-times harvest is now.
</div>

<!-- Hero Section -->
<div class="hero-section mt-4">
    <h1 class="display-5 fw-bold">🕊️ The Parable of the Talents</h1>
    <h2 class="mb-3">Invest for the Kingdom</h2>
    <p class="lead mb-3">Matthew 25:14-30: Hiding your talents is sin. Faithful stewardship multiplies God's resources.</p>
    <p class="mb-0 fs-5">Break free from Babylon's financial system. Crypto is your path to economic freedom.</p>
</div>

<div class="row g-4 py-4">
    <div class="col-md-4">
        <div class="kingdom-card card h-100 text-center">
            <div class="card-header"><h5 class="mb-0">🕊️ Divine Trading</h5></div>
            <div class="card-body">
                <p class="card-text">Automated quantitative trading guided by wisdom. Daily profit generation from the digital harvest. Be faithful over a few things.</p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="kingdom-card card h-100 text-center">
            <div class="card-header"><h5 class="mb-0">👥 Make Disciples</h5></div>
            <div class="card-body">
                <p class="card-text">Earn blessings across 5 levels of your spiritual lineage. Build the Kingdom and receive your thirtyfold, sixtyfold, and hundredfold return.</p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="kingdom-card card h-100 text-center">
            <div class="card-header"><h5 class="mb-0">🛡️ Secure & Faithful</h5></div>
            <div class="card-body">
                <p class="card-text">72-hour security hold on withdrawals. Multi-level balance tracking. Full transaction history. Transparent as the light of the world.</p>
            </div>
        </div>
    </div>
</div>

<div class="text-center py-3">
    <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
        <a href="/register.php" class="btn btn-primary btn-lg px-5 py-3">🔥 Begin the Harvest</a>
        <a href="/login.php" class="btn btn-outline-secondary btn-lg px-5 py-3">Login</a>
    </div>
</div>

<div class="text-center py-3">
    <div class="alert alert-secondary">
        <strong>DEMO MODE NOTICE:</strong> This is a simulation platform for educational purposes only.
        No real cryptocurrency transactions occur. All balances, trades, and blessings are simulated.
        No payment gateways or blockchain nodes are connected.
    </div>
</div>
<?php
$content = ob_get_clean();
require __DIR__ . '/templates/header.php';
echo $content;
require __DIR__ . '/templates/footer.php';
