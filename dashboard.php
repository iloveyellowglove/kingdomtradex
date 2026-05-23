<?php
require_once __DIR__ . '/controllers/DashboardController.php';

$action = $_GET['action'] ?? '';
if ($action === 'withdraw' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    handleWithdrawRequest();
} else {
    handleDashboard();
}
