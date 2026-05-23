<?php
require_once __DIR__ . '/../controllers/AdminController.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    match ($_POST['action']) {
        'mark_paid' => handleAdminMarkCommissionPaid(),
        default => null,
    };
}

handleAdminCommissions();
