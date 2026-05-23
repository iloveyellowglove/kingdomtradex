<?php
/**
 * Plisio Deposit Service
 * Generates permanent crypto addresses for users and handles deposit callbacks.
 */
class PlisioDepositService {
    private PlisioClient $client;
    private $db;

    public function __construct(PlisioClient $client, $db) {
        $this->client = $client;
        $this->db = $db;
    }

    /**
     * Generate permanent deposit addresses for a user across BTC, ETH, USDT.
     * Stores addresses in the users table.
     */
    public function generateUserAddresses(int $userId): array {
        $user = $this->getUserById($userId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        // Build or reuse plisio_uid
        $uid = $user['plisio_uid'] ?? ('user_' . $userId . '_' . substr(md5($user['email']), 0, 8));
        if (empty($user['plisio_uid'])) {
            $this->updateUser($userId, ['plisio_uid' => $uid]);
        }

        // Check if addresses already exist
        if (!empty($user['plisio_btc_address']) && !empty($user['plisio_eth_address']) && !empty($user['plisio_usdt_address'])) {
            return [
                'success' => true,
                'addresses' => [
                    'BTC' => $user['plisio_btc_address'],
                    'ETH' => $user['plisio_eth_address'],
                    'USDT' => $user['plisio_usdt_address'],
                ],
                'from_cache' => true,
            ];
        }

        // Call Plisio API to generate addresses
        $result = $this->client->createDepositAddresses($uid, ['BTC', 'ETH', 'USDT_TRX']);

        if (!$result['success']) {
            return $result;
        }

        // Map Plisio currency IDs back to our field names
        $updates = [];
        $addressMap = [
            'BTC' => 'plisio_btc_address',
            'ETH' => 'plisio_eth_address',
            'USDT_TRX' => 'plisio_usdt_address',
        ];

        $addresses = [];
        foreach ($result['addresses'] as $psysCid => $hash) {
            if (isset($addressMap[$psysCid])) {
                $updates[$addressMap[$psysCid]] = $hash;
                // Strip USDT_TRX back to USDT for display
                $displayCurrency = ($psysCid === 'USDT_TRX') ? 'USDT' : $psysCid;
                $addresses[$displayCurrency] = $hash;
            }
        }

        if (!empty($updates)) {
            $this->updateUser($userId, $updates);
        }

        return ['success' => true, 'addresses' => $addresses, 'from_cache' => false];
    }

    /**
     * Handle incoming deposit webhook from Plisio (ipn_type=pay_in).
     * Verifies signature, looks up user by uid, credits balance.
     */
    public function handleCallback(array $postData): array {
        // Verify authenticity
        if (!$this->client->verifyCallback($postData)) {
            return ['success' => false, 'error' => 'Invalid callback signature.'];
        }

        $ipnType = $postData['ipn_type'] ?? '';
        if ($ipnType !== 'pay_in') {
            return ['success' => false, 'error' => 'Not a deposit callback (ipn_type=' . $ipnType . ').'];
        }

        $status = $postData['status'] ?? '';
        if ($status !== 'completed') {
            return ['success' => true, 'message' => 'Deposit not yet completed. Status: ' . $status];
        }

        $uid = $postData['deposit_uid'] ?? '';
        $txnId = $postData['txn_id'] ?? '';
        $currency = $postData['currency'] ?? '';
        $amount = floatval($postData['amount'] ?? '0');
        $walletHash = $postData['wallet_hash'] ?? '';

        if (empty($uid) || empty($txnId)) {
            return ['success' => false, 'error' => 'Missing uid or txn_id in callback.'];
        }

        // Find user by plisio_uid
        $user = $this->getUserByPlisioUid($uid);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found for uid: ' . $uid];
        }

        // Check for duplicate transaction
        if ($this->depositExists($txnId)) {
            return ['success' => true, 'message' => 'Duplicate transaction. Already processed.'];
        }

        // Map Plisio currency to our internal currency code
        $ourCurrency = $this->mapCurrency($currency);

        // Record deposit
        $this->recordDeposit($user['id'], $txnId, $ourCurrency, $amount, $walletHash);

        // Update user balance
        $newBalance = floatval($user['display_balance']) + $amount;
        $newTotalDeposited = floatval($user['total_deposited_real'] ?? '0') + $amount;

        // Set first deposit time if not set
        $firstDepositUpdate = empty($user['first_deposit_time']) ? ['first_deposit_time' => date('Y-m-d H:i:s')] : [];

        $this->updateUser($user['id'], array_merge([
            'display_balance' => number_format($newBalance, 8, '.', ''),
            'total_deposited_real' => number_format($newTotalDeposited, 8, '.', ''),
        ], $firstDepositUpdate));

        return [
            'success' => true,
            'message' => 'Deposit credited.',
            'user_id' => $user['id'],
            'amount' => $amount,
            'currency' => $ourCurrency,
        ];
    }

