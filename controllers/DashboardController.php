<?php
/**
 * Dashboard Controller - DEMO MODE
 * Handles member/pastor dashboard display and withdrawal requests.
 */
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Deposit.php';
require_once __DIR__ . '/../models/Withdrawal.php';
require_once __DIR__ . '/../models/Commission.php';
require_once __DIR__ . '/../models/Settings.php';

function handleDashboard(): void {
    $user = requireLogin();
    $db = getDB();

    $userModel = new User($db);
    $depositModel = new Deposit($db);
    $withdrawalModel = new Withdrawal($db);
    $commissionModel = new Commission($db);

    // Get fresh user data
    $user = $userModel->getById((int)$user['id']);
    $downlineCounts = $userModel->getDownlineCounts((int)$user['id']);

    // Get recent activity
    $deposits = $depositModel->getByUser((int)$user['id'], 5);
    $withdrawals = $withdrawalModel->getByUser((int)$user['id'], 5);
    $commissions = $commissionModel->getByUser((int)$user['id'], 10);

    // Withdrawal lock check
    $lockRows = $db->query('withdrawal_locks', ['user_id' => 'eq.' . $user['id'], 'is_locked' => 'eq.1'], '*', '', 1);
    $withdrawalLock = $lockRows[0] ?? null;

    // Total pending commissions
    $totalPendingComm = $commissionModel->getTotalPending((int)$user['id']);
    $totalPaidComm = $commissionModel->getTotalPaid((int)$user['id']);

    $flashes = getFlashes();
    $csrfToken = csrfToken();
    $settings = new Settings($db);

    require __DIR__ . '/../templates/dashboard.php';
}

function handleWithdrawRequest(): void {
    $user = requireLogin();
    $db = getDB();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: /dashboard.php');
        exit;
    }

    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token.');
        header('Location: /dashboard.php');
        exit;
    }

    $withdrawalModel = new Withdrawal($db);
    $result = $withdrawalModel->request(
        (int)$user['id'],
        $_POST['currency'] ?? 'USDT',
        (float)($_POST['amount'] ?? 0),
        trim($_POST['address'] ?? '')
    );

    if ($result['success']) {
        flash('success', 'Withdrawal request submitted. Eligible after: ' . $result['eligible_time']);
    } else {
        flash('error', $result['error']);
    }

    header('Location: /dashboard.php');
    exit;
}

function handleWithdrawHistory(): void {
    $user = requireLogin();
    $db = getDB();
    $withdrawalModel = new Withdrawal($db);
    $withdrawals = $withdrawalModel->getByUser((int)$user['id'], 50);
    $flashes = getFlashes();
    require __DIR__ . '/../templates/withdraw_history.php';
}

function handleReferralTree(): void {
    $user = requireLogin();
    $db = getDB();
    $tree = getDownlineTree($db, (int)$user['id'], 5);
    $flashes = getFlashes();
    require __DIR__ . '/../templates/referral_tree.php';
}

function handleTrading(): void {
    $user = requireLogin();
    $flashes = getFlashes();
    $csrfToken = csrfToken();
    require __DIR__ . '/../templates/trading.php';
}
