<?php
/**
 * Commission model - Supabase PostgreSQL backend
 * Handles referral commission tracking and payouts.
 */
class Commission {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Get commissions for a user
     */
    public function getByUser(int $userId, int $limit = 50, int $offset = 0): array {
        return $this->db->join(
            'referral_commissions',
            ['user_id' => 'eq.' . $userId],
            'users',
            'id',
            'source_user_id',
            '*',
            'created_at.desc',
            $limit
        );
    }

    /**
     * Get total pending commissions for user
     */
    public function getTotalPending(int $userId): float {
        return $this->db->sum('referral_commissions', 'amount', [
            'user_id' => 'eq.' . $userId,
            'status' => 'eq.pending',
        ]);
    }

    /**
     * Get total paid commissions for user
     */
    public function getTotalPaid(int $userId): float {
        return $this->db->sum('referral_commissions', 'amount', [
            'user_id' => 'eq.' . $userId,
            'status' => 'eq.paid',
        ]);
    }

    /**
     * Admin marks a commission as paid
     */
    public function markPaid(int $commissionId, int $adminId): array {
        $rows = $this->db->query('referral_commissions', [
            'id' => 'eq.' . $commissionId,
            'status' => 'eq.pending',
        ], 'id', '', 1);

        if (empty($rows)) {
            return ['success' => false, 'error' => 'Commission not found or already paid.'];
        }

        $this->db->patch('referral_commissions', ['id' => 'eq.' . $commissionId], [
            'status' => 'paid',
            'paid_at' => date('Y-m-d\TH:i:s\Z'),
        ]);

        logAdminAction($this->db, $adminId, 'mark_commission_paid', 'referral_commissions', $commissionId);
        return ['success' => true];
    }

    /**
     * Mark all pending commissions for a user as paid
     */
    public function markAllPaid(int $userId, int $adminId): int {
        $rows = $this->db->query('referral_commissions', [
            'user_id' => 'eq.' . $userId,
            'status' => 'eq.pending',
        ], 'id');

        $count = 0;
        foreach ($rows as $r) {
            $this->db->patch('referral_commissions', ['id' => 'eq.' . $r['id']], [
                'status' => 'paid',
                'paid_at' => date('Y-m-d\TH:i:s\Z'),
            ]);
            $count++;
        }

        if ($count > 0) {
            logAdminAction($this->db, $adminId, 'mark_all_commissions_paid', 'referral_commissions', $userId);
        }
        return $count;
    }

    /**
     * Get all commissions (admin) with joined usernames
     */
    public function getAll(int $limit = 50, int $offset = 0): array {
        // First get commissions
        $commissions = $this->db->query('referral_commissions', [], '*', 'created_at.desc', $limit, $offset);

        if (empty($commissions)) return [];

        // Collect user IDs for batch lookup
        $userIds = array_unique(array_merge(
            array_column($commissions, 'user_id'),
            array_column($commissions, 'source_user_id')
        ));

        // Fetch all relevant users
        $users = $this->db->query('users', [
            'id' => 'in.(' . implode(',', $userIds) . ')',
        ], 'id,username');

        $userMap = [];
        foreach ($users as $u) {
            $userMap[$u['id']] = $u['username'];
        }

        // Merge
        foreach ($commissions as &$c) {
            $c['user_name'] = $userMap[$c['user_id']] ?? 'Unknown';
            $c['source_name'] = $userMap[$c['source_user_id']] ?? 'Unknown';
        }

        return $commissions;
    }
}
