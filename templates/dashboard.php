<?php
/**
 * Member Dashboard
 * Shows balances, disciple info, deposit/withdraw actions, and covenant economy report.
 */
$title = 'Dashboard - KingdomTrade Exchange';
require __DIR__ . '/header.php';

// Calculate rank for pastor/leader view
$directDisciples = $downlineCounts['level_1'];
$totalDisciples = array_sum($downlineCounts);
$rank = '';
if ($directDisciples >= 20 && $totalDisciples >= 200) {
    $rank = 'Apostle';
} elseif ($directDisciples >= 10 && $totalDisciples >= 50) {
    $rank = 'Prophet';
} elseif ($directDisciples >= 5) {
    $rank = 'Elder';
}
$rankClass = match($rank) {
    'Apostle' => 'rank-apostle',
    'Prophet' => 'rank-prophet',
    'Elder' => 'rank-elder',
    default => '',
};
?>

<div class="row mb-4">
    <div class="col-md-8">
        <h2>Welcome, <?= h($user['username']) ?>!</h2>
        <p class="text-muted">Faithful stewardship multiplies God's resources</p>
    </div>
    <div class="col-md-4 text-md-end">
        <small class="text-muted">Disciple Code: <strong class="text-primary"><?= h($user['referral_code']) ?></strong></small><br>
        <small>Your Disciple Invitation Link: <code><?= h('https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/register.php?ref=' . $user['referral_code']) ?></code></small>
    </div>
</div>

<!-- Stewardship Callout -->
<div class="stewardship-callout">
    <h5><i class="bi bi-lightbulb-fill"></i> God's Economics</h5>
    <p>You are a steward, not an owner. Trade wisely. "His lord said unto him, Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things." (Matthew 25:21)</p>
</div>

<!-- Balance Cards -->
<div class="row mb-4">
    <div class="col-md-4">
        <div class="card border-primary kingdom-card">
            <div class="card-body text-center">
                <h6 class="card-title text-muted">Display Balance</h6>
                <h3 class="text-primary"><?= number_format((float)$user['display_balance'], 8) ?> <small>USDT</small></h3>
                <small class="text-muted">Includes profits & blessings</small>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-success kingdom-card">
            <div class="card-body text-center">
                <h6 class="card-title text-muted">Total Deposited</h6>
                <h3 class="text-success"><?= number_format((float)$user['total_deposited_real'], 8) ?> <small>USDT</small></h3>
                <small class="text-muted">Real deposit total</small>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-warning kingdom-card">
            <div class="card-body text-center">
                <h6 class="card-title text-muted">Total Withdrawn</h6>
                <h3 class="text-warning"><?= number_format((float)$user['total_withdrawn_real'], 8) ?> <small>USDT</small></h3>
                <small class="text-muted">Net: <?= number_format((float)$user['total_deposited_real'] - (float)$user['total_withdrawn_real'], 8) ?></small>
            </div>
        </div>
    </div>
</div>

<!-- Covenant Economy Report (Leader/Pastor View) -->
<?php if ($user['role'] === 'pastor' || $user['role'] === 'admin' || $directDisciples > 0): ?>
<div class="kingdom-card card mb-4">
    <div class="card-header"><h5 class="mb-0"><i class="bi bi-journal-check"></i> Your Covenant Economy Report</h5></div>
    <div class="card-body">
        <div class="row text-center">
            <div class="col-md-3">
                <h4 class="text-success"><?= number_format($totalPaidComm, 2) ?> USDT</h4>
                <small class="text-muted">Total Blessings Earned (Paid)</small>
            </div>
            <div class="col-md-3">
                <h4 class="text-primary"><?= $directDisciples ?></h4>
                <small class="text-muted">Direct Disciples</small>
            </div>
            <div class="col-md-3">
                <h4 class="text-primary"><?= $totalDisciples ?></h4>
                <small class="text-muted">Total Disciples (All Levels)</small>
            </div>
            <div class="col-md-3">
                <?php if ($rank): ?>
                    <h4 class="<?= $rankClass ?>"><?= $rank ?></h4>
                    <small class="text-muted">Covenant Rank</small>
                <?php else: ?>
                    <h4 class="text-muted">-</h4>
                    <small class="text-muted">Covenant Rank (need 5+ direct disciples)</small>
                <?php endif; ?>
            </div>
        </div>
        <?php if ($rank === 'Apostle' || $rank === 'Prophet'): ?>
        <div class="alert alert-success mt-3 mb-0">
            <i class="bi bi-star-fill"></i>
            <strong>Testimony:</strong> Pastor J. received $12,000 in blessings last month by bringing 50 families into the Kingdom.
        </div>
        <?php endif; ?>
    </div>
