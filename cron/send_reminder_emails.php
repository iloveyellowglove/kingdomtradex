<?php
/**
 * Cron Job: Send Reminder Emails (optional)
 * Runs daily. Notifies users about pending withdrawals.
 *
 * Usage: php /path/to/cron/send_reminder_emails.php
 * Crontab: 0 10 * * * php /path/to/cron/send_reminder_emails.php
 *
 * DEMO MODE - emails are just logged, not actually sent unless configured.
 */

require_once __DIR__ . '/../includes/functions.php';

$db = getDB();

// Find users with pending withdrawals older than 24h
$stmt = $db->query(
    "SELECT DISTINCT u.email, u.username, COUNT(w.id) AS pending_count
     FROM withdrawals w
     JOIN users u ON w.user_id = u.id
     WHERE w.status = 'pending' AND w.request_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)
     GROUP BY u.id"
);
$users = $stmt->fetchAll();

if (empty($users)) {
    echo date('Y-m-d H:i:s') . " - No users with old pending withdrawals.\n";
    exit;
}

foreach ($users as $user) {
    // DEMO MODE: just log the notification
    echo date('Y-m-d H:i:s') . " - [DEMO] Would email {$user['email']}: You have {$user['pending_count']} pending withdrawal(s).\n";

    // To actually send emails, uncomment below and configure mail settings:
    // mail($user['email'], 'Withdrawal Reminder', "You have {$user['pending_count']} pending withdrawals.");
}

echo date('Y-m-d H:i:s') . " - Reminders logged for " . count($users) . " users.\n";
