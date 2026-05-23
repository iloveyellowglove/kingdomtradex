<?php
/**
 * Mass Payout Endpoint
 * POST /api/admin/pay_pending_commissions.php
 * Aggregates all pending pastor commissions and sends via Plisio mass withdrawal.
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/PlisioClient.php';
require_once __DIR__ . '/../../includes/PlisioWithdrawalService.php';

// ── Auth: admin only ──
$admin = requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'POST required.']);
    exit;
}

$db = getDB();

// ── Load Plisio API key ──
$stmt = $db->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
$stmt->execute(['plisio_api_key']);
$apiKey = $stmt->fetchColumn();

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Plisio API key not configured. Add it in Admin > Settings.']);
    exit;
}

// ── Query: pending commissions grouped by pastor ──
// Join referral_commissions → users to filter role='pastor' and get plisio_btc_address
$commissions = $db->query(
    "SELECT rc.user_id, u.username, u.plisio_btc_address, SUM(rc.amount) AS total_usd
     FROM referral_commissions rc
     JOIN users u ON rc.user_id = u.id
     WHERE rc.status = 'pending' AND u.role = 'pastor'
     GROUP BY rc.user_id"
)->fetchAll();

// Also get individual commission IDs for marking paid later
$allPending = $db->query(
    "SELECT rc.id, rc.user_id, rc.amount, u.username, u.plisio_btc_address, u.role
     FROM referral_commissions rc
     JOIN users u ON rc.user_id = u.id
     WHERE rc.status = 'pending'"
)->fetchAll();

if (empty($allPending)) {
    echo json_encode(['success' => true, 'message' => 'No pending blessings to pay.']);
    exit;
}

// ── Filter: only pastors with a BTC address ──
$BTC_USD_RATE = 80000.0;
$payments = [];       // address => btc_amount
$pastorSummary = [];  // user_id => ['username', 'usd_amount', 'btc_amount', 'address', 'commission_ids']
$skipped = [];
$warnings = [];

foreach ($allPending as $c) {
    $uid = $c['user_id'];
    $address = trim($c['plisio_btc_address'] ?? '');

    if ($c['role'] !== 'pastor') {
        $skipped[] = ['user_id' => $uid, 'username' => $c['username'], 'reason' => 'Not a pastor (role: ' . $c['role'] . ')'];
        $warnings[] = "Skipped {$c['username']}: not a pastor.";
        continue;
    }

    if (empty($address)) {
        $skipped[] = ['user_id' => $uid, 'username' => $c['username'], 'reason' => 'No BTC wallet address set'];
        $warnings[] = "Skipped {$c['username']}: no BTC wallet address.";
        continue;
    }

    if (!isset($pastorSummary[$uid])) {
        $pastorSummary[$uid] = [
            'username' => $c['username'],
            'address' => $address,
            'usd_amount' => 0.0,
            'commission_ids' => [],
        ];
    }

    $pastorSummary[$uid]['usd_amount'] += (float)$c['amount'];
    $pastorSummary[$uid]['commission_ids'][] = (int)$c['id'];
}

if (empty($pastorSummary)) {
    echo json_encode([
        'success' => true,
        'message' => 'No eligible pastors with wallet addresses.',
        'warnings' => $warnings,
        'skipped' => $skipped,
    ]);
    exit;
}

// Convert USD to BTC and build payment array
foreach ($pastorSummary as $uid => $info) {
    $btcAmount = $info['usd_amount'] / $BTC_USD_RATE;
    // Avoid dust — round to 8 decimal places
    $btcAmount = round($btcAmount, 8);
    if ($btcAmount <= 0) {
        $skipped[] = ['user_id' => $uid, 'username' => $info['username'], 'reason' => 'BTC amount too small after conversion'];
        $warnings[] = "Skipped {$info['username']}: BTC amount too small.";
        continue;
    }
    $payments[$info['address']] = $btcAmount;
    $pastorSummary[$uid]['btc_amount'] = $btcAmount;
}

if (empty($payments)) {
    echo json_encode([
        'success' => true,
        'message' => 'No valid payments to send after conversion.',
        'warnings' => $warnings,
    ]);
    exit;
}

// ── Call Plisio mass withdrawal ──
$client = new PlisioClient($apiKey);
$withdrawalService = new PlisioWithdrawalService($client, $db);

$result = $withdrawalService->sendMassWithdrawals($payments, 'BTC');

if (!$result['success']) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error' => $result['error'] ?? 'Plisio mass withdrawal failed.',
        'attempted_payments' => count($payments),
        'warnings' => $warnings,
    ]);
    exit;
}

// ── Mark all paid commissions as 'paid' ──
$allCommissionIds = [];
foreach ($pastorSummary as $uid => $info) {
    $allCommissionIds = array_merge($allCommissionIds, $info['commission_ids']);
}

$paidCount = 0;
foreach ($allCommissionIds as $cid) {
    $stmt = $db->prepare("UPDATE referral_commissions SET status = 'paid', paid_at = NOW() WHERE id = ? AND status = 'pending'");
    $stmt->execute([$cid]);
    $paidCount += $stmt->rowCount();
}

// Log admin action
logAdminAction($db, (int)$admin['id'], 'mass_payout_plisio', 'referral_commissions', 0,
    json_encode([
        'pastors' => count($pastorSummary),
        'commissions_paid' => $paidCount,
        'total_btc' => array_sum($payments),
        'plisio_txn_id' => $result['txn_id'] ?? null,
    ])
);

// ── Response ──
echo json_encode([
    'success' => true,
    'message' => "Paid {$paidCount} blessings to " . count($pastorSummary) . " pastors.",
    'txn_id' => $result['txn_id'] ?? null,
    'tx_url' => $result['tx_url'] ?? ('https://plisio.net/account/transactions/' . ($result['txn_id'] ?? '')),
    'pastors_paid' => count($pastorSummary),
    'commissions_paid' => $paidCount,
    'total_btc' => number_format(array_sum($payments), 8),
    'total_usd' => number_format(array_sum(array_column($pastorSummary, 'usd_amount')), 2),
    'btc_rate' => $BTC_USD_RATE,
    'details' => array_values(array_map(function($info) {
        return [
            'username' => $info['username'],
            'address' => $info['address'],
            'usd' => number_format($info['usd_amount'], 2),
            'btc' => number_format($info['btc_amount'], 8),
        ];
    }, $pastorSummary)),
    'warnings' => $warnings,
    'skipped' => $skipped,
]);
