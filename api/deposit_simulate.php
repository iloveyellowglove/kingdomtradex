<?php
/**
 * POST /api/deposit/simulate - Admin only
 * Manually marks a deposit as completed and triggers commissions.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Deposit.php';

$admin = requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// CSRF check
if (!validateCsrf($input['csrf_token'] ?? '')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid security token.']);
    exit;
}

$db = getDB();
$depositModel = new Deposit($db);

// Create deposit first, then confirm
$result = $depositModel->create(
    (int)$input['user_id'],
    $input['currency'] ?? 'USDT',
    (float)($input['amount'] ?? 0),
    $input['txid'] ?? ('TX-' . bin2hex(random_bytes(8)))
);

if (!$result['success']) {
    http_response_code(400);
    echo json_encode($result);
    exit;
}

// Immediately confirm it
$confirmResult = $depositModel->confirm($result['deposit_id'], (int)$admin['id']);
if ($confirmResult['success']) {
    echo json_encode(['success' => true, 'deposit_id' => $result['deposit_id'], 'message' => 'Deposit confirmed. Commissions awarded.']);
} else {
    http_response_code(500);
    echo json_encode($confirmResult);
}
