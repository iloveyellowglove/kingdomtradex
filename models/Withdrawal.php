<?php
/**
 * Withdrawal model - DEMO MODE
 * All withdrawals are simulated. No real crypto is sent.
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
        $userStmt = $this->db->prepare('SELECT * FROM users WHERE id = ? FOR UPDATE');
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch();
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        // Check net deposit balance
        $netBalance = (float)$user['total_deposited_real'] - (float)$user['total_withdrawn_real'];
        if ($amount > $netBalance) {
            return ['success' => false, 'error' => 'Insufficient net deposit balance.'];
        }

        // Check 72-hour withdrawal lock
        $lockHours = (int)getSetting($this->db, 'withdrawal_lock_hours', '72');
        if ($user['first_deposit_time']) {
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

        $this->db->beginTransaction();
        try {
            // Deduct from display_balance and track pending
            $stmt = $this->db->prepare(
                'UPDATE users SET display_balance = display_balance - ?, pending_withdrawal_amount = pending_withdrawal_amount + ? WHERE id = ?'
            );
            $stmt->execute([$amount, $amount, $userId]);

            // Create withdrawal record
            $stmt = $this->db->prepare(
                'INSERT INTO withdrawals (user_id, amount, currency, address, fee, request_time, eligible_time, status)
                 VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)'
            );
            $stmt->execute([$userId, $amount, $currency, $address, $fee, $eligibleTime->format('Y-m-d H:i:s'), 'pending']);

            $this->db->commit();
            return [
                'success' => true,
                'withdrawal_id' => (int)$this->db->lastInsertId(),
                'eligible_time' => $eligibleTime->format('Y-m-d H:i:s'),
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Process withdrawals eligible for processing (cron job)
     */
    public function processEligible(): int {
        $processed = 0;
        $stmt = $this->db->prepare(
            "SELECT w.*, u.first_deposit_time FROM withdrawals w JOIN users u ON w.user_id = u.id WHERE w.eligible_time <= NOW() AND w.status = 'pending' FOR UPDATE"
        );
        $stmt->execute();
        $withdrawals = $stmt->fetchAll();

        foreach ($withdrawals as $w) {
            $userId = (int)$w['user_id'];
            $amount = (float)$w['amount'];

            // Double-check net deposit balance
            $userStmt = $this->db->prepare('SELECT total_deposited_real, total_withdrawn_real FROM users WHERE id = ?');
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            $netBalance = (float)$user['total_deposited_real'] - (float)$user['total_withdrawn_real'];

            if ($amount > $netBalance) {
                $this->db->prepare("UPDATE withdrawals SET status = 'rejected', block_reason = 'Insufficient net deposit balance at processing time' WHERE id = ?")
                    ->execute([$w['id']]);
                $this->db->prepare('UPDATE users SET display_balance = display_balance + ?, pending_withdrawal_amount = pending_withdrawal_amount - ? WHERE id = ?')
                    ->execute([$amount, $amount, $userId]);
                continue;
            }

            // Mark processing (SIMULATION: not actually sending crypto)
            $this->db->prepare("UPDATE withdrawals SET status = 'processing', processed_time = NOW() WHERE id = ?")
                ->execute([$w['id']]);
            $this->db->prepare('UPDATE users SET total_withdrawn_real = total_withdrawn_real + ?, pending_withdrawal_amount = pending_withdrawal_amount - ? WHERE id = ?')
                ->execute([$amount, $amount, $userId]);

            $processed++;
        }
        return $processed;
    }

    /**
     * Complete processing withdrawals (second cron pass)
     */
    public function completeProcessing(): int {
        $stmt = $this->db->prepare(
            "UPDATE withdrawals SET status = 'completed', processed_time = NOW() WHERE status = 'processing' AND processed_time <= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
        );
        $stmt->execute();
        return $stmt->rowCount();
    }

    /**
     * Admin override: approve withdrawal immediately
     */
    public function adminApprove(int $withdrawalId, int $adminId): array {
        $stmt = $this->db->prepare("UPDATE withdrawals SET status = 'completed', admin_override = 1, processed_time = NOW() WHERE id = ?");
        $stmt->execute([$withdrawalId]);
        logAdminAction($this->db, $adminId, 'admin_approve_withdrawal', 'withdrawals', $withdrawalId);
        return ['success' => true];
    }

    /**
     * Admin cancel a withdrawal
     */
    public function adminCancel(int $withdrawalId, int $adminId): array {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('SELECT * FROM withdrawals WHERE id = ? FOR UPDATE');
            $stmt->execute([$withdrawalId]);
            $w = $stmt->fetch();
            if (!$w) {
                $this->db->rollBack();
                return ['success' => false, 'error' => 'Withdrawal not found.'];
            }
            if (!in_array($w['status'], ['pending', 'processing'])) {
                $this->db->rollBack();
                return ['success' => false, 'error' => 'Can only cancel pending/processing withdrawals.'];
            }
            // Refund balance
            $this->db->prepare('UPDATE users SET display_balance = display_balance + ?, pending_withdrawal_amount = pending_withdrawal_amount - ? WHERE id = ?')
                ->execute([(float)$w['amount'], (float)$w['amount'], (int)$w['user_id']]);
            $this->db->prepare("UPDATE withdrawals SET status = 'cancelled' WHERE id = ?")
                ->execute([$withdrawalId]);
            $this->db->commit();
            logAdminAction($this->db, $adminId, 'cancel_withdrawal', 'withdrawals', $withdrawalId);
            return ['success' => true];
        } catch (Throwable $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get user's withdrawal history
     */
    public function getByUser(int $userId, int $limit = 20): array {
        $stmt = $this->db->prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY request_time DESC LIMIT ?');
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }

    /**
     * Get all withdrawals (admin)
     */
    public function getAll(int $limit = 50, int $offset = 0, string $statusFilter = ''): array {
        if ($statusFilter && in_array($statusFilter, ['pending', 'processing', 'completed', 'rejected', 'cancelled'])) {
            $stmt = $this->db->prepare(
                'SELECT w.*, u.username, u.email FROM withdrawals w JOIN users u ON w.user_id = u.id WHERE w.status = ? ORDER BY w.request_time DESC LIMIT ? OFFSET ?'
            );
            $stmt->execute([$statusFilter, $limit, $offset]);
        } else {
            $stmt = $this->db->prepare(
                'SELECT w.*, u.username, u.email FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.request_time DESC LIMIT ? OFFSET ?'
            );
            $stmt->execute([$limit, $offset]);
        }
        return $stmt->fetchAll();
    }
}
