<?php
/**
 * Seed Script - Initializes the flat-file database with default data.
 * Run once: php seed.php
 */
require_once __DIR__ . '/includes/functions.php';

$db = getDB();
$dataDir = $db->readTable('_meta') ? null : null; // Just trigger dir creation

echo "Seeding database...\n";

// ---- Settings ----
$settings = [
    ['setting_key' => 'commission_l1', 'setting_value' => '15.00', 'description' => 'Level 1 referral commission percentage'],
    ['setting_key' => 'commission_l2', 'setting_value' => '5.00', 'description' => 'Level 2 referral commission percentage'],
    ['setting_key' => 'commission_l3', 'setting_value' => '3.00', 'description' => 'Level 3 referral commission percentage'],
    ['setting_key' => 'commission_l4', 'setting_value' => '2.00', 'description' => 'Level 4 referral commission percentage'],
    ['setting_key' => 'commission_l5', 'setting_value' => '1.00', 'description' => 'Level 5 referral commission percentage'],
    ['setting_key' => 'daily_profit_percentage', 'setting_value' => '1.50', 'description' => 'Daily AI trading profit percentage'],
    ['setting_key' => 'withdrawal_lock_hours', 'setting_value' => '72', 'description' => 'Hours before first withdrawal is allowed'],
    ['setting_key' => 'min_deposit_usdt', 'setting_value' => '10.00', 'description' => 'Minimum deposit in USDT'],
    ['setting_key' => 'min_deposit_btc', 'setting_value' => '0.001', 'description' => 'Minimum deposit in BTC'],
    ['setting_key' => 'min_deposit_eth', 'setting_value' => '0.01', 'description' => 'Minimum deposit in ETH'],
    ['setting_key' => 'min_withdrawal_usdt', 'setting_value' => '10.00', 'description' => 'Minimum withdrawal in USDT'],
    ['setting_key' => 'site_name', 'setting_value' => 'QuantumTrade Exchange', 'description' => 'Site display name'],
];

$existingSettings = $db->readTable('settings');
if (empty($existingSettings)) {
    $meta = $db->readTable('_meta');
    $nextId = ($meta['settings'] ?? 0) + 1;
    foreach ($settings as $idx => $s) {
        $s['id'] = $nextId + $idx;
    }
    $db->writeTable('settings', $settings);
    $meta['settings'] = $nextId + count($settings) - 1;
    $meta['last_insert_id'] = $nextId;
    $db->writeTable('_meta', $meta);
    echo "  Settings seeded: " . count($settings) . " records\n";
} else {
    echo "  Settings already exist, skipping.\n";
}

// ---- Admin User (password: admin123) ----
$existingUsers = $db->readTable('users');
if (empty($existingUsers)) {
    $meta = $db->readTable('_meta');
    $adminId = ($meta['users'] ?? 0) + 1;
    $adminUser = [
        'id' => $adminId,
        'username' => 'admin',
        'email' => 'admin@demo.local',
        'password_hash' => password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role' => 'admin',
        'referral_code' => 'ADMIN001',
        'referred_by' => null,
        'display_balance' => '0.00000000',
        'total_deposited_real' => '0.00000000',
        'total_withdrawn_real' => '0.00000000',
        'pending_withdrawal_amount' => '0.00000000',
        'first_deposit_time' => null,
        'created_at' => date('Y-m-d H:i:s'),
        'last_login' => null,
        'status' => 'active',
    ];
    $db->writeTable('users', [$adminUser]);
    $meta['users'] = $adminId;
    $meta['last_insert_id'] = $adminId;
    $db->writeTable('_meta', $meta);
    echo "  Admin user seeded: admin@demo.local / admin123\n";
} else {
    echo "  Users already exist, skipping.\n";
}

// ---- Empty tables ----
$tables = ['deposits', 'withdrawals', 'referral_commissions', 'ai_trading_profits', 'withdrawal_locks', 'admin_logs'];
foreach ($tables as $table) {
    $existing = $db->readTable($table);
    if (empty($existing)) {
        $db->writeTable($table, []);
        echo "  Table '$table' initialized.\n";
    }
}

echo "\nSeed complete! Start the server: php -S localhost:8000\n";
echo "Admin login: admin@demo.local / admin123\n";
