<?php
/**
 * Admin Controller - DEMO MODE
 * Handles all admin dashboard functions: user management, deposit confirmation,
 * withdrawal management, settings, and commission payouts.
 */
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Deposit.php';
require_once __DIR__ . '/../models/Withdrawal.php';
require_once __DIR__ . '/../models/Commission.php';
require_once __DIR__ . '/../models/Settings.php';

function handleAdminDashboard(): void {
    $admin = requireRole('admin');
    $db = getDB();

    // Stats
    $totalUsers = $db->count('users', ['role' => 'neq.admin']);
    $totalDeposits = $db->sum('deposits', 'amount', ['status' => 'eq.completed']);
    $pendingWithdrawals = $db->count('withdrawals', ['status' => 'eq.pending']);

    $flashes = getFlashes();
    $csrfToken = csrfToken();

    require __DIR__ . '/../admin/views/dashboard.php';
}

function handleAdminUsers(): void {
    $admin = requireRole('admin');
    $db = getDB();
    $userModel = new User($db);

    $search = $_GET['q'] ?? '';
    $users = $userModel->search($search, 100);

    $flashes = getFlashes();
    $csrfToken = csrfToken();

    require __DIR__ . '/../admin/views/users.php';
}

function handleAdminBalanceAdjust(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: /admin/users.php');
        exit;
    }
    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token.');
        header('Location: /admin/users.php');
        exit;
    }

    $db = getDB();
    $userModel = new User($db);
    $userModel->adjustBalance((int)$_POST['user_id'], (float)$_POST['new_balance'], (int)$admin['id']);
    flash('success', 'Balance adjusted.');
    header('Location: /admin/users.php');
    exit;
}

function handleAdminDeposits(): void {
    $admin = requireRole('admin');
    $db = getDB();
    $depositModel = new Deposit($db);
    $deposits = $depositModel->getPending();
    $flashes = getFlashes();
    $csrfToken = csrfToken();

    require __DIR__ . '/../admin/views/deposits.php';
}

function handleAdminConfirmDeposit(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: /admin/deposits.php');
        exit;
    }
    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token.');
        header('Location: /admin/deposits.php');
        exit;
    }

    $db = getDB();
    $depositModel = new Deposit($db);
    $result = $depositModel->confirm((int)$_POST['deposit_id'], (int)$admin['id']);

    if ($result['success']) {
        flash('success', 'Deposit confirmed. Blessings awarded to the spiritual lineage.');
    } else {
        flash('error', $result['error']);
    }
    header('Location: /admin/deposits.php');
    exit;
}

function handleAdminRejectDeposit(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: /admin/deposits.php');
        exit;
    }
    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token.');
        header('Location: /admin/deposits.php');
        exit;
    }

    $db = getDB();
    $depositModel = new Deposit($db);
    $depositModel->reject((int)$_POST['deposit_id'], (int)$admin['id']);
    flash('success', 'Deposit rejected.');
    header('Location: /admin/deposits.php');
    exit;
}

function handleAdminWithdrawals(): void {
    $admin = requireRole('admin');
    $db = getDB();
    $withdrawalModel = new Withdrawal($db);

    $statusFilter = $_GET['status'] ?? '';
    $withdrawals = $withdrawalModel->getAll(100, 0, $statusFilter);

    $flashes = getFlashes();
    $csrfToken = csrfToken();

    require __DIR__ . '/../admin/views/withdrawals.php';
}

function handleAdminApproveWithdrawal(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: /admin/withdrawals.php');
        exit;
    }
    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token.');
        header('Location: /admin/withdrawals.php');
        exit;
    }

    $db = getDB();
    $withdrawalModel = new Withdrawal($db);
    $result = $withdrawalModel->adminApprove((int)$_POST['withdrawal_id'], (int)$admin['id']);
    flash('success', 'Withdrawal approved.');
    header('Location: /admin/withdrawals.php');
    exit;
}

