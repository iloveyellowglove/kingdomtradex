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

// ── Supabase-backed session system ──
// Replaces PHP native sessions which do not persist across Vercel serverless lambdas.
// Sessions are stored in the Supabase "sessions" table, keyed by a secure random token
// stored in an HttpOnly cookie named "kingdom_session".

/**
 * Create a new session in Supabase and set the cookie.
 * Returns the session token.
 */
function sessionCreate(int $userId, string $role): string {
    $token = bin2hex(random_bytes(32));
    $csrfToken = bin2hex(random_bytes(16));
    $db = getDB();

    $db->post('sessions', [
        'session_token' => $token,
        'user_id' => $userId,
        'user_role' => $role,
        'csrf_token' => $csrfToken,
        'created_at' => date('Y-m-d\TH:i:s\Z'),
        'expires_at' => date('Y-m-d\TH:i:s\Z', time() + 86400),
    ]);

    setcookie('kingdom_session', $token, [
        'expires' => time() + 86400,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    error_log('[SESSION] Created token for user_id=' . $userId . ' role=' . $role);
    return $token;
}

/**
 * Read the session cookie, validate against Supabase, return session data or null.
 * Cleans up expired sessions automatically.
 */
function sessionGet(): ?array {
    $token = $_COOKIE['kingdom_session'] ?? null;
    if (!$token || strlen($token) !== 64) {
        return null;
    }

    $db = getDB();
    $rows = $db->query('sessions', ['session_token' => 'eq.' . $token], '*', '', 1);
    $row = $rows[0] ?? null;

    if (!$row) {
        error_log('[SESSION] Token not found in sessions table');
        return null;
    }

    $expiresAt = strtotime($row['expires_at'] ?? '');
    if ($expiresAt && time() > $expiresAt) {
        error_log('[SESSION] Token expired, deleting: ' . substr($token, 0, 8) . '...');
        $db->delete('sessions', ['session_token' => 'eq.' . $token]);
        return null;
    }

    return [
        'user_id' => (int)$row['user_id'],
        'user_role' => $row['user_role'],
        'csrf_token' => $row['csrf_token'] ?? '',
    ];
}

/**
 * Destroy the current session: delete from Supabase and clear the cookie.
 */
function sessionDestroy(): void {
    $token = $_COOKIE['kingdom_session'] ?? null;
    if ($token) {
        $db = getDB();
        $db->delete('sessions', ['session_token' => 'eq.' . $token]);
        error_log('[SESSION] Destroyed token: ' . substr($token, 0, 8) . '...');
    }
    setcookie('kingdom_session', '', [
        'expires' => 1,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/**
 * Store a flash message in the sessions table.
 */
function flash(string $key, string $message): void {
    $session = sessionGet();
    if (!$session) return;

    $db = getDB();
    $token = $_COOKIE['kingdom_session'];
    $existing = $db->query('sessions', ['session_token' => 'eq.' . $token], 'flash_data', '', 1);
    $flashes = [];
    if (!empty($existing) && !empty($existing[0]['flash_data'])) {
        $flashes = json_decode($existing[0]['flash_data'], true) ?: [];
    }
    $flashes[$key] = $message;
    $db->patch('sessions', ['session_token' => 'eq.' . $token], [
        'flash_data' => json_encode($flashes),
    ]);
}

/**
 * Retrieve and clear flash messages from the sessions table.
 */
function getFlashes(): array {
    $session = sessionGet();
    if (!$session) return [];

    $db = getDB();
    $token = $_COOKIE['kingdom_session'];
    $rows = $db->query('sessions', ['session_token' => 'eq.' . $token], 'flash_data', '', 1);
    $flashes = [];
    if (!empty($rows) && !empty($rows[0]['flash_data'])) {
        $flashes = json_decode($rows[0]['flash_data'], true) ?: [];
    }
    // Clear flash data
    $db->patch('sessions', ['session_token' => 'eq.' . $token], [
        'flash_data' => null,
    ]);
    return $flashes;
}

/**
 * No-op: kept for backward compatibility with callers that expect session init.
 * The Supabase cookie session does not need explicit initialization.
 */
function ensureSession(): void {
    // Supabase-backed sessions require no PHP session init
}

/**
 * Generate a CSRF token from the current session, or a guest cookie for unauthenticated users.
 */
function csrfToken(): string {
    $session = sessionGet();
    if ($session) {
        return $session['csrf_token'];
    }

    // No session: use a guest CSRF cookie for unauthenticated forms (register, forgot password)
    $guestToken = $_COOKIE['csrf_guest'] ?? null;
    if ($guestToken && strlen($guestToken) === 32) {
        return $guestToken;
    }

    $guestToken = bin2hex(random_bytes(16));
    setcookie('csrf_guest', $guestToken, [
        'expires' => time() + 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => false,
        'samesite' => 'Lax',
    ]);
    return $guestToken;
}

/**
 * Validate a submitted CSRF token against the session or guest cookie.
 */
function validateCsrf(string $token): bool {
    if (empty($token)) {
        return false;
    }

    $session = sessionGet();
    if ($session) {
        return hash_equals($session['csrf_token'], $token);
    }

    // No session: validate against guest cookie
    $guestToken = $_COOKIE['csrf_guest'] ?? null;
    if ($guestToken && hash_equals($guestToken, $token)) {
        // Clear the guest cookie after successful use
        setcookie('csrf_guest', '', [
            'expires' => 1,
            'path' => '/',
            'secure' => true,
            'httponly' => false,
            'samesite' => 'Lax',
        ]);
        return true;
    }

    return false;
}

// ── User lookup ──

/**
 * Get currently logged-in user or null.
 * Uses Supabase sessions table to find user_id, then queries users table by id only
 * (not id+status) to avoid replication/rate-limit false negatives.
 */
function currentUser(): ?array {
    $session = sessionGet();
    if (!$session) {
        error_log('[CURRENT_USER] No valid session');
        return null;
    }
    $userId = $session['user_id'];
    error_log('[CURRENT_USER] Looking up user id=' . $userId);
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
        error_log('[REQUIRE_LOGIN] currentUser() returned null, redirecting to /login.php');
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

// ── Referral ──

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

// ── Utilities ──

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

// ── Email ──

/**
 * Send an email via Resend HTTP API.
 * Falls back to error_log if RESEND_API_KEY is not set.
 */
function sendEmail(string $to, string $subject, string $htmlBody): bool {
    $apiKey = getenv('RESEND_API_KEY');
    if (empty($apiKey)) {
        error_log('[EMAIL] RESEND_API_KEY not set. Would send to ' . $to . ': ' . $subject);
        return false;
    }

    $payload = json_encode([
        'from' => 'KingdomTrade Exchange <noreply@kingdomtradex.vercel.app>',
        'to' => [$to],
        'subject' => $subject,
        'html' => $htmlBody,
    ]);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ]),
            'content' => $payload,
            'timeout' => 15,
            'ignore_errors' => true,
        ],
        'ssl' => ['verify_peer' => true],
    ]);

    $response = @file_get_contents('https://api.resend.com/emails', false, $context);
    $httpCode = 0;
    if (isset($http_response_header)) {
        $firstLine = $http_response_header[0] ?? '';
        if (preg_match('/\s(\d{3})\s/', $firstLine, $m)) {
            $httpCode = (int)$m[1];
        }
    }

    $success = $httpCode >= 200 && $httpCode < 300;
    error_log('[EMAIL] Resend send to ' . $to . ': HTTP ' . $httpCode . ' ' . ($success ? 'OK' : 'FAILED'));
    return $success;
}
