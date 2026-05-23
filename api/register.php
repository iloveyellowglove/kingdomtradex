<?php
/**
 * POST /api/auth/register - DEMO MODE
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/User.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$userModel = new User(getDB());
$result = $userModel->register(
    $input['username'] ?? '',
    $input['email'] ?? '',
    $input['password'] ?? '',
    $input['referral_code'] ?? null
);

if ($result['success']) {
    http_response_code(201);
    echo json_encode($result);
} else {
    http_response_code(400);
    echo json_encode($result);
}
