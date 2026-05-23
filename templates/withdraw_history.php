<?php
$title = 'Withdrawal History - KingdomTrade Exchange';
require __DIR__ . '/header.php';
?>

<h2 class="mb-4"><i class="bi bi-clock-history"></i> Withdrawal History</h2>

<div class="card">
    <div class="card-body p-0">
        <?php if ($withdrawals): ?>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Fee</th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Requested</th>
                            <th>Eligible At</th>
                            <th>Processed</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($withdrawals as $w): ?>
                            <tr>
                                <td>#<?= $w['id'] ?></td>
                                <td><?= number_format((float)$w['amount'], 8) ?></td>
                                <td><?= h($w['currency']) ?></td>
                                <td><?= number_format((float)$w['fee'], 8) ?></td>
                                <td><small><code><?= h(substr($w['address'], 0, 16)) ?>...</code></small></td>
                                <td>
                                    <?php
                                    $badge = match($w['status']) {
                                        'completed' => 'success',
                                        'processing' => 'info',
                                        'pending' => 'warning',
                                        'rejected' => 'danger',
                                        'cancelled' => 'secondary',
                                        default => 'secondary',
                                    };
                                    ?>
                                    <span class="badge bg-<?= $badge ?>"><?= h($w['status']) ?></span>
                                    <?php if ($w['admin_override']): ?><span class="badge bg-info">admin</span><?php endif; ?>
                                </td>
                                <td><small><?= h($w['request_time']) ?></small></td>
                                <td><small><?= h($w['eligible_time']) ?></small></td>
                                <td><small><?= h($w['processed_time'] ?? '-') ?></small></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <p class="p-4 text-muted mb-0">No withdrawals yet.</p>
        <?php endif; ?>
    </div>
</div>

<div class="mt-3">
    <a href="/dashboard.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-left"></i> Back to Dashboard</a>
</div>

<?php require __DIR__ . '/footer.php'; ?>
