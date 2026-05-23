<?php
/**
 * Withdrawal model - Supabase PostgreSQL backend
 * Enforces 72-hour hold from first deposit.
 */
class Withdrawal {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Request a withdrawal - SIMULATION only
     */
    public function request(int $userId, string $currency, float $amount, string $address): array {
        if ($amount <= 0) {
            return ['success' => false, 'error' => 'Amount must be positive.'];
        }

        $validCurrencies = ['BTC', 'ETH', 'USDT'];
        if (!in_array(strtoupper($currency), $validCurrencies, true)) {
            return ['success' => false, 'error' => 'Invalid currency.'];
        }

        // Get user
        $user = $this->db->getById('users', $userId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        // Check net deposit balance
        $netBalance = (float)($user['total_deposited_real'] ?? 0) - (float)($user['total_withdrawn_real'] ?? 0);
        if ($amount > $netBalance) {
            return ['success' => false, 'error' => 'Insufficient net deposit balance.'];
        }

        // Check 72-hour withdrawal lock
        $lockHours = (int)getSetting($this->db, 'withdrawal_lock_hours', '72');
        if (!empty($user['first_deposit_time'])) {
            $firstDeposit = new DateTime($user['first_deposit_time']);
            $now = new DateTime();
            $diff = $now->getTimestamp() - $firstDeposit->getTimestamp();
            if ($diff < $lockHours * 3600) {
                $eligibleAt = (clone $firstDeposit)->add(new DateInterval("PT{$lockHours}H"));
                return [
                    'success' => false,
                    'error' => "Security hold: withdrawals available after {$lockHours} hours from first deposit.",
                    'eligible_at' => $eligibleAt->format('Y-m-d H:i:s'),
                ];
            }
        }

        $eligibleTime = (new DateTime())->add(new DateInterval("PT72H"));
        $currency = strtoupper($currency);
        $fee = $amount * 0.005; // 0.5% withdrawal fee
        $now = date('Y-m-d\TH:i:s\Z');

        // Deduct from display_balance and track pending
        $newDisplay = (float)($user['display_balance'] ?? 0) - $amount;
        $newPending = (float)($user['pending_withdrawal_amount'] ?? 0) + $amount;

        $this->db->patch('users', ['id' => 'eq.' . $userId], [
            'display_balance' => number_format($newDisplay, 8, '.', ''),
            'pending_withdrawal_amount' => number_format($newPending, 8, '.', ''),
        ]);

        // Create withdrawal record
        $rows = $this->db->post('withdrawals', [
            'user_id' => $userId,
            'amount' => number_format($amount, 8, '.', ''),
            'currency' => $currency,
            'address' => $address,
            'fee' => number_format($fee, 8, '.', ''),
            'request_time' => $now,
            'eligible_time' => $eligibleTime->format('Y-m-d\TH:i:s\Z'),
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'withdrawal_id' => !empty($rows) ? (int)$rows[0]['id'] : 0,
            'eligible_time' => $eligibleTime->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Process withdrawals eligible for processing (cron job)
     */
    public function processEligible(): int {
        $processed = 0;
        $now = date('Y-m-d\TH:i:s\Z');

        // Find eligible withdrawals
        $withdrawals = $this->db->query('withdrawals', [
            'eligible_time' => 'lte.' . $now,
            'status' => 'eq.pending',
        ]);

        foreach ($withdrawals as $w) {
            $userId = (int)$w['user_id'];
            $amount = (float)$w['amount'];

            $user = $this->db->getById('users', $userId);
            if (!$user) continue;

            $netBalance = (float)($user['total_deposited_real'] ?? 0) - (float)($user['total_withdrawn_real'] ?? 0);

            if ($amount > $netBalance) {
                $this->db->patch('withdrawals', ['id' => 'eq.' . $w['id']], [
                    'status' => 'rejected',
                    'block_reason' => 'Insufficient net deposit balance at processing time',
                ]);
                $newDisplay = (float)($user['display_balance'] ?? 0) + $amount;
                $newPending = (float)($user['pending_withdrawal_amount'] ?? 0) - $amount;
                $this->db->patch('users', ['id' => 'eq.' . $userId], [
                    'display_balance' => number_format($newDisplay, 8, '.', ''),
                    'pending_withdrawal_amount' => number_format($newPending, 8, '.', ''),
                ]);
                continue;
            }

            // Mark processing
            $this->db->patch('withdrawals', ['id' => 'eq.' . $w['id']], [
                'status' => 'processing',
                'processed_time' => $now,
            ]);

            $newWithdrawn = (float)($user['total_withdrawn_real'] ?? 0) + $amount;
            $newPending = (float)($user['pending_withdrawal_amount'] ?? 0) - $amount;
            $this->db->patch('users', ['id' => 'eq.' . $userId], [
                'total_withdrawn_real' => number_format($newWithdrawn, 8, '.', ''),
                'pending_withdrawal_amount' => number_format(max(0, $newPending), 8, '.', ''),
            ]);

            $processed++;
        }

        return $processed;
    }

    /**
     * Complete processing withdrawals (second cron pass)
     */
    public function completeProcessing(): int {
        $cutoff = date('Y-m-d\TH:i:s\Z', strtotime('-24 hours'));
        $rows = $this->db->query('withdrawals', [
            'status' => 'eq.processing',
            'processed_time' => 'lte.' . $cutoff,
        ]);

        foreach ($rows as $w) {
            $this->db->patch('withdrawals', ['id' => 'eq.' . $w['id']], [
                'status' => 'completed',
                'processed_time' => date('Y-m-d\TH:i:s\Z'),
            ]);
        }

        return count($rows);
    }

    /**
     * Admin override: approve withdrawal immediately
     */
    public function adminApprove(int $withdrawalId, int $adminId): array {
        $this->db->patch('withdrawals', ['id' => 'eq.' . $withdrawalId], [
            'status' => 'completed',
            'admin_override' => 1,
            'processed_time' => date('Y-m-d\TH:i:s\Z'),
        ]);
        logAdminAction($this->db, $adminId, 'admin_approve_withdrawal', 'withdrawals', $withdrawalId);
        return ['success' => true];
    }

    /**
     * Admin cancel a withdrawal
     */
    public function adminCancel(int $withdrawalId, int $adminId): array {
        $w = $this->db->getById('withdrawals', $withdrawalId);
        if (!$w) {
            return ['success' => false, 'error' => 'Withdrawal not found.'];
        }
        if (!in_array($w['status'], ['pending', 'processing'])) {
            return ['success' => false, 'error' => 'Can only cancel pending/processing withdrawals.'];
        }

        // Refund balance
        $user = $this->db->getById('users', (int)$w['user_id']);
        if ($user) {
            $newDisplay = (float)($user['display_balance'] ?? 0) + (float)$w['amount'];
            $newPending = (float)($user['pending_withdrawal_amount'] ?? 0) - (float)$w['amount'];
            $this->db->patch('users', ['id' => 'eq.' . $w['user_id']], [
                'display_balance' => number_format($newDisplay, 8, '.', ''),
                'pending_withdrawal_amount' => number_format(max(0, $newPending), 8, '.', ''),
            ]);
        }

        $this->db->patch('withdrawals', ['id' => 'eq.' . $withdrawalId], ['status' => 'cancelled']);
        logAdminAction($this->db, $adminId, 'cancel_withdrawal', 'withdrawals', $withdrawalId);
        return ['success' => true];
    }

    /**
     * Get user's withdrawal history
     */
    public function getByUser(int $userId, int $limit = 20): array {
        return $this->db->query('withdrawals', ['user_id' => 'eq.' . $userId], '*', 'request_time.desc', $limit);
    }

    /**
     * Get all withdrawals (admin)
     */
    public function getAll(int $limit = 50, int $offset = 0, string $statusFilter = ''): array {
        $filters = [];
        if ($statusFilter && in_array($statusFilter, ['pending', 'processing', 'completed', 'rejected', 'cancelled'])) {
            $filters['status'] = 'eq.' . $statusFilter;
        }
        return $this->db->join(
            'withdrawals',
            $filters,
            'users',
            'id',
            'user_id',
            '*',
            'request_time.desc',
            $limit
        );
    }
}
