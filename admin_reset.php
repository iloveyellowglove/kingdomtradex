<?php
/**
 * One-time admin password reset endpoint.
 * Protected by a secret URL token. After one successful use, it disables itself.
 *
 * Usage: /admin_reset.php?token=THE_SECRET_TOKEN
 *
 * This file self-deletes (renames to .used) after successful execution.
 */

// Secret token: must be provided as ?token= in the URL
$SECRET_TOKEN = 'KINGDOM_2026_ADMIN_RESET_7Xq9PvLm';

$providedToken = $_GET['token'] ?? '';

if ($providedToken !== $SECRET_TOKEN) {
    http_response_code(403);
    die('Access denied.');
}

// Generate fresh hash for admin123
$newHash = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);

error_log('[ADMIN_RESET] Attempting password hash update for admin user');
error_log('[ADMIN_RESET] New hash generated: ' . $newHash);

// Connect to Supabase directly using env vars
$supabaseUrl = getenv('SUPABASE_URL');
$serviceKey = getenv('SUPABASE_SERVICE_ROLE_KEY');

if (empty($supabaseUrl) || empty($serviceKey)) {
    http_response_code(500);
    error_log('[ADMIN_RESET] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var not set');
    die('Server configuration error: missing Supabase credentials.');
}

// Update admin user's password_hash via Supabase REST API
$url = rtrim($supabaseUrl, '/') . '/rest/v1/users?email=eq.admin@demo.local';

$context = stream_context_create([
    'http' => [
        'method' => 'PATCH',
        'header' => implode("\r\n", [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey,
            'Content-Type: application/json',
            'Prefer: return=representation',
        ]),
        'content' => json_encode(['password_hash' => $newHash]),
        'timeout' => 30,
        'ignore_errors' => true,
    ],
    'ssl' => ['verify_peer' => true],
]);

$response = @file_get_contents($url, false, $context);

$httpCode = 0;
if (isset($http_response_header)) {
    $firstLine = $http_response_header[0] ?? '';
    if (preg_match('/\s(\d{3})\s/', $firstLine, $m)) {
        $httpCode = (int)$m[1];
    }
}

$success = $httpCode >= 200 && $httpCode < 300;

error_log('[ADMIN_RESET] Supabase PATCH result: HTTP ' . $httpCode . ', success=' . ($success ? 'true' : 'false'));
error_log('[ADMIN_RESET] Response body: ' . ($response ?: '(empty)'));

if ($success) {
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Admin Reset</title></head><body style="background:#0e0b1a;color:#f0edf5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;padding:40px;"><h1 style="color:#FFD700;">Admin Password Reset Complete</h1><p>The admin password has been reset to: <strong>admin123</strong></p><p>Email: <strong>admin@demo.local</strong></p><p style="color:#a89bb5;">This endpoint has been disabled. The password is now active.</p></div></body></html>';

    // Self-disable: rename this file so it can't be used again
    $self = __FILE__;
    $disabled = $self . '.used';
    if (file_exists($self)) {
        // Write a marker file and delete self
        file_put_contents($disabled, 'Used at: ' . date('Y-m-d H:i:s') . "\n");
        @unlink($self);
        error_log('[ADMIN_RESET] Self-disabled: renamed to .used');
    }
} else {
    http_response_code(500);
    error_log('[ADMIN_RESET] FAILED to update admin password. HTTP code: ' . $httpCode);
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Admin Reset Failed</title></head><body style="background:#0e0b1a;color:#f0edf5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;padding:40px;"><h1 style="color:#ff5252;">Admin Password Reset Failed</h1><p>HTTP status: ' . $httpCode . '</p><p>Check Vercel function logs for details.</p></div></body></html>';
}
