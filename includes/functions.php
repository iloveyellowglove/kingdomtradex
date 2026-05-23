<?php
require_once __DIR__ . '/SupabaseClient.php';

/**
 * Supabase client singleton (service_role key for backend operations).
 */
function getDB(): SupabaseClient {
    static $db = null;
    if ($db === null) {
        $config = require __DIR__ . '/../config/database.php';
        $db = new SupabaseClient(
            $config['supabase_url'],
            $config['supabase_service_role_key']
        );
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
 * Get currently logged-in user or null.
 * Queries by id only (not id+status) to avoid Supabase replication/rate-limit
 * false negatives that would kick users out of valid sessions.
 */
function currentUser(): ?array {
    ensureSession();
    if (empty($_SESSION['user_id'])) {
        error_log('[CURRENT_USER] No user_id in session');
        return null;
    }
    $userId = (int)$_SESSION['user_id'];
    error_log('[CURRENT_USER] Querying Supabase for id=' . $userId);
    $db = getDB();
    $rows = $db->query('users', ['id' => 'eq.' . $userId], '*', '', 1);
    if (empty($rows)) {
        error_log('[CURRENT_USER] Supabase returned empty for id=' . $userId . ' (network error, replication lag, or rate limit)');
        return null;
    }
    $user = $rows[0];
    error_log('[CURRENT_USER] User found: id=' . $user['id'] . ' status=' . ($user['status'] ?? '?'));
    if (($user['status'] ?? '') !== 'active') {
        error_log('[CURRENT_USER] User id=' . $user['id'] . ' status is ' . ($user['status'] ?? '?') . ', not active');
        return null;
    }
    return $user;
}

/**
 * Require a logged-in user, redirect if not
 */
function requireLogin(): array {
    $user = currentUser();
    if (!$user) {
        error_log('[REQUIRE_LOGIN] currentUser() returned null, session user_id=' . ($_SESSION['user_id'] ?? 'unset') . '. Redirecting to /login.php');
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
        $existing = $db->query('users', ['referral_code' => 'eq.' . $code], 'id', '', 1);
    } while (!empty($existing));
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
    $db->post('admin_logs', [
        'admin_id' => $adminId,
        'action' => $action,
        'target_table' => $table,
        'target_id' => $targetId,
        'old_value' => $oldValue,
        'new_value' => $newValue,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        'created_at' => date('Y-m-d\TH:i:s\Z'),
    ]);
}

/**
 * Get a system setting value
 */
function getSetting($db, string $key, string $default = ''): string {
    $rows = $db->query('settings', ['setting_key' => 'eq.' . $key], 'setting_value', '', 1);
    return $rows[0]['setting_value'] ?? $default;
}

/**
 * Build referral tree for a user (downline only, max 5 levels)
 */
function getDownlineTree($db, int $userId, int $maxDepth = 5): array {
    return _fetchDownline($db, $userId, 1, $maxDepth);
}

function _fetchDownline($db, int $parentId, int $currentLevel, int $maxDepth): array {
    if ($currentLevel > $maxDepth) return [];
    $rows = $db->query('users', [
        'referred_by' => 'eq.' . $parentId,
        'status' => 'eq.active',
    ], 'id,username,email,display_balance,created_at');
    $children = [];
    foreach ($rows as $row) {
        $row['level'] = $currentLevel;
        $row['children'] = _fetchDownline($db, (int)$row['id'], $currentLevel + 1, $maxDepth);
        $children[] = $row;
    }
    return $children;
}
