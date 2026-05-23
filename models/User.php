<?php
/**
 * User model - DEMO MODE
 * Handles user registration, authentication, balance management.
 */
class User {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Register a new user
     */
    public function register(string $username, string $email, string $password, ?string $referralCode = null): array {
        // Validate inputs
        $username = trim($username);
        $email = strtolower(trim($email));
        if (strlen($username) < 3 || strlen($username) > 50) {
            return ['success' => false, 'error' => 'Username must be 3-50 characters.'];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email address.'];
        }
        if (strlen($password) < 8) {
            return ['success' => false, 'error' => 'Password must be at least 8 characters.'];
        }

        // Check existing
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1');
        $stmt->execute([$email, $username]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'Email or username already taken.'];
        }

        // Resolve referrer
        $referredBy = null;
        if ($referralCode) {
            $stmt = $this->db->prepare('SELECT id FROM users WHERE referral_code = ? AND status = ? LIMIT 1');
            $stmt->execute([strtoupper(trim($referralCode)), 'active']);
            $referrer = $stmt->fetch();
            if ($referrer) {
                $referredBy = (int)$referrer['id'];
            } else {
                return ['success' => false, 'error' => 'Invalid referral code.'];
            }
        }

        $referralCode = generateReferralCode($this->db);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $plisioUid = 'user_' . ($this->db->lastInsertId() + 1) . '_' . substr(md5($email . time()), 0, 8);

        $stmt = $this->db->prepare(
            'INSERT INTO users (username, email, password_hash, role, referral_code, referred_by, plisio_uid, plisio_btc_address, plisio_eth_address, plisio_usdt_address, display_balance, total_deposited_real, total_withdrawn_real, pending_withdrawal_amount, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$username, $email, $passwordHash, 'member', $referralCode, $referredBy, $plisioUid, '', '', '', '0', '0', '0', '0', 'active']);
        $userId = (int)$this->db->lastInsertId();

        return [
            'success' => true,
            'user_id' => $userId,
            'referral_code' => $referralCode,
        ];
    }

    /**
     * Authenticate user, return user array on success
     */
    public function login(string $email, string $password): array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([strtolower(trim($email))]);
        $user = $stmt->fetch();

        if (!$user) {
            return ['success' => false, 'error' => 'Invalid credentials.'];
        }

        if ($user['status'] === 'banned') {
            return ['success' => false, 'error' => 'Account is banned.'];
        }
        if ($user['status'] === 'suspended') {
            return ['success' => false, 'error' => 'Account is suspended.'];
        }

        if (!password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'error' => 'Invalid credentials.'];
        }

        // Update last login
        $stmt = $this->db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
        $stmt->execute([$user['id']]);

        return ['success' => true, 'user' => $user];
    }

    /**
     * Get user by ID
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Get user's downline count by level
     */
    public function getDownlineCounts(int $userId): array {
        $counts = ['level_1' => 0, 'level_2' => 0, 'level_3' => 0, 'level_4' => 0, 'level_5' => 0];
        // Level 1
        $stmt = $this->db->prepare('SELECT id FROM users WHERE referred_by = ? AND status = ?');
        $stmt->execute([$userId, 'active']);
        $l1 = $stmt->fetchAll(3);
        $counts['level_1'] = count($l1);

        // Level 2
        if ($l1) {
            $in = implode(',', array_map('intval', $l1));
            $stmt = $this->db->query("SELECT id FROM users WHERE referred_by IN ($in) AND status = 'active'");
            $l2 = $stmt->fetchAll(3);
            $counts['level_2'] = count($l2);
        } else { $l2 = []; }

        // Level 3
        if ($l2) {
            $in = implode(',', array_map('intval', $l2));
            $stmt = $this->db->query("SELECT id FROM users WHERE referred_by IN ($in) AND status = 'active'");
            $l3 = $stmt->fetchAll(3);
            $counts['level_3'] = count($l3);
        } else { $l3 = []; }

        // Level 4
        if ($l3) {
            $in = implode(',', array_map('intval', $l3));
            $stmt = $this->db->query("SELECT id FROM users WHERE referred_by IN ($in) AND status = 'active'");
            $l4 = $stmt->fetchAll(3);
            $counts['level_4'] = count($l4);
        } else { $l4 = []; }

        // Level 5
        if ($l4) {
            $in = implode(',', array_map('intval', $l4));
            $stmt = $this->db->query("SELECT id FROM users WHERE referred_by IN ($in) AND status = 'active'");
            $l5 = $stmt->fetchAll(3);
            $counts['level_5'] = count($l5);
        }

        return $counts;
    }

    /**
     * Search users (admin)
     */
    public function search(string $query = '', int $limit = 50, int $offset = 0): array {
        if ($query) {
            $stmt = $this->db->prepare(
                'SELECT id, username, email, role, display_balance, total_deposited_real, total_withdrawn_real, status, created_at
                 FROM users WHERE (email LIKE ? OR username LIKE ?) ORDER BY id DESC LIMIT ? OFFSET ?'
            );
            $like = "%$query%";
            $stmt->execute([$like, $like, $limit, $offset]);
        } else {
            $stmt = $this->db->prepare('SELECT id, username, email, role, display_balance, total_deposited_real, total_withdrawn_real, status, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?');
            $stmt->execute([$limit, $offset]);
        }
        return $stmt->fetchAll();
    }

    /**
     * Adjust user balance (admin action)
     */
    public function adjustBalance(int $userId, float $newBalance, int $adminId): void {
        $old = $this->db->prepare('SELECT display_balance FROM users WHERE id = ?');
        $old->execute([$userId]);
        $oldBalance = $old->fetchColumn();

        $stmt = $this->db->prepare('UPDATE users SET display_balance = ? WHERE id = ?');
        $stmt->execute([$newBalance, $userId]);

        logAdminAction($this->db, $adminId, 'adjust_balance', 'users', $userId, (string)$oldBalance, (string)$newBalance);
    }
}
