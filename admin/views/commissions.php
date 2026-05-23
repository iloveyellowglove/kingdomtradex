<?php
$title = 'Blessings Records - Admin';
require __DIR__ . '/../../templates/header.php';
?>

<div class="row">
    <div class="col-md-3"><?php require __DIR__ . '/sidebar.php'; ?></div>
    <div class="col-md-9">
        <h3 class="mb-3">Blessings Records</h3>

        <!-- Mass Payout Button -->
        <div class="card mb-4 border-warning">
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <strong><i class="bi bi-send-check"></i> Mass Payout via Plisio</strong>
                    <br><small class="text-muted">Pays all pending blessings to pastors with BTC wallet addresses. Saves up to 80% on fees.</small>
                </div>
                <button id="massPayoutBtn" class="btn btn-warning btn-lg" onclick="triggerMassPayout()">
                    <i class="bi bi-lightning-charge"></i> Pay All Pending Blessings
                </button>
            </div>
            <div id="payoutResult" class="card-footer d-none"></div>
        </div>

        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th><th>To (Upline)</th><th>From (Depositor)</th><th>Level</th>
                        <th>%</th><th>Amount</th><th>Source Deposit</th><th>Deposit Amount</th>
                        <th>Status</th><th>Date</th><th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($commissions as $c): ?>
                    <tr>
                        <td>#<?= $c['id'] ?></td>
                        <td><?= h($c['user_name']) ?></td>
                        <td><?= h($c['source_name']) ?></td>
                        <td>L<?= $c['level'] ?></td>
                        <td><?= $c['percentage'] ?>%</td>
                        <td><?= number_format((float)$c['amount'], 6) ?></td>
                        <td>#<?= $c['source_deposit_id'] ?></td>
                        <td><?= number_format((float)$c['source_amount'], 4) ?></td>
                        <td><span class="badge bg-<?= $c['status'] === 'paid' ? 'success' : 'warning' ?>"><?= h($c['status']) ?></span></td>
                        <td><small><?= h($c['created_at']) ?></small></td>
                        <td>
                            <?php if ($c['status'] === 'pending'): ?>
                                <form method="POST">
                                    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
                                    <input type="hidden" name="action" value="mark_paid">
                                    <input type="hidden" name="commission_id" value="<?= $c['id'] ?>">
                                    <button class="btn btn-sm btn-success">Mark Paid</button>
                                </form>
                            <?php else: ?>
                                <small class="text-muted"><?= h($c['paid_at'] ?? '-') ?></small>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php if (empty($commissions)): ?>
                        <tr><td colspan="11" class="text-center text-muted py-3">No blessings yet.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
function triggerMassPayout() {
    const btn = document.getElementById('massPayoutBtn');
    const resultDiv = document.getElementById('payoutResult');
    const csrf = '<?= h($csrfToken) ?>';

    if (!confirm('This will send a mass withdrawal via Plisio for ALL pending pastor blessings.\n\nContinue?')) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    resultDiv.classList.remove('d-none', 'bg-success', 'bg-danger', 'bg-warning', 'text-white');
    resultDiv.classList.add('bg-light');
    resultDiv.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Contacting Plisio...';

    fetch('/api/admin/pay_pending_commissions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrf_token: csrf })
    })
    .then(r => r.json())
    .then(data => {
        resultDiv.classList.remove('bg-light');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-lightning-charge"></i> Pay All Pending Blessings';

        if (data.success) {
            resultDiv.classList.add('bg-success', 'text-white');

            let html = '<strong><i class="bi bi-check-circle"></i> ' + data.message + '</strong>';
            if (data.pastors_paid) {
                html += '<br><small>' + data.pastors_paid + ' pastors paid &middot; ' + data.commissions_paid + ' blessings &middot; ' + data.total_btc + ' BTC ($' + data.total_usd + ' USD at ' + data.btc_rate + ' BTC/USD)</small>';
            }
            if (data.tx_url) {
                html += '<br><a href="' + data.tx_url + '" target="_blank" rel="noopener" class="text-white fw-bold">View on Plisio &rarr;</a>';
            }
            if (data.details) {
                html += '<ul class="mb-0 mt-2 small">';
                data.details.forEach(function(d) {
                    html += '<li>' + d.username + ': ' + d.usd + ' USD &rarr; ' + d.btc + ' BTC &rarr; <code>' + d.address.substring(0, 12) + '...</code></li>';
                });
                html += '</ul>';
            }
            if (data.warnings && data.warnings.length) {
                html += '<div class="mt-2 small text-warning"><strong>Warnings:</strong><br>' + data.warnings.join('<br>') + '</div>';
            }
            resultDiv.innerHTML = html;

            // Reload after 3s so the admin sees updated status
            setTimeout(function() { location.reload(); }, 4000);
        } else {
            resultDiv.classList.add('bg-danger', 'text-white');
            let html = '<strong><i class="bi bi-exclamation-triangle"></i> Payout Failed</strong><br>' + (data.error || 'Unknown error');
            if (data.warnings && data.warnings.length) {
                html += '<br><small>' + data.warnings.join('<br>') + '</small>';
            }
            resultDiv.innerHTML = html;
        }
    })
    .catch(err => {
        resultDiv.classList.remove('bg-light');
        resultDiv.classList.add('bg-danger', 'text-white');
        resultDiv.innerHTML = '<strong>Network error:</strong> ' + err.message;
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-lightning-charge"></i> Pay All Pending Blessings';
    });
}
</script>

<?php require __DIR__ . '/../../templates/footer.php'; ?>
