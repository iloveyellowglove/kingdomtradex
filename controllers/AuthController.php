<?php
/**
 * Authentication Controller
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
    error_log('[AUTH] handleLogin POST: email=' . $email . ', password_len=' . strlen($password));

    $userModel = new User(getDB());
    $result = $userModel->login($email, $password);
    error_log('[AUTH] login() returned: success=' . ($result['success'] ? 'true' : 'false') . ', error=' . ($result['error'] ?? 'none'));

    if (!$result['success']) {
        error_log('[AUTH] Redirecting to /login.php with flash error');
        flash('error', $result['error']);
        header('Location: /login.php');
        exit;
    }

    $_SESSION['user_id'] = (int)$result['user']['id'];
    $_SESSION['user_role'] = $result['user']['role'];
    error_log('[AUTH] Session set: user_id=' . $_SESSION['user_id'] . ', role=' . $_SESSION['user_role']);

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
