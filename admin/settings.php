<?php
require_once __DIR__ . '/../controllers/AdminController.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleAdminUpdateSettings();
}

handleAdminSettings();
