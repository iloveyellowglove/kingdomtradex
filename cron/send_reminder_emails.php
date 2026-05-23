<?php
/**
 * Cron Job: Send Reminder Emails (optional)
 * Runs daily. Notifies users about pending withdrawals.
 *
 * Usage: php /path/to/cron/send_reminder_emails.php
 * Crontab: 0 10 * * * php /path/to/cron/send_reminder_emails.php
 *
 * Cron Job - sends reminder emails for pending withdrawals.
 */

require_once __DIR__ . '/../includes/functions.php';

// Require CRON_SECRET token for HTTP access
$cronSecret = getenv('CRON_SECRET');
if (empty($cronSecret)) {
    http_response_code(500);
    die('CRON_SECRET environment variable is not set.');
}
$providedToken = $_GET['token'] ?? '';
if (!hash_equals($cronSecret, $providedToken)) {
    http_response_code(403);
    die('Access denied.');
}

$db = getDB();

// Find pending withdrawals older than 24h
$cutoff = date('Y-m-d\TH:i:s\Z', strtotime('-24 hours'));
$pendingWithdrawals = $db->query('withdrawals', [
    'status' => 'eq.pending',
    'request_time' => 'lt.' . $cutoff,
], 'user_id', 'request_time.asc');

if (empty($pendingWithdrawals)) {
    echo date('Y-m-d H:i:s') . " - No users with old pending withdrawals.\n";
    exit;
}

// Count pending per user
$userCounts = [];
foreach ($pendingWithdrawals as $w) {
    $uid = (int)$w['user_id'];
    $userCounts[$uid] = ($userCounts[$uid] ?? 0) + 1;
}

// Fetch user details
$userIds = array_keys($userCounts);
$users = $db->query('users', ['id' => 'in.(' . implode(',', $userIds) . ')'], 'id,email,username');

$emailMap = [];
foreach ($users as $u) {
    $emailMap[(int)$u['id']] = ['email' => $u['email'], 'username' => $u['username']];
}

foreach ($userCounts as $uid => $count) {
    $info = $emailMap[$uid] ?? null;
    if (!$info) continue;
    echo date('Y-m-d H:i:s') . " - [DEMO] Would email {$info['email']}: You have {$count} pending withdrawal(s).\n";
}

echo date('Y-m-d H:i:s') . " - Reminders logged for " . count($userCounts) . " users.\n";
