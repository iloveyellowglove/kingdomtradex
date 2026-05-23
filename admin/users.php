<?php
require_once __DIR__ . '/../controllers/AdminController.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    match ($_POST['action']) {
        'adjust_balance' => handleAdminBalanceAdjust(),
        'unlock_withdrawal' => handleAdminUnlockWithdrawal(),
        'update_user' => handleAdminUpdateUser(),
        default => null,
    };
}

handleAdminUsers();
