<?php
/**
 * User model - Supabase PostgreSQL backend
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
        $existing = $this->db->query('users', [
            'select' => 'id',
            'or' => '(email.eq.' . $email . ',username.eq.' . $username . ')',
            'limit' => '1',
        ]);
        if (!empty($existing)) {
            return ['success' => false, 'error' => 'Email or username already taken.'];
        }

        // Resolve referrer
        $referredBy = null;
        if ($referralCode) {
            $ref = $this->db->query('users', [
                'referral_code' => 'eq.' . strtoupper(trim($referralCode)),
                'status' => 'eq.active',
            ], 'id', '', 1);
            if (!empty($ref)) {
                $referredBy = (int)$ref[0]['id'];
            } else {
                return ['success' => false, 'error' => 'Invalid referral code.'];
            }
        }

        $newReferralCode = generateReferralCode($this->db);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        // PHP 8.5.2+ needs $2b$ prefix instead of $2y$
        $passwordHash = str_replace('$2y$', '$2b$', $passwordHash);

        // Get next ID for plisio_uid generation
        $lastId = $this->db->lastInsertId('users');
        $nextId = $lastId + 1;
        $plisioUid = 'user_' . $nextId . '_' . substr(md5($email . time()), 0, 8);

        $data = [
            'username' => $username,
            'email' => $email,
            'password_hash' => $passwordHash,
            'role' => 'member',
            'referral_code' => $newReferralCode,
            'referred_by' => $referredBy,
            'plisio_uid' => $plisioUid,
            'plisio_btc_address' => '',
            'plisio_eth_address' => '',
            'plisio_usdt_address' => '',
            'display_balance' => 0,
            'total_deposited_real' => 0,
            'total_withdrawn_real' => 0,
            'pending_withdrawal_amount' => 0,
            'status' => 'active',
            'created_at' => date('Y-m-d\TH:i:s\Z'),
        ];

        $rows = $this->db->post('users', $data);
        if (empty($rows)) {
            return ['success' => false, 'error' => 'Registration failed. Please try again.'];
        }

        $userId = (int)$rows[0]['id'];

        return [
            'success' => true,
            'user_id' => $userId,
            'referral_code' => $newReferralCode,
        ];
    }

    /**
     * Authenticate user, return user array on success
     */
    public function login(string $email, string $password): array {
        $emailClean = strtolower(trim($email));

        if (!filter_var($emailClean, FILTER_VALIDATE_EMAIL)) {
            error_log('[LOGIN] FAIL: invalid email format: ' . substr($emailClean, 0, 50));
            return ['success' => false, 'error' => 'Invalid credentials.'];
        }

        error_log('[LOGIN] Step 1: querying Supabase for email=' . $emailClean);
        $rows = $this->db->query('users', ['email' => 'eq.' . $emailClean], '*', '', 1);
        $user = $rows[0] ?? null;

        if (!$user) {
            error_log('[LOGIN] FAIL: no user found or Supabase returned empty/error');
            return ['success' => false, 'error' => 'Invalid credentials.'];
        }
        error_log('[LOGIN] Step 3: user found, id=' . ($user['id'] ?? '?') . ', status=' . ($user['status'] ?? '?') . ', hash_len=' . strlen($user['password_hash'] ?? ''));
        error_log('[LOGIN] DEBUG: testing known hash: ' . (password_verify('admin123', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uZutLiSDi') ? 'TRUE' : 'FALSE'));
        error_log('[LOGIN] DEBUG: input password bytes: ' . bin2hex($password));
        error_log('[LOGIN] DEBUG: hash from db bytes: ' . bin2hex($user['password_hash']));
        // Supabase JSON may return hashes with escaped forward slashes (\/)
        // PHP 8.5.2+ needs $2b$ prefix instead of $2y$
        $hash = str_replace(['\/', '$2y$'], ['/', '$2b$'], $user['password_hash']);
        if ($user['status'] === 'banned') {
            error_log('[LOGIN] FAIL: user is banned');
            return ['success' => false, 'error' => 'Account is banned.'];
        }
        if ($user['status'] === 'suspended') {
            error_log('[LOGIN] FAIL: user is suspended');
            return ['success' => false, 'error' => 'Account is suspended.'];
        }
        $pwOk = password_verify($password, $hash);
        error_log('[LOGIN] Step 4: password_verify result=' . ($pwOk ? 'true' : 'false'));
        if (!$pwOk) {
            error_log('[LOGIN] FAIL: password_verify returned false');
            return ['success' => false, 'error' => 'Invalid credentials.'];
        }

        // Update last login
        $this->db->patch('users', ['id' => 'eq.' . $user['id']], [
            'last_login' => date('Y-m-d\TH:i:s\Z'),
        ]);
        error_log('[LOGIN] SUCCESS: user id=' . $user['id'] . ', role=' . $user['role']);

        return ['success' => true, 'user' => $user];
    }

    /**
     * Get user by ID
     */
    public function getById(int $id): ?array {
        $rows = $this->db->query('users', ['id' => 'eq.' . $id], '*', '', 1);
        return $rows[0] ?? null;
    }

    /**
     * Get user's downline count by level
     */
    public function getDownlineCounts(int $userId): array {
        $counts = ['level_1' => 0, 'level_2' => 0, 'level_3' => 0, 'level_4' => 0, 'level_5' => 0];

        // Level 1
        $l1 = $this->db->query('users', [
            'referred_by' => 'eq.' . $userId,
            'status' => 'eq.active',
        ], 'id');
        $counts['level_1'] = count($l1);
        $l1Ids = array_column($l1, 'id');

        // Level 2
        if ($l1Ids) {
            $l2 = $this->db->query('users', [
                'referred_by' => 'in.(' . implode(',', $l1Ids) . ')',
                'status' => 'eq.active',
            ], 'id');
            $counts['level_2'] = count($l2);
            $l2Ids = array_column($l2, 'id');
        } else { $l2Ids = []; }

        // Level 3
        if ($l2Ids) {
            $l3 = $this->db->query('users', [
                'referred_by' => 'in.(' . implode(',', $l2Ids) . ')',
                'status' => 'eq.active',
            ], 'id');
            $counts['level_3'] = count($l3);
            $l3Ids = array_column($l3, 'id');
        } else { $l3Ids = []; }

        // Level 4
        if ($l3Ids) {
            $l4 = $this->db->query('users', [
                'referred_by' => 'in.(' . implode(',', $l3Ids) . ')',
                'status' => 'eq.active',
            ], 'id');
            $counts['level_4'] = count($l4);
            $l4Ids = array_column($l4, 'id');
        } else { $l4Ids = []; }

        // Level 5
        if ($l4Ids) {
            $l5 = $this->db->query('users', [
                'referred_by' => 'in.(' . implode(',', $l4Ids) . ')',
                'status' => 'eq.active',
            ], 'id');
            $counts['level_5'] = count($l5);
        }

        return $counts;
    }

    /**
     * Search users (admin)
     */
    public function search(string $query = '', int $limit = 50, int $offset = 0): array {
        $filters = [];
        if ($query) {
            // Sanitize: allow only alphanumeric, @, ., _, -, spaces, and % for ilike wildcard
            $safe = preg_replace('/[^a-zA-Z0-9@._%\-\s]/', '', $query);
            if ($safe !== '') {
                $filters['or'] = '(email.ilike.%' . $safe . '%,username.ilike.%' . $safe . '%)';
            }
        }
        return $this->db->query(
            'users',
            $filters,
            'id,username,email,role,display_balance,total_deposited_real,total_withdrawn_real,status,created_at',
            'id.desc',
            $limit,
            $offset
        );
    }

    /**
     * Adjust user balance (admin action)
     */
    public function adjustBalance(int $userId, float $newBalance, int $adminId): void {
        $old = $this->db->getById('users', $userId);
        $oldBalance = $old['display_balance'] ?? 0;

        $this->db->patch('users', ['id' => 'eq.' . $userId], [
            'display_balance' => number_format($newBalance, 8, '.', ''),
        ]);

        logAdminAction($this->db, $adminId, 'adjust_balance', 'users', $userId, (string)$oldBalance, (string)$newBalance);
    }

    /**
     * Update user fields by ID
     */
    public function update(int $userId, array $fields): void {
        $this->db->patch('users', ['id' => 'eq.' . $userId], $fields);
    }

    /**
     * Get user by plisio_uid
     */
    public function getByPlisioUid(string $uid): ?array {
        $rows = $this->db->query('users', ['plisio_uid' => 'eq.' . $uid], '*', '', 1);
        return $rows[0] ?? null;
    }
}
