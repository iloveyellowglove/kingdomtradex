<?php
/**
 * Commission model - DEMO MODE
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
        $stmt = $this->db->prepare(
            'SELECT rc.*, u.username AS source_username
             FROM referral_commissions rc
             JOIN users u ON rc.source_user_id = u.id
             WHERE rc.user_id = ?
             ORDER BY rc.created_at DESC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$userId, $limit, $offset]);
        return $stmt->fetchAll();
    }

    /**
     * Get total pending commissions for user
     */
    public function getTotalPending(int $userId): float {
        $stmt = $this->db->prepare('SELECT COALESCE(SUM(amount), 0) FROM referral_commissions WHERE user_id = ? AND status = ?');
        $stmt->execute([$userId, 'pending']);
        return (float)$stmt->fetchColumn();
    }

    /**
     * Get total paid commissions for user
     */
    public function getTotalPaid(int $userId): float {
        $stmt = $this->db->prepare('SELECT COALESCE(SUM(amount), 0) FROM referral_commissions WHERE user_id = ? AND status = ?');
        $stmt->execute([$userId, 'paid']);
        return (float)$stmt->fetchColumn();
    }

    /**
     * Admin marks a commission as paid
     */
    public function markPaid(int $commissionId, int $adminId): array {
        $stmt = $this->db->prepare("UPDATE referral_commissions SET status = 'paid', paid_at = NOW() WHERE id = ? AND status = 'pending'");
        $stmt->execute([$commissionId]);
        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'error' => 'Commission not found or already paid.'];
        }
        logAdminAction($this->db, $adminId, 'mark_commission_paid', 'referral_commissions', $commissionId);
        return ['success' => true];
    }

    /**
     * Mark all pending commissions for a user as paid
     */
    public function markAllPaid(int $userId, int $adminId): int {
        $stmt = $this->db->prepare("UPDATE referral_commissions SET status = 'paid', paid_at = NOW() WHERE user_id = ? AND status = 'pending'");
        $stmt->execute([$userId]);
        $count = $stmt->rowCount();
        if ($count > 0) {
            logAdminAction($this->db, $adminId, 'mark_all_commissions_paid', 'referral_commissions', $userId);
        }
        return $count;
    }

    /**
     * Get all commissions (admin)
     */
    public function getAll(int $limit = 50, int $offset = 0): array {
        $stmt = $this->db->prepare(
            'SELECT rc.*, u.username AS user_name, s.username AS source_name
             FROM referral_commissions rc
             JOIN users u ON rc.user_id = u.id
             JOIN users s ON rc.source_user_id = s.id
             ORDER BY rc.created_at DESC LIMIT ? OFFSET ?'
        );
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
}
