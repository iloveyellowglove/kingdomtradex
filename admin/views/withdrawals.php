<?php
$title = 'Manage Withdrawals - Admin';
require __DIR__ . '/../../templates/header.php';
?>

<div class="row">
    <div class="col-md-3"><?php require __DIR__ . '/sidebar.php'; ?></div>
    <div class="col-md-9">
        <h3 class="mb-3">Manage Withdrawals</h3>

        <div class="mb-3">
            <a href="?status=" class="btn btn-sm btn-outline-secondary <?= !$statusFilter ? 'active' : '' ?>">All</a>
            <a href="?status=pending" class="btn btn-sm btn-outline-warning <?= $statusFilter === 'pending' ? 'active' : '' ?>">Pending</a>
            <a href="?status=processing" class="btn btn-sm btn-outline-info <?= $statusFilter === 'processing' ? 'active' : '' ?>">Processing</a>
            <a href="?status=completed" class="btn btn-sm btn-outline-success <?= $statusFilter === 'completed' ? 'active' : '' ?>">Completed</a>
        </div>

        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th><th>User</th><th>Amount</th><th>Fee</th><th>Address</th>
                        <th>Status</th><th>Eligible</th><th>Requested</th><th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($withdrawals as $w): ?>
                    <tr>
                        <td>#<?= $w['id'] ?></td>
                        <td><?= h($w['username']) ?></td>
                        <td><?= number_format((float)$w['amount'], 6) ?> <?= h($w['currency']) ?></td>
                        <td><?= number_format((float)$w['fee'], 6) ?></td>
                        <td><small><code><?= h(substr($w['address'], 0, 12)) ?>...</code></small></td>
                        <td>
                            <span class="badge bg-<?= match($w['status']) {
                                'completed' => 'success', 'processing' => 'info',
                                'pending' => 'warning', 'rejected' => 'danger', 'cancelled' => 'secondary',
                                default => 'secondary'
                            } ?>"><?= h($w['status']) ?></span>
                            <?php if ($w['admin_override']): ?><span class="badge bg-info">override</span><?php endif; ?>
                        </td>
                        <td><small><?= h($w['eligible_time']) ?></small></td>
                        <td><small><?= h($w['request_time']) ?></small></td>
                        <td>
                            <?php if ($w['status'] === 'pending' || $w['status'] === 'processing'): ?>
                                <form method="POST" class="d-inline">
                                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                    <input type="hidden" name="action" value="approve">
                                    <input type="hidden" name="withdrawal_id" value="<?= $w['id'] ?>">
                                    <button class="btn btn-sm btn-success" title="Admin approve (override lock)"><i class="bi bi-check-lg"></i></button>
                                </form>
                                <form method="POST" class="d-inline">
                                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                    <input type="hidden" name="action" value="cancel">
                                    <input type="hidden" name="withdrawal_id" value="<?= $w['id'] ?>">
                                    <button class="btn btn-sm btn-danger" onclick="return confirm('Cancel & refund?')"><i class="bi bi-x-lg"></i></button>
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($withdrawals)): ?>
                        <tr><td colspan="9" class="text-center text-muted py-3">No withdrawals found.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require __DIR__ . '/../../templates/footer.php'; ?>
