<?php
require_once __DIR__ . '/Database.php';

/**
 * Database connection singleton - Flat-file JSON storage (zero dependencies)
 */
function getDB(): FlatDB {
    static $db = null;
    if ($db === null) {
        $config = require __DIR__ . '/../config/database.php';
        $db = new FlatDB($config['data_dir']);
    }
    return $db;
}

/**
 * Start session if not already started
 */
function ensureSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Get currently logged-in user or null
 */
function currentUser(): ?array {
    ensureSession();
    if (empty($_SESSION['user_id'])) return null;
    $stmt = getDB()->prepare('SELECT * FROM users WHERE id = ? AND status = ? LIMIT 1');
    $stmt->execute([(int)$_SESSION['user_id'], 'active']);
    return $stmt->fetch() ?: null;
}

/**
 * Require a logged-in user, redirect if not
 */
function requireLogin(): array {
    $user = currentUser();
    if (!$user) {
        header('Location: /login.php');
        exit;
    }
    return $user;
}

/**
 * Require a role (admin or pastor), redirect if not
 */
function requireRole(string ...$roles): array {
    $user = requireLogin();
    if (!in_array($user['role'], $roles, true)) {
        header('HTTP/1.1 403 Forbidden');
        die('Access denied.');
    }
    return $user;
}

/**
 * Generate a CSRF token and store in session
 */
function csrfToken(): string {
    ensureSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate a submitted CSRF token
 */
function validateCsrf(string $token): bool {
    ensureSession();
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Redirect back with an error flash message
 */
function flash(string $key, string $message): void {
    ensureSession();
    $_SESSION['flash'][$key] = $message;
}

/**
 * Retrieve and clear flash messages
 */
function getFlashes(): array {
    ensureSession();
    $flashes = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $flashes;
}

/**
 * Generate a unique 8-character referral code
 */
function generateReferralCode($db): string {
    do {
        $code = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        $stmt = $db->prepare('SELECT COUNT(*) FROM users WHERE referral_code = ?');
        $stmt->execute([$code]);
    } while ($stmt->fetchColumn() > 0);
    return $code;
}

/**
 * Sanitize output for HTML display
 */
function h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Log admin action
 */
function logAdminAction($db, int $adminId, string $action, ?string $table = null, ?int $targetId = null, ?string $oldValue = null, ?string $newValue = null): void {
    $stmt = $db->prepare('INSERT INTO admin_logs (admin_id, action, target_table, target_id, old_value, new_value, ip) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$adminId, $action, $table, $targetId, $oldValue, $newValue, $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);
}

/**
 * Get a system setting value
 */
function getSetting($db, string $key, string $default = ''): string {
    $stmt = $db->prepare('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : $default;
}

/**
 * Build referral tree for a user (downline only, max 5 levels)
 */
function getDownlineTree($db, int $userId, int $maxDepth = 5): array {
    return _fetchDownline($db, $userId, 1, $maxDepth);
}

function _fetchDownline($db, int $parentId, int $currentLevel, int $maxDepth): array {
    if ($currentLevel > $maxDepth) return [];
    $stmt = $db->prepare('SELECT id, username, email, display_balance, created_at FROM users WHERE referred_by = ? AND status = ?');
    $stmt->execute([$parentId, 'active']);
    $children = [];
    while ($row = $stmt->fetch()) {
        $row['level'] = $currentLevel;
        $row['children'] = _fetchDownline($db, (int)$row['id'], $currentLevel + 1, $maxDepth);
        $children[] = $row;
    }
    return $children;
}
