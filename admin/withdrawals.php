<?php
require_once __DIR__ . '/../controllers/AdminController.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    match ($_POST['action']) {
        'approve' => handleAdminApproveWithdrawal(),
        'cancel' => handleAdminCancelWithdrawal(),
        default => null,
    };
}

handleAdminWithdrawals();