</div>
<?php endif; ?>

<!-- Withdrawal Lock Warning -->
<?php if ($withdrawalLock): ?>
    <div class="alert alert-warning alert-dismissible fade show">
        <i class="bi bi-exclamation-triangle"></i>
        <strong>Security Hold:</strong> Withdrawals available after <?= date('Y-m-d H:i', strtotime($withdrawalLock['lock_expiry_time'])) ?>
        (<?php
            $now = new DateTime();
            $expiry = new DateTime($withdrawalLock['lock_expiry_time']);
            $remaining = $now->diff($expiry);
            if ($expiry > $now) {
                echo $remaining->format('%h hours, %i minutes remaining');
            } else {
                echo 'Expired - you can now withdraw';
            }
        ?>)
    </div>
<?php endif; ?>

<!-- Pending Withdrawal Alert -->
<?php if ((float)$user['pending_withdrawal_amount'] > 0): ?>
    <div class="alert alert-info">
        <i class="bi bi-hourglass-split"></i>
        Pending withdrawal: <strong><?= number_format((float)$user['pending_withdrawal_amount'], 8) ?> USDT</strong>
        (processing in 72 hours after request)
    </div>
<?php endif; ?>

<div class="row">
    <!-- Withdrawal Request Form -->
    <div class="col-md-6">
        <div class="card mb-4 kingdom-card">
            <div class="card-header"><h5 class="mb-0"><i class="bi bi-send"></i> Request Withdrawal</h5></div>
            <div class="card-body">
                <form method="POST" action="/dashboard.php?action=withdraw">
                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                    <div class="mb-3">
                        <label class="form-label">Currency</label>
                        <select class="form-select" name="currency">
                            <option value="USDT">USDT</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Amount</label>
                        <div class="input-group">
                            <input type="number" step="0.00000001" class="form-control" name="amount" required min="0.00000001">
                            <span class="input-group-text">USDT</span>
                        </div>
                        <small class="text-muted">Fee: 0.5% | Max: <?= number_format((float)$user['total_deposited_real'] - (float)$user['total_withdrawn_real'], 8) ?> (net deposit)</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Destination Address</label>
                        <input type="text" class="form-control" name="address" required placeholder="Crypto wallet address">
                        <small class="text-muted">Enter your wallet address for withdrawal</small>
                    </div>
                    <div class="alert alert-light border mb-3">
                        <small><i class="bi bi-info-circle"></i> Remember the widow's mite - withdraw only what you need.</small>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Request Withdrawal</button>
                </form>
            </div>
        </div>

        <!-- Deposit Simulator -->
        <div class="card mb-4 kingdom-card">
            <div class="card-header"><h5 class="mb-0"><i class="bi bi-download"></i> Deposit Funds</h5></div>
            <div class="card-body">
                <div class="alert alert-secondary">
                    <strong>Deposit Instructions:</strong> Send funds to the address below, then contact admin with your transaction ID to confirm.
                </div>
                <p><strong>Deposit Address (USDT TRC20):</strong></p>
                <code class="d-block p-2 bg-light text-break">TXt8LiveAddr<?= substr(md5($user['id']), 0, 10) ?>Xch</code>
                <p class="mt-3 mb-0"><small class="text-muted">After sending, contact admin with your transaction ID to confirm the deposit.</small></p>
            </div>
        </div>
    </div>

    <!-- Disciples Network & Blessings -->
    <div class="col-md-6">
        <div class="card mb-4 kingdom-card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-people"></i> Disciples Network</h5>
                <a href="/referral.php" class="btn btn-sm btn-outline-primary">View Disciples Tree</a>
            </div>
            <div class="card-body">
                <table class="table table-sm">
                    <thead><tr><th>Level</th><th>Blessing %</th><th>Disciples</th></tr></thead>
                    <tbody>
                        <tr><td>Level 1</td><td><?= h($settings->get('commission_l1', '15')) ?>%</td><td><?= $downlineCounts['level_1'] ?></td></tr>
                        <tr><td>Level 2</td><td><?= h($settings->get('commission_l2', '5')) ?>%</td><td><?= $downlineCounts['level_2'] ?></td></tr>
                        <tr><td>Level 3</td><td><?= h($settings->get('commission_l3', '3')) ?>%</td><td><?= $downlineCounts['level_3'] ?></td></tr>
                        <tr><td>Level 4</td><td><?= h($settings->get('commission_l4', '2')) ?>%</td><td><?= $downlineCounts['level_4'] ?></td></tr>
                        <tr><td>Level 5</td><td><?= h($settings->get('commission_l5', '1')) ?>%</td><td><?= $downlineCounts['level_5'] ?></td></tr>
                    </tbody>
                </table>
                <div class="mt-2">
                    <strong>Blessings Earned:</strong>
                    <span class="text-success"><?= number_format($totalPaidComm, 8) ?> USDT (paid)</span> |
                    <span class="text-warning"><?= number_format($totalPendingComm, 8) ?> USDT (pending)</span>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="card mb-4 kingdom-card">
            <div class="card-header"><h5 class="mb-0"><i class="bi bi-clock-history"></i> Recent Deposits</h5></div>
            <div class="card-body p-0">
                <?php if ($deposits): ?>
                    <table class="table table-sm mb-0">
                        <thead><tr><th>TxID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>
                            <?php foreach ($deposits as $d): ?>
                                <tr>
                                    <td><small><?= h(substr($d['txid'], 0, 12)) ?>...</small></td>
                                    <td><?= number_format((float)$d['amount'], 6) ?> <?= h($d['currency']) ?></td>
                                    <td><span class="badge bg-<?= $d['status'] === 'completed' ? 'success' : ($d['status'] === 'pending' ? 'warning' : 'danger') ?>"><?= h($d['status']) ?></span></td>
                                    <td><small><?= h($d['created_at']) ?></small></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p class="p-3 text-muted mb-0">No deposits yet.</p>
                <?php endif; ?>
            </div>
        </div>

        <!-- Recent Blessings -->
        <div class="card mb-4 kingdom-card">
            <div class="card-header"><h5 class="mb-0"><i class="bi bi-cash-stack"></i> Recent Blessings</h5></div>
            <div class="card-body p-0">
                <?php if ($commissions): ?>
                    <table class="table table-sm mb-0">
                        <thead><tr><th>From</th><th>Level</th><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                            <?php foreach ($commissions as $c): ?>
                                <tr>
                                    <td><?= h($c['source_username'] ?? 'Disciple #' . $c['source_user_id']) ?></td>
                                    <td>L<?= $c['level'] ?> (<?= $c['percentage'] ?>%)</td>
                                    <td><?= number_format((float)$c['amount'], 6) ?></td>
                                    <td><span class="badge bg-<?= $c['status'] === 'paid' ? 'success' : 'warning' ?>"><?= h($c['status']) ?></span></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p class="p-3 text-muted mb-0">No blessings yet.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php require __DIR__ . '/footer.php'; ?>
