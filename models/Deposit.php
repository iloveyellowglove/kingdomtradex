<?php
/**
 * Deposit model - DEMO MODE
 * All deposits are simulated. Admin manually confirms them.
 * No real cryptocurrency is involved.
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
        $stmt = $this->db->prepare(
            'INSERT INTO deposits (user_id, txid, currency, amount, status) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$userId, $txid, strtoupper($currency), $amount, 'pending']);
        return ['success' => true, 'deposit_id' => (int)$this->db->lastInsertId()];
    }

    /**
     * Admin confirms/completes a deposit - triggers all balance updates and commissions
     */
    public function confirm(int $depositId, int $adminId): array {
        $this->db->beginTransaction();
        try {
            // Get deposit
            $stmt = $this->db->prepare('SELECT * FROM deposits WHERE id = ? FOR UPDATE');
            $stmt->execute([$depositId]);
            $deposit = $stmt->fetch();
            if (!$deposit) {
                $this->db->rollBack();
                return ['success' => false, 'error' => 'Deposit not found.'];
            }
            if ($deposit['status'] !== 'pending') {
                $this->db->rollBack();
                return ['success' => false, 'error' => 'Deposit is not pending.'];
            }

            // Mark completed
            $stmt = $this->db->prepare('UPDATE deposits SET status = ?, confirmed_at = NOW(), completed_at = NOW() WHERE id = ?');
            $stmt->execute(['completed', $depositId]);

            $userId = (int)$deposit['user_id'];
            $amount = (float)$deposit['amount'];

            // Update user balances
            $stmt = $this->db->prepare(
                'UPDATE users SET display_balance = display_balance + ?, total_deposited_real = total_deposited_real + ? WHERE id = ?'
            );
            $stmt->execute([$amount, $amount, $userId]);

            // Track first deposit
            $userStmt = $this->db->prepare('SELECT first_deposit_time FROM users WHERE id = ?');
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            if ($user && !$user['first_deposit_time']) {
                $this->db->prepare('UPDATE users SET first_deposit_time = NOW() WHERE id = ?')->execute([$userId]);
                // Set withdrawal lock
                $lockHours = (int)getSetting($this->db, 'withdrawal_lock_hours', '72');
                $stmt = $this->db->prepare(
                    'INSERT INTO withdrawal_locks (user_id, first_deposit_time, lock_expiry_time, is_locked)
                     VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), 1)
                     ON DUPLICATE KEY UPDATE first_deposit_time = NOW(), lock_expiry_time = DATE_ADD(NOW(), INTERVAL ? HOUR), is_locked = 1'
                );
                $stmt->execute([$userId, $lockHours, $lockHours]);
            }

            // Calculate referral commissions (5 levels up)
            $commissionRates = $this->getCommissionRates();
            $currentUserId = $userId;
            for ($level = 1; $level <= 5; $level++) {
                $refStmt = $this->db->prepare('SELECT referred_by FROM users WHERE id = ?');
                $refStmt->execute([$currentUserId]);
                $ref = $refStmt->fetch();
                if (!$ref || !$ref['referred_by']) break;

                $uplineId = (int)$ref['referred_by'];
                $rate = $commissionRates[$level] ?? 0;
                if ($rate > 0) {
                    $commAmount = $amount * ($rate / 100);
                    $stmt = $this->db->prepare(
                        'INSERT INTO referral_commissions (user_id, source_user_id, level, percentage, amount, source_deposit_id, source_amount, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                    );
                    $stmt->execute([$uplineId, $userId, $level, $rate, $commAmount, $depositId, $amount, 'pending']);
                    // Add commission to display balance
                    $this->db->prepare('UPDATE users SET display_balance = display_balance + ? WHERE id = ?')
                        ->execute([$commAmount, $uplineId]);
                }
                $currentUserId = $uplineId;
            }

            logAdminAction($this->db, $adminId, 'confirm_deposit', 'deposits', $depositId, null, null);
            $this->db->commit();
            return ['success' => true, 'deposit' => $deposit];
        } catch (Throwable $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Reject a deposit
     */
    public function reject(int $depositId, int $adminId): array {
        $stmt = $this->db->prepare('UPDATE deposits SET status = ? WHERE id = ? AND status = ?');
        $stmt->execute(['rejected', $depositId, 'pending']);
        logAdminAction($this->db, $adminId, 'reject_deposit', 'deposits', $depositId);
        return ['success' => true];
    }

    /**
     * Get user's deposits
     */
    public function getByUser(int $userId, int $limit = 20): array {
        $stmt = $this->db->prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll();
    }

    /**
     * Get all pending deposits (admin)
     */
    public function getPending(): array {
        $stmt = $this->db->prepare(
            'SELECT d.*, u.username, u.email FROM deposits d JOIN users u ON d.user_id = u.id WHERE d.status = ? ORDER BY d.created_at ASC'
        );
        $stmt->execute(['pending']);
        return $stmt->fetchAll();
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
