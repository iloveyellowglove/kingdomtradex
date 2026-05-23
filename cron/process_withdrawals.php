<?php
/**
 * Cron Job: Process Withdrawals
 * Runs every hour. Moves eligible pending withdrawals to processing,
 * and processes completed withdrawals after 24h.
 *
 * Usage: php /path/to/cron/process_withdrawals.php
 * Crontab: 0 * * * * php /path/to/cron/process_withdrawals.php
 *
 * Cron Job - processes withdrawals.
 * PostgreSQL backend (Supabase).
 */

require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../models/Withdrawal.php';

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
$withdrawalModel = new Withdrawal($db);

// Process eligible pending withdrawals -> processing
$processed = $withdrawalModel->processEligible();
echo date('Y-m-d H:i:s') . " - Processed $processed pending withdrawals to 'processing' status.\n";

// Complete processing -> completed (after 24h in processing)
$completed = $withdrawalModel->completeProcessing();
echo date('Y-m-d H:i:s') . " - Completed $completed processing withdrawals.\n";
