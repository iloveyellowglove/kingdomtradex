<?php
/**
 * Plisio Deposit Service - Supabase PostgreSQL backend
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
     */
    public function generateUserAddresses(int $userId): array {
        $user = $this->getUserById($userId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        $uid = $user['plisio_uid'] ?? ('user_' . $userId . '_' . substr(md5($user['email']), 0, 8));
        if (empty($user['plisio_uid'])) {
            $this->updateUser($userId, ['plisio_uid' => $uid]);
        }

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

        $result = $this->client->createDepositAddresses($uid, ['BTC', 'ETH', 'USDT_TRX']);
        if (!$result['success']) {
            return $result;
        }

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
     */
    public function handleCallback(array $postData): array {
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

        $user = $this->getUserByPlisioUid($uid);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found for uid: ' . $uid];
        }

        if ($this->depositExists($txnId)) {
            return ['success' => true, 'message' => 'Duplicate transaction. Already processed.'];
        }

        $ourCurrency = $this->mapCurrency($currency);
        $this->recordDeposit($user['id'], $txnId, $ourCurrency, $amount, $walletHash);

        $newBalance = floatval($user['display_balance'] ?? 0) + $amount;
        $newTotalDeposited = floatval($user['total_deposited_real'] ?? 0) + $amount;

        $firstDepositUpdate = [];
        if (empty($user['first_deposit_time'])) {
            $firstDepositUpdate['first_deposit_time'] = date('Y-m-d\TH:i:s\Z');
        }

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

        if ($status === 'completed' && preg_match('/^inv_(\d+)_/', $orderNumber, $m)) {
            $userId = (int)$m[1];
            $user = $this->getUserById($userId);
            if ($user && !$this->depositExists($txnId)) {
                $ourCurrency = $this->mapCurrency($currency);
                $newBalance = floatval($user['display_balance'] ?? 0) + $amount;
                $newTotalDeposited = floatval($user['total_deposited_real'] ?? 0) + $amount;

                $firstDepositUpdate = [];
                if (empty($user['first_deposit_time'])) {
                    $firstDepositUpdate['first_deposit_time'] = date('Y-m-d\TH:i:s\Z');
                }

                $this->updateUser($user['id'], array_merge([
                    'display_balance' => number_format($newBalance, 8, '.', ''),
                    'total_deposited_real' => number_format($newTotalDeposited, 8, '.', ''),
                ], $firstDepositUpdate));

                $this->recordDeposit($user['id'], $txnId, $ourCurrency, $amount, $postData['wallet_hash'] ?? 'invoice');
            }
        }

        return ['success' => true, 'message' => 'Invoice callback processed. Status: ' . $status];
    }

    // ── Database helpers ──

    private function getUserById(int $id): ?array {
        return $this->db->getById('users', $id);
    }

    private function getUserByPlisioUid(string $uid): ?array {
        $rows = $this->db->query('users', ['plisio_uid' => 'eq.' . $uid], '*', '', 1);
        return $rows[0] ?? null;
    }

    private function updateUser(int $userId, array $fields): void {
        $this->db->patch('users', ['id' => 'eq.' . $userId], $fields);
    }

    private function depositExists(string $txnId): bool {
        $rows = $this->db->query('deposits', ['txn_id' => 'eq.' . $txnId], 'id', '', 1);
        return !empty($rows);
    }

    private function recordDeposit(int $userId, string $txnId, string $currency, float $amount, string $address): void {
        $this->db->post('deposits', [
            'user_id' => $userId,
            'txn_id' => $txnId,
            'txid' => $txnId,
            'currency' => $currency,
            'amount' => number_format($amount, 8, '.', ''),
            'address' => $address,
            'status' => 'completed',
            'created_at' => date('Y-m-d\TH:i:s\Z'),
        ]);
    }

    private function mapCurrency(string $plisioCurrency): string {
        $map = ['BTC' => 'BTC', 'ETH' => 'ETH', 'USDT_TRX' => 'USDT', 'USDT' => 'USDT'];
        foreach ($map as $key => $val) {
            if (strpos($plisioCurrency, $key) === 0) return $val;
        }
        return $plisioCurrency;
    }
}
