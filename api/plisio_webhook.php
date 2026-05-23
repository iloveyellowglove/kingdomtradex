<?php
/**
 * Plisio Webhook Endpoint
 * Receives callbacks from Plisio for deposits (pay_in) and invoice updates.
 * URL: /api/plisio_webhook.php
 *
 * Plisio sends POST with multipart/form-data by default.
 * Append ?json=true to the callback URL in Plisio settings for JSON payload.
 */
header('Content-Type: application/json');

require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/PlisioClient.php';
require_once __DIR__ . '/../includes/PlisioDepositService.php';

// Load API key from settings
$db = getDB();
$rows = $db->query('settings', ['setting_key' => 'eq.plisio_api_key'], 'setting_value', '', 1);
$apiKey = $rows[0]['setting_value'] ?? '';

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Plisio API key not configured.']);
    exit;
}

// Parse incoming data
// Plisio sends either multipart/form-data or application/json (if ?json=true in URL)
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = (strpos($contentType, 'application/json') !== false) || isset($_GET['json']);

if ($isJson) {
    $rawBody = file_get_contents('php://input');
    $postData = json_decode($rawBody, true) ?: [];
} else {
    $postData = $_POST;
}

if (empty($postData)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Empty payload.']);
    exit;
}

// Initialize services
$client = new PlisioClient($apiKey);
$depositService = new PlisioDepositService($client, $db);

// Route by ipn_type
$ipnType = $postData['ipn_type'] ?? '';

if ($ipnType === 'pay_in') {
    $result = $depositService->handleCallback($postData);
} elseif ($ipnType === 'invoice') {
    $result = $depositService->handleInvoiceCallback($postData);
} else {
    // Log unknown type for debugging
    error_log('[Plisio Webhook] Unknown ipn_type: ' . $ipnType . ' txn_id=' . ($postData['txn_id'] ?? 'none'));
    $result = ['success' => true, 'message' => 'Unknown ipn_type: ' . $ipnType];
}

if ($result['success']) {
    http_response_code(200);
} else {
    http_response_code(400);
}

echo json_encode($result);
