<?php
$title = 'Manage Users - Admin';
require __DIR__ . '/../../templates/header.php';
?>

<div class="row">
    <div class="col-md-3">
        <?php require __DIR__ . '/sidebar.php'; ?>
    </div>
    <div class="col-md-9">
        <h3 class="mb-3">Manage Users</h3>

        <form method="GET" class="mb-3">
            <div class="input-group">
                <input type="text" class="form-control" name="q" placeholder="Search by email or username..." value="<?= h($search) ?>">
                <button class="btn btn-outline-primary" type="submit"><i class="bi bi-search"></i> Search</button>
            </div>
        </form>

        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th><th>Username</th><th>Email</th><th>Role</th>
                        <th>Display Balance</th><th>Deposited</th><th>Withdrawn</th>
                        <th>Status</th><th>Created</th><th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $u): ?>
                    <tr>
                        <td><?= $u['id'] ?></td>
                        <td><?= h($u['username']) ?></td>
                        <td><small><?= h($u['email']) ?></small></td>
                        <td><span class="badge bg-<?= $u['role'] === 'admin' ? 'danger' : ($u['role'] === 'pastor' ? 'info' : 'secondary') ?>"><?= h($u['role']) ?></span></td>
                        <td><?= number_format((float)$u['display_balance'], 4) ?></td>
                        <td><?= number_format((float)$u['total_deposited_real'], 4) ?></td>
                        <td><?= number_format((float)$u['total_withdrawn_real'], 4) ?></td>
                        <td><span class="badge bg-<?= $u['status'] === 'active' ? 'success' : ($u['status'] === 'suspended' ? 'warning' : 'danger') ?>"><?= h($u['status']) ?></span></td>
                        <td><small><?= h(date('Y-m-d', strtotime($u['created_at']))) ?></small></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#adjustModal<?= $u['id'] ?>">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <form method="POST" class="d-inline" onsubmit="return confirm('Unlock withdrawals for this user?')">
                                <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                <input type="hidden" name="action" value="unlock_withdrawal">
                                <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                <button class="btn btn-sm btn-outline-warning"><i class="bi bi-unlock"></i></button>
                            </form>
                        </td>
                    </tr>

                    <!-- User Edit Modal -->
                    <div class="modal fade" id="adjustModal<?= $u['id'] ?>" tabindex="-1">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Edit User: <?= h($u['username']) ?> <span class="badge bg-<?= $u['role'] === 'admin' ? 'danger' : ($u['role'] === 'pastor' ? 'info' : 'secondary') ?>"><?= h($u['role']) ?></span></h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <!-- Balance Adjust -->
                                    <form method="POST" class="mb-4">
                                        <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                        <input type="hidden" name="action" value="adjust_balance">
                                        <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                        <h6 class="border-bottom pb-2 mb-3">Balance</h6>
                                        <p>Current: <strong><?= number_format((float)$u['display_balance'], 8) ?></strong></p>
                                        <div class="input-group">
                                            <input type="number" step="0.00000001" class="form-control" name="new_balance" value="<?= $u['display_balance'] ?>" required>
                                            <button type="submit" class="btn btn-primary">Save Balance</button>
                                        </div>
                                    </form>

                                    <!-- Role + Wallet Addresses -->
                                    <form method="POST">
                                        <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                        <input type="hidden" name="action" value="update_user">
                                        <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                        <h6 class="border-bottom pb-2 mb-3">Role &amp; Wallet Addresses</h6>
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Role</label>
                                                <select class="form-select" name="role">
                                                    <option value="member" <?= $u['role'] === 'member' ? 'selected' : '' ?>>Member</option>
                                                    <option value="pastor" <?= $u['role'] === 'pastor' ? 'selected' : '' ?>>Pastor</option>
                                                    <option value="admin" <?= $u['role'] === 'admin' ? 'selected' : '' ?>>Admin</option>
                                                </select>
                                                <small class="text-muted">Pastors can receive mass payouts.</small>
                                            </div>
                                        </div>
                                        <div class="mb-2">
                                            <label class="form-label">BTC Address</label>
                                            <input type="text" class="form-control font-monospace" name="plisio_btc_address" value="<?= h($u['plisio_btc_address'] ?? '') ?>" placeholder="bc1q..." style="font-size:13px;">
                                        </div>
                                        <div class="mb-2">
                                            <label class="form-label">ETH Address</label>
                                            <input type="text" class="form-control font-monospace" name="plisio_eth_address" value="<?= h($u['plisio_eth_address'] ?? '') ?>" placeholder="0x..." style="font-size:13px;">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">USDT Address</label>
                                            <input type="text" class="form-control font-monospace" name="plisio_usdt_address" value="<?= h($u['plisio_usdt_address'] ?? '') ?>" placeholder="TR..." style="font-size:13px;">
                                        </div>
                                        <button type="submit" class="btn btn-success">Update Role &amp; Wallets</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require __DIR__ . '/../../templates/footer.php'; ?>