    /**
     * Handle invoice payment callback (ipn_type=invoice).
     * Updates invoice status and credits user if completed.
     */
    public function handleInvoiceCallback(array $postData): array {
        if (!$this->client->verifyCallback($postData)) {
            return ['success' => false, 'error' => 'Invalid callback signature.'];
        }

        $status = $postData['status'] ?? '';
        $orderNumber = $postData['order_number'] ?? '';
        $txnId = $postData['txn_id'] ?? '';
        $amount = floatval($postData['amount'] ?? '0');
        $currency = $postData['currency'] ?? '';

        if ($status === 'completed') {
            // Find user by order_number (format: "inv_{userId}_{random}")
            if (preg_match('/^inv_(\d+)_/', $orderNumber, $m)) {
                $userId = (int)$m[1];
                $user = $this->getUserById($userId);
                if ($user && !$this->depositExists($txnId)) {
                    $ourCurrency = $this->mapCurrency($currency);
                    $newBalance = floatval($user['display_balance']) + $amount;
                    $newTotalDeposited = floatval($user['total_deposited_real'] ?? '0') + $amount;

                    $firstDepositUpdate = empty($user['first_deposit_time']) ? ['first_deposit_time' => date('Y-m-d H:i:s')] : [];

                    $this->updateUser($user['id'], array_merge([
                        'display_balance' => number_format($newBalance, 8, '.', ''),
                        'total_deposited_real' => number_format($newTotalDeposited, 8, '.', ''),
                    ], $firstDepositUpdate));

                    $this->recordDeposit($user['id'], $txnId, $ourCurrency, $amount, $postData['wallet_hash'] ?? 'invoice');
                }
            }
        }

        return ['success' => true, 'message' => 'Invoice callback processed. Status: ' . $status];
    }

    // ── Database helpers ──

    private function getUserById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    private function getUserByPlisioUid(string $uid): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE plisio_uid = ? LIMIT 1');
        $stmt->execute([$uid]);
        return $stmt->fetch() ?: null;
    }

    private function updateUser(int $userId, array $fields): void {
        $setClauses = [];
        $params = [];
        foreach ($fields as $col => $val) {
            $setClauses[] = "$col = ?";
            $params[] = $val;
        }
        $params[] = $userId;
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $setClauses) . ' WHERE id = ?');
        $stmt->execute($params);
    }

    private function depositExists(string $txnId): bool {
        $stmt = $this->db->prepare('SELECT id FROM deposits WHERE txn_id = ? LIMIT 1');
        $stmt->execute([$txnId]);
        return (bool)$stmt->fetch();
    }

    private function recordDeposit(int $userId, string $txnId, string $currency, float $amount, string $address): void {
        $stmt = $this->db->prepare(
            'INSERT INTO deposits (user_id, txn_id, currency, amount, address, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$userId, $txnId, $currency, number_format($amount, 8, '.', ''), $address, 'completed']);
    }

    private function mapCurrency(string $plisioCurrency): string {
        $map = [
            'BTC' => 'BTC',
            'ETH' => 'ETH',
            'USDT_TRX' => 'USDT',
            'USDT' => 'USDT',
        ];
        // Handle longer Plisio currency codes that start with known prefixes
        foreach ($map as $key => $val) {
            if (strpos($plisioCurrency, $key) === 0) {
                return $val;
            }
        }
        return $plisioCurrency;
    }
}