function handleAdminCancelWithdrawal(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: /admin/withdrawals.php');
        exit;
    }
    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token.');
        header('Location: /admin/withdrawals.php');
        exit;
    }

    $db = getDB();
    $withdrawalModel = new Withdrawal($db);
    $result = $withdrawalModel->adminCancel((int)$_POST['withdrawal_id'], (int)$admin['id']);
    if ($result['success']) {
        flash('success', 'Withdrawal cancelled and amount refunded.');
    } else {
        flash('error', $result['error']);
    }
    header('Location: /admin/withdrawals.php');
    exit;
}

function handleAdminCommissions(): void {
    $admin = requireRole('admin');
    $db = getDB();
    $commissionModel = new Commission($db);
    $commissions = $commissionModel->getAll(100);
    $flashes = getFlashes();
    $csrfToken = csrfToken();

    require __DIR__ . '/../admin/views/commissions.php';
}

function handleAdminMarkCommissionPaid(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid request.');
        header('Location: /admin/commissions.php');
        exit;
    }

    $db = getDB();
    $commissionModel = new Commission($db);
    $result = $commissionModel->markPaid((int)$_POST['commission_id'], (int)$admin['id']);
    if ($result['success']) {
        flash('success', 'Blessing marked as paid.');
    } else {
        flash('error', $result['error']);
    }
    header('Location: /admin/commissions.php');
    exit;
}

function handleAdminSettings(): void {
    $admin = requireRole('admin');
    $db = getDB();
    $settingsModel = new Settings($db);
    $settings = $settingsModel->getAll();
    $flashes = getFlashes();
    $csrfToken = csrfToken();

    require __DIR__ . '/../admin/views/settings.php';
}

function handleAdminUpdateSettings(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid request.');
        header('Location: /admin/settings.php');
        exit;
    }

    $db = getDB();
    $settingsModel = new Settings($db);

    $keys = [
        'commission_l1', 'commission_l2', 'commission_l3', 'commission_l4', 'commission_l5',
        'daily_profit_percentage', 'withdrawal_lock_hours', 'min_deposit_usdt',
        'min_deposit_btc', 'min_deposit_eth', 'min_withdrawal_usdt',
        'plisio_api_key',
    ];

    foreach ($keys as $key) {
        if (isset($_POST[$key])) {
            $settingsModel->set($key, $_POST[$key], null, (int)$admin['id']);
        }
    }

    flash('success', 'Settings updated.');
    header('Location: /admin/settings.php');
    exit;
}

function handleAdminUpdateUser(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid request.');
        header('Location: /admin/users.php');
        exit;
    }

    $db = getDB();
    $userId = (int)$_POST['user_id'];

    $updates = [];
    if (isset($_POST['role']) && in_array($_POST['role'], ['member', 'pastor', 'admin'])) {
        $updates['role'] = $_POST['role'];
    }
    foreach (['plisio_btc_address', 'plisio_eth_address', 'plisio_usdt_address'] as $field) {
        if (isset($_POST[$field])) {
            $updates[$field] = trim($_POST[$field]);
        }
    }

    if (!empty($updates)) {
        $db->patch('users', ['id' => 'eq.' . $userId], $updates);
        logAdminAction($db, (int)$admin['id'], 'update_user', 'users', $userId, null, json_encode($updates));
        flash('success', 'User updated.');
    }

    header('Location: /admin/users.php');
    exit;
}

function handleAdminUnlockWithdrawal(): void {
    $admin = requireRole('admin');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid request.');
        header('Location: /admin/users.php');
        exit;
    }

    $db = getDB();
    $db->patch('withdrawal_locks', ['user_id' => 'eq.' . (int)$_POST['user_id'], 'is_locked' => 'eq.1'], [
        'is_locked' => 0,
        'admin_unlocked_by' => (int)$admin['id'],
        'unlocked_at' => date('Y-m-d\TH:i:s\Z'),
    ]);
    logAdminAction($db, (int)$admin['id'], 'unlock_withdrawal', 'withdrawal_locks', (int)$_POST['user_id']);
    flash('success', 'Withdrawal lock removed for user.');
    header('Location: /admin/users.php');
    exit;
}
