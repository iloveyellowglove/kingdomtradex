<?php
/**
 * Cron Job: Apply Daily AI Trading Profit
 * Runs daily at 00:01. Adds configured percentage profit to all active users.
 *
 * Usage: php /path/to/cron/apply_daily_profit.php
 * Crontab: 1 0 * * * php /path/to/cron/apply_daily_profit.php
 *
 * DEMO MODE - simulated profits only. No real trading.
 */

require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Settings.php';

$db = getDB();
$settings = new Settings($db);
$profitRate = (float)$settings->get('daily_profit_percentage', '1.5');
$today = date('Y-m-d');

echo date('Y-m-d H:i:s') . " - Applying daily profit rate: {$profitRate}% for date $today\n";

// Get all active users
$users = $db->query("SELECT id, display_balance FROM users WHERE status = 'active' AND display_balance > 0")->fetchAll();

$insertStmt = $db->prepare(
    'INSERT IGNORE INTO ai_trading_profits (user_id, amount, percentage, date, created_at)
     VALUES (?, ?, ?, ?, NOW())'
);
$updateStmt = $db->prepare('UPDATE users SET display_balance = display_balance + ? WHERE id = ?');

$applied = 0;
foreach ($users as $user) {
    $balance = (float)$user['display_balance'];
    $profit = $balance * ($profitRate / 100);
    if ($profit <= 0) continue;

    $insertStmt->execute([(int)$user['id'], $profit, $profitRate, $today]);
    if ($insertStmt->rowCount() > 0) {
        $updateStmt->execute([$profit, (int)$user['id']]);
        $applied++;
    }
}

echo date('Y-m-d H:i:s') . " - Applied profit to $applied users.\n";
