<?php
/**
 * Mass Payout Endpoint - Supabase PostgreSQL backend
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
$rows = $db->query('settings', ['setting_key' => 'eq.plisio_api_key'], 'setting_value', '', 1);
$apiKey = $rows[0]['setting_value'] ?? '';

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Plisio API key not configured. Add it in Admin > Settings.']);
    exit;
}

// ── Query: all pending commissions with user data ──
$allPending = $db->join(
    'referral_commissions',
    ['status' => 'eq.pending'],
    'users',
    'id',
    'user_id',
    'id,user_id,amount,users_username,users_plisio_btc_address,users_role'
);

if (empty($allPending)) {
    echo json_encode(['success' => true, 'message' => 'No pending blessings to pay.']);
    exit;
}

// ── Filter: only pastors with a BTC address ──
$BTC_USD_RATE = 80000.0;
$payments = [];
$pastorSummary = [];
$skipped = [];
$warnings = [];

foreach ($allPending as $c) {
    $uid = $c['user_id'];
    $address = trim($c['users_plisio_btc_address'] ?? '');
    $role = $c['users_role'] ?? '';
    $username = $c['users_username'] ?? 'Unknown';

    if ($role !== 'pastor') {
        $skipped[] = ['user_id' => $uid, 'username' => $username, 'reason' => 'Not a pastor (role: ' . $role . ')'];
        $warnings[] = "Skipped {$username}: not a pastor.";
        continue;
    }

    if (empty($address)) {
        $skipped[] = ['user_id' => $uid, 'username' => $username, 'reason' => 'No BTC wallet address set'];
        $warnings[] = "Skipped {$username}: no BTC wallet address.";
        continue;
    }

    if (!isset($pastorSummary[$uid])) {
        $pastorSummary[$uid] = [
            'username' => $username,
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

// Convert USD to BTC
foreach ($pastorSummary as $uid => $info) {
    $btcAmount = round($info['usd_amount'] / $BTC_USD_RATE, 8);
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
$now = date('Y-m-d\TH:i:s\Z');
foreach ($allCommissionIds as $cid) {
    $affected = $db->patch('referral_commissions', [
        'id' => 'eq.' . $cid,
        'status' => 'eq.pending',
    ], [
        'status' => 'paid',
        'paid_at' => $now,
    ]);
    $paidCount += $affected;
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
