<?php
$title = 'Disciples Network - KingdomTrade Exchange';
require __DIR__ . '/header.php';

function renderTree(array $nodes, int $depth = 0): void {
    if (empty($nodes)) return;
    foreach ($nodes as $node):
        $indent = $depth * 20;
?>
    <div class="tree-node" style="--tree-indent: <?= $indent ?>px;" data-depth="<?= $depth ?>">
        <div class="card mb-2 border-<?= $depth === 0 ? 'primary' : ($depth < 2 ? 'success' : 'secondary') ?>">
            <div class="card-body py-2 px-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong><?= h($node['username']) ?></strong>
                        <span class="badge bg-info ms-2">L<?= $node['level'] ?></span>
                    </div>
                    <div class="text-end">
                        <small class="text-muted">Balance: <?= number_format((float)$node['display_balance'], 4) ?> USDT</small><br>
                        <small class="text-muted">Joined: <?= h(date('Y-m-d', strtotime($node['created_at']))) ?></small>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?php
        if (!empty($node['children'])) {
            renderTree($node['children'], $depth + 1);
        }
    endforeach;
}
?>

<h2 class="mb-4"><i class="bi bi-diagram-3"></i> Disciples Tree</h2>

<div class="card mb-4 kingdom-card">
    <div class="card-header">
        <h5 class="mb-0">Your Disciple Invitation Link</h5>
    </div>
    <div class="card-body">
        <div class="input-group">
            <input type="text" class="form-control" readonly
                   value="<?= h((getenv('APP_URL') ?: 'https://kingdomtradex.vercel.app') . '/register.php?ref=' . $user['referral_code']) ?>"
                   id="refLink">
            <button class="btn btn-outline-primary" onclick="navigator.clipboard.writeText(document.getElementById('refLink').value);alert('Copied!')">
                <i class="bi bi-clipboard"></i> Copy
            </button>
        </div>
        <small class="text-muted">Share this link to make disciples and earn multi-level blessings.</small>
    </div>
</div>

<h4>Disciples Tree (5 Levels)</h4>
<?php
if (!empty($tree)) {
    renderTree($tree);
} else {
    echo '<div class="alert alert-info">No disciples yet. Share your invitation link and fulfill the Great Commission!</div>';
}
?>

<div class="mt-3">
    <a href="/dashboard.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-left"></i> Back to Dashboard</a>
</div>

<?php require __DIR__ . '/footer.php'; ?>
