<?php
$title = 'Pending Deposits - Admin';
require __DIR__ . '/../../templates/header.php';
?>

<div class="row">
    <div class="col-md-3"><?php require __DIR__ . '/sidebar.php'; ?></div>
    <div class="col-md-9">
        <h3 class="mb-3">Pending Deposits</h3>

        <?php if ($deposits): ?>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-dark">
                        <tr><th>ID</th><th>User</th><th>TxID</th><th>Currency</th><th>Amount</th><th>Date</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($deposits as $d): ?>
                        <tr>
                            <td>#<?= $d['id'] ?></td>
                            <td><?= h($d['username']) ?> <small>(<?= h($d['email']) ?>)</small></td>
                            <td><small><code><?= h(substr($d['txid'], 0, 16)) ?>...</code></small></td>
                            <td><?= h($d['currency']) ?></td>
                            <td><strong><?= number_format((float)$d['amount'], 8) ?></strong></td>
                            <td><small><?= h($d['created_at']) ?></small></td>
                            <td>
                                <form method="POST" class="d-inline">
                                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                    <input type="hidden" name="action" value="confirm">
                                    <input type="hidden" name="deposit_id" value="<?= $d['id'] ?>">
                                    <button class="btn btn-sm btn-success" onclick="return confirm('Confirm this deposit? Blessings will be awarded to up to 5 upline levels.')">
                                        <i class="bi bi-check-lg"></i> Confirm
                                    </button>
                                </form>
                                <form method="POST" class="d-inline">
                                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                    <input type="hidden" name="action" value="reject">
                                    <input type="hidden" name="deposit_id" value="<?= $d['id'] ?>">
                                    <button class="btn btn-sm btn-outline-danger" onclick="return confirm('Reject this deposit?')">
                                        <i class="bi bi-x-lg"></i> Reject
                                    </button>
                                </form>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else: ?>
            <div class="alert alert-info">No pending deposits.</div>
        <?php endif; ?>
    </div>
</div>

<?php require __DIR__ . '/../../templates/footer.php'; ?>
