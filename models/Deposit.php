<?php
/**
 * Deposit model - Supabase PostgreSQL backend
 * All deposits are simulated. Admin manually confirms them.
 */
class Deposit {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Create a pending deposit (SIMULATION)
     */
    public function create(int $userId, string $currency, float $amount, string $txid): array {
        if ($amount <= 0) {
            return ['success' => false, 'error' => 'Amount must be positive.'];
        }
        $validCurrencies = ['BTC', 'ETH', 'USDT'];
        if (!in_array(strtoupper($currency), $validCurrencies, true)) {
            return ['success' => false, 'error' => 'Invalid currency.'];
        }

        $data = [
            'user_id' => $userId,
            'txid' => $txid,
            'txn_id' => $txid,
            'currency' => strtoupper($currency),
            'amount' => number_format($amount, 8, '.', ''),
            'status' => 'pending',
            'created_at' => date('Y-m-d\TH:i:s\Z'),
        ];

        $rows = $this->db->post('deposits', $data);
        if (empty($rows)) {
            return ['success' => false, 'error' => 'Failed to create deposit.'];
        }

        return ['success' => true, 'deposit_id' => (int)$rows[0]['id']];
    }

    /**
     * Admin confirms/completes a deposit - triggers all balance updates and commissions
     */
    public function confirm(int $depositId, int $adminId): array {
        // Get deposit
        $depRows = $this->db->query('deposits', ['id' => 'eq.' . $depositId], '*', '', 1);
        $deposit = $depRows[0] ?? null;

        if (!$deposit) {
            return ['success' => false, 'error' => 'Deposit not found.'];
        }
        if ($deposit['status'] !== 'pending') {
            return ['success' => false, 'error' => 'Deposit is not pending.'];
        }

        // Mark completed
        $now = date('Y-m-d\TH:i:s\Z');
        $this->db->patch('deposits', ['id' => 'eq.' . $depositId], [
            'status' => 'completed',
            'confirmed_at' => $now,
            'completed_at' => $now,
        ]);

        $userId = (int)$deposit['user_id'];
        $amount = (float)$deposit['amount'];

        // Update user balances
        $userRows = $this->db->query('users', ['id' => 'eq.' . $userId], '*', '', 1);
        $user = $userRows[0] ?? null;

        if ($user) {
            $newDisplay = (float)$user['display_balance'] + $amount;
            $newDeposited = (float)($user['total_deposited_real'] ?? 0) + $amount;

            $updates = [
                'display_balance' => number_format($newDisplay, 8, '.', ''),
                'total_deposited_real' => number_format($newDeposited, 8, '.', ''),
            ];

            // Track first deposit
            if (empty($user['first_deposit_time'])) {
                $lockHours = (int)getSetting($this->db, 'withdrawal_lock_hours', '72');
                $lockExpiry = date('Y-m-d\TH:i:s\Z', strtotime("+{$lockHours} hours"));

                $updates['first_deposit_time'] = $now;

                // Set withdrawal lock
                $existingLock = $this->db->query('withdrawal_locks', ['user_id' => 'eq.' . $userId], 'id', '', 1);
                if (empty($existingLock)) {
                    $this->db->post('withdrawal_locks', [
                        'user_id' => $userId,
                        'first_deposit_time' => $now,
                        'lock_expiry_time' => $lockExpiry,
                        'is_locked' => 1,
                    ]);
                } else {
                    $this->db->patch('withdrawal_locks', ['user_id' => 'eq.' . $userId], [
                        'first_deposit_time' => $now,
                        'lock_expiry_time' => $lockExpiry,
                        'is_locked' => 1,
                    ]);
                }
            }

            $this->db->patch('users', ['id' => 'eq.' . $userId], $updates);
        }

        // Calculate referral commissions (5 levels up)
        $commissionRates = $this->getCommissionRates();
        $currentUserId = $userId;
        for ($level = 1; $level <= 5; $level++) {
            $refRows = $this->db->query('users', ['id' => 'eq.' . $currentUserId], 'referred_by', '', 1);
            $ref = $refRows[0] ?? null;
            if (!$ref || !$ref['referred_by']) break;

            $uplineId = (int)$ref['referred_by'];
            $rate = $commissionRates[$level] ?? 0;
            if ($rate > 0) {
                $commAmount = $amount * ($rate / 100);

                // Insert commission
                $this->db->post('referral_commissions', [
                    'user_id' => $uplineId,
                    'source_user_id' => $userId,
                    'level' => $level,
                    'percentage' => number_format($rate, 2, '.', ''),
                    'amount' => number_format($commAmount, 8, '.', ''),
                    'source_deposit_id' => $depositId,
                    'source_amount' => number_format($amount, 8, '.', ''),
                    'status' => 'pending',
                    'created_at' => $now,
                ]);

                // Add commission to display balance
                $uplineRows = $this->db->query('users', ['id' => 'eq.' . $uplineId], 'display_balance', '', 1);
                $upline = $uplineRows[0] ?? null;
                if ($upline) {
                    $newUplineDisplay = (float)$upline['display_balance'] + $commAmount;
                    $this->db->patch('users', ['id' => 'eq.' . $uplineId], [
                        'display_balance' => number_format($newUplineDisplay, 8, '.', ''),
                    ]);
                }
            }
            $currentUserId = $uplineId;
        }

        logAdminAction($this->db, $adminId, 'confirm_deposit', 'deposits', $depositId);
        return ['success' => true, 'deposit' => $deposit];
    }

    /**
     * Reject a deposit
     */
    public function reject(int $depositId, int $adminId): array {
        $this->db->patch('deposits', ['id' => 'eq.' . $depositId, 'status' => 'eq.pending'], [
            'status' => 'rejected',
        ]);
        logAdminAction($this->db, $adminId, 'reject_deposit', 'deposits', $depositId);
        return ['success' => true];
    }

    /**
     * Get user's deposits
     */
    public function getByUser(int $userId, int $limit = 20): array {
        return $this->db->query('deposits', ['user_id' => 'eq.' . $userId], '*', 'created_at.desc', $limit);
    }

    /**
     * Get all pending deposits (admin)
     */
    public function getPending(): array {
        return $this->db->join(
            'deposits',
            ['status' => 'eq.pending'],
            'users',
            'id',
            'user_id',
            '*',
            'created_at.asc'
        );
    }

    /**
     * Check if a deposit with a given txn_id exists
     */
    public function existsByTxnId(string $txnId): bool {
        $rows = $this->db->query('deposits', ['txn_id' => 'eq.' . $txnId], 'id', '', 1);
        return !empty($rows);
    }

    private function getCommissionRates(): array {
        return [
            1 => (float)getSetting($this->db, 'commission_l1', '15'),
            2 => (float)getSetting($this->db, 'commission_l2', '5'),
            3 => (float)getSetting($this->db, 'commission_l3', '3'),
            4 => (float)getSetting($this->db, 'commission_l4', '2'),
            5 => (float)getSetting($this->db, 'commission_l5', '1'),
        ];
    }
}
