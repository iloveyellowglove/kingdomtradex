<?php
$title = 'System Settings - Admin';
require __DIR__ . '/../../templates/header.php';
?>

<div class="row">
    <div class="col-md-3"><?php require __DIR__ . '/sidebar.php'; ?></div>
    <div class="col-md-9">
        <h3 class="mb-3">System Settings</h3>

        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">

            <div class="card mb-4 kingdom-card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-cash-stack"></i> Blessing Percentages (Disciple Levels)</h5></div>
                <div class="card-body">
                    <div class="row">
                        <?php for ($i = 1; $i <= 5; $i++):
                            $key = "commission_l$i";
                            $val = $settings[$key]['value'] ?? '0';
                            $biblicalNames = [
                                1 => 'Firstfruits',
                                2 => 'Fruit that Remains',
                                3 => 'Thirtyfold Return',
                                4 => 'Sixtyfold',
                                5 => 'Hundredfold',
                            ];
                        ?>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Level <?= $i ?>: <?= $biblicalNames[$i] ?></label>
                            <div class="input-group">
                                <input type="number" step="0.01" min="0" max="100" class="form-control" name="<?= $key ?>" value="<?= h($val) ?>">
                                <span class="input-group-text">%</span>
                            </div>
                            <small class="text-muted"><?= h($settings[$key]['description'] ?? '') ?></small>
                        </div>
                        <?php endfor; ?>
                    </div>
                </div>
            </div>

            <div class="card mb-4 kingdom-card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-graph-up"></i> Daily Harvest & Security Settings</h5></div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Daily Profit Percentage</label>
                            <div class="input-group">
                                <input type="number" step="0.01" min="0" max="100" class="form-control" name="daily_profit_percentage" value="<?= h($settings['daily_profit_percentage']['value'] ?? '1.5') ?>">
                                <span class="input-group-text">%</span>
                            </div>
                            <small class="text-muted">Applied daily at midnight via cron</small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Withdrawal Lock Hours</label>
                            <input type="number" step="1" min="0" max="720" class="form-control" name="withdrawal_lock_hours" value="<?= h($settings['withdrawal_lock_hours']['value'] ?? '72') ?>">
                            <small class="text-muted">Hours before first withdrawal allowed</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-4 kingdom-card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-wallet2"></i> Minimum Amounts</h5></div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Min Deposit USDT</label>
                            <input type="number" step="0.01" min="0" class="form-control" name="min_deposit_usdt" value="<?= h($settings['min_deposit_usdt']['value'] ?? '10') ?>">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Min Deposit BTC</label>
                            <input type="number" step="0.0001" min="0" class="form-control" name="min_deposit_btc" value="<?= h($settings['min_deposit_btc']['value'] ?? '0.001') ?>">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Min Deposit ETH</label>
                            <input type="number" step="0.0001" min="0" class="form-control" name="min_deposit_eth" value="<?= h($settings['min_deposit_eth']['value'] ?? '0.01') ?>">
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Min Withdrawal USDT</label>
                            <input type="number" step="0.01" min="0" class="form-control" name="min_withdrawal_usdt" value="<?= h($settings['min_withdrawal_usdt']['value'] ?? '10') ?>">
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-4 kingdom-card">
                <div class="card-header"><h5 class="mb-0"><i class="bi bi-link-45deg"></i> Plisio Payment Integration</h5></div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Plisio Secret Key</label>
                        <input type="password" class="form-control" name="plisio_api_key" value="<?= h($settings['plisio_api_key']['value'] ?? '') ?>" placeholder="sk_...">
                        <small class="text-muted">Get your key from Plisio API Settings. Enables real crypto deposits and withdrawals.</small>
                    </div>
                    <div class="mb-0">
                        <label class="form-label">Webhook URL (set in Plisio dashboard)</label>
                        <code><?= (getenv('APP_URL') ?: 'https://kingdomtradex.vercel.app') ?>/api/plisio_webhook.php</code>
                    </div>
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg"><i class="bi bi-save"></i> Save All Settings</button>
        </form>
    </div>
</div>

<?php require __DIR__ . '/../../templates/footer.php'; ?>
