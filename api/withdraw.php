<?php
/**
 * POST /api/withdraw/request - Request a withdrawal
 * GET  /api/withdraw/history - Get withdrawal history
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Withdrawal.php';

$user = requireLogin();
$db = getDB();
$withdrawalModel = new Withdrawal($db);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Request withdrawal
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $result = $withdrawalModel->request(
        (int)$user['id'],
        $input['currency'] ?? 'USDT',
        (float)($input['amount'] ?? 0),
        trim($input['address'] ?? '')
    );
    $code = $result['success'] ? 200 : 400;
    http_response_code($code);
    echo json_encode($result);
} else {
    // Get history
    $limit = min((int)($_GET['limit'] ?? 20), 100);
    $withdrawals = $withdrawalModel->getByUser((int)$user['id'], $limit);
    echo json_encode(['success' => true, 'withdrawals' => $withdrawals]);
}
