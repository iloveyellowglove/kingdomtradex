<?php
/**
 * GET /api/user/dashboard - Returns user balance, pending withdrawal info, downline counts
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Commission.php';

$user = requireLogin();
$db = getDB();
$userModel = new User($db);
$commissionModel = new Commission($db);

$user = $userModel->getById((int)$user['id']);
$downlineCounts = $userModel->getDownlineCounts((int)$user['id']);

// Withdrawal lock
$lockStmt = $db->prepare('SELECT * FROM withdrawal_locks WHERE user_id = ? AND is_locked = 1');
$lockStmt->execute([$user['id']]);
$lock = $lockStmt->fetch();

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'referral_code' => $user['referral_code'],
        'display_balance' => $user['display_balance'],
        'total_deposited_real' => $user['total_deposited_real'],
        'total_withdrawn_real' => $user['total_withdrawn_real'],
        'pending_withdrawal_amount' => $user['pending_withdrawal_amount'],
        'first_deposit_time' => $user['first_deposit_time'],
        'created_at' => $user['created_at'],
    ],
    'downline_counts' => $downlineCounts,
    'withdrawal_lock' => $lock ? [
        'is_locked' => (bool)$lock['is_locked'],
        'lock_expiry_time' => $lock['lock_expiry_time'],
    ] : null,
    'pending_commissions' => $commissionModel->getTotalPending((int)$user['id']),
    'paid_commissions' => $commissionModel->getTotalPaid((int)$user['id']),
]);
