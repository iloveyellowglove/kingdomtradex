<?php
/**
 * Cron Job: Apply Daily AI Trading Profit
 * Runs daily at 00:01. Adds configured percentage profit to all active users.
 *
 * Usage: php /path/to/cron/apply_daily_profit.php
 * Crontab: 1 0 * * * php /path/to/cron/apply_daily_profit.php
 *
 * DEMO MODE - simulated profits only. No real trading.
 * PostgreSQL backend (Supabase).
 */

require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Settings.php';

$db = getDB();
$settings = new Settings($db);
$profitRate = (float)$settings->get('daily_profit_percentage', '1.5');
$today = date('Y-m-d');

echo date('Y-m-d H:i:s') . " - Applying daily profit rate: {$profitRate}% for date $today\n";

// Get all active users with positive balance
$users = $db->query('users', [
    'status' => 'eq.active',
], 'id,display_balance');

$applied = 0;
foreach ($users as $user) {
    $balance = (float)($user['display_balance'] ?? 0);
    if ($balance <= 0) continue;

    $profit = $balance * ($profitRate / 100);
    if ($profit <= 0) continue;

    // Check for existing profit record today (UNIQUE constraint)
    $existing = $db->query('ai_trading_profits', [
        'user_id' => 'eq.' . (int)$user['id'],
        'date' => 'eq.' . $today,
    ], 'id', '', 1);

    if (!empty($existing)) {
        continue; // Already applied today
    }

    // Insert profit record
    $result = $db->post('ai_trading_profits', [
        'user_id' => (int)$user['id'],
        'amount' => number_format($profit, 8, '.', ''),
        'percentage' => number_format($profitRate, 2, '.', ''),
        'date' => $today,
        'created_at' => date('Y-m-d\TH:i:s\Z'),
    ]);

    if ($result !== null) {
        // Update user balance
        $newBalance = $balance + $profit;
        $db->patch('users', ['id' => 'eq.' . (int)$user['id']], [
            'display_balance' => number_format($newBalance, 8, '.', ''),
        ]);
        $applied++;
    }
}

echo date('Y-m-d H:i:s') . " - Applied profit to $applied users.\n";
