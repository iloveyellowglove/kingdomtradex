<?php
/**
 * Authentication Controller - DEMO MODE
 * Handles login, registration, logout.
 */
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/User.php';

function handleLogin(): void {
    ensureSession();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $flashes = getFlashes();
        require __DIR__ . '/../templates/login.php';
        return;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return;
    }

    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $userModel = new User(getDB());
    $result = $userModel->login($email, $password);

    if (!$result['success']) {
        flash('error', $result['error']);
        header('Location: /login.php');
        exit;
    }

    $_SESSION['user_id'] = (int)$result['user']['id'];
    $_SESSION['user_role'] = $result['user']['role'];

    if ($result['user']['role'] === 'admin') {
        header('Location: /admin/dashboard.php');
    } else {
        header('Location: /dashboard.php');
    }
    exit;
}

function handleRegister(): void {
    ensureSession();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $flashes = getFlashes();
        $ref = $_GET['ref'] ?? '';
        require __DIR__ . '/../templates/register.php';
        return;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return;
    }

    // Validate CSRF
    if (!validateCsrf($_POST['csrf_token'] ?? '')) {
        flash('error', 'Invalid security token. Please try again.');
        header('Location: /register.php');
        exit;
    }

    $userModel = new User(getDB());
    $result = $userModel->register(
        $_POST['username'] ?? '',
        $_POST['email'] ?? '',
        $_POST['password'] ?? '',
        $_POST['referral_code'] ?? null
    );

    if (!$result['success']) {
        flash('error', $result['error']);
        header('Location: /register.php');
        exit;
    }

    flash('success', 'Registration successful! Please login.');
    header('Location: /login.php');
    exit;
}

function handleLogout(): void {
    ensureSession();
    session_destroy();
    header('Location: /login.php');
    exit;
}
