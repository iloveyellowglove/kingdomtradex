<?php
/**
 * POST /api/auth/login
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
$result = $userModel->login($input['email'] ?? '', $input['password'] ?? '');

if ($result['success']) {
    sessionCreate((int)$result['user']['id'], $result['user']['role']);
    unset($result['user']['password_hash']);
    echo json_encode(['success' => true, 'user' => $result['user']]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => $result['error']]);
}
