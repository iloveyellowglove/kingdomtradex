<?php
/**
 * Plisio Withdrawal Service
 * Handles single withdrawals (pastor-only) and mass payouts for commissions.
 */
class PlisioWithdrawalService {
    private PlisioClient $client;
    private $db;

    public function __construct(PlisioClient $client, $db) {
        $this->client = $client;
        $this->db = $db;
    }

    /**
     * Send a withdrawal to a single address.
     * AUTHORIZATION: Only users with role 'pastor' can withdraw.
     * Normal 'member' users cannot initiate real withdrawals.
     */
    public function sendWithdrawal(int $userId, float $amount, string $currency, string $address): array {
        $user = $this->getUserById($userId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        // ── ROLE CHECK: Only pastors can withdraw ──
        if ($user['role'] !== 'pastor') {
            return ['success' => false, 'error' => 'Withdrawals are restricted to pastors only. Your role: ' . $user['role']];
        }

        // Validate balance
        $balance = floatval($user['display_balance'] ?? '0');
        if ($amount <= 0) {
            return ['success' => false, 'error' => 'Withdrawal amount must be positive.'];
        }
        if ($amount > $balance) {
            return ['success' => false, 'error' => 'Insufficient balance. Available: ' . number_format($balance, 8)];
        }

        // Validate currency and address
        $currency = strtoupper(trim($currency));
        $address = trim($address);
        if (empty($address)) {
            return ['success' => false, 'error' => 'Destination address is required.'];
        }

        // Map our internal currency to Plisio's psys_cid
        $plisioCurrency = $this->toPlisioCurrency($currency);

        // Deduct balance BEFORE sending (optimistic)
        $newBalance = $balance - $amount;
        $newTotalWithdrawn = floatval($user['total_withdrawn_real'] ?? '0') + $amount;

        $this->updateUser($userId, [
            'display_balance' => number_format($newBalance, 8, '.', ''),
            'total_withdrawn_real' => number_format($newTotalWithdrawn, 8, '.', ''),
            'pending_withdrawal_amount' => number_format(floatval($user['pending_withdrawal_amount'] ?? '0') + $amount, 8, '.', ''),
        ]);

        // Call Plisio API
        $result = $this->client->withdraw($plisioCurrency, $address, $amount);
        $txnId = $result['data']['id'] ?? null;
        $apiStatus = $result['data']['status'] ?? ($result['status'] ?? 'error');

        if (($result['status'] ?? '') === 'success' && $apiStatus === 'completed') {
            // Success — clear pending and record
            $this->updateUser($userId, [
                'pending_withdrawal_amount' => number_format(max(0, floatval($user['pending_withdrawal_amount'] ?? '0')), 8, '.', ''),
            ]);
            $this->recordWithdrawal($userId, $txnId, $currency, $amount, $address, 'completed');

            return [
                'success' => true,
                'message' => 'Withdrawal sent successfully.',
                'txn_id' => $txnId,
                'tx_url' => $result['data']['tx_url'] ?? null,
            ];
        }

        if (($result['status'] ?? '') === 'success' && $apiStatus !== 'completed') {
            // Plisio accepted but not yet completed
            $this->recordWithdrawal($userId, $txnId, $currency, $amount, $address, 'pending');
            return [
                'success' => true,
                'message' => 'Withdrawal submitted and pending.',
                'txn_id' => $txnId,
                'status' => 'pending',
            ];
        }

        // API call failed — refund the balance
        $this->updateUser($userId, [
            'display_balance' => number_format($balance, 8, '.', ''),
            'total_withdrawn_real' => number_format(floatval($user['total_withdrawn_real'] ?? '0'), 8, '.', ''),
            'pending_withdrawal_amount' => number_format(floatval($user['pending_withdrawal_amount'] ?? '0'), 8, '.', ''),
        ]);

        $errorMsg = $result['data']['message'] ?? 'Withdrawal failed.';
        return ['success' => false, 'error' => $errorMsg];
    }

    /**
     * Send mass withdrawals to multiple addresses (for pastor commission payouts).
     * $payments = ['address1' => amount1, 'address2' => amount2, ...]
     *
     * Saves up to 80% on fees by batching up to 1,000 transactions.
     */
    public function sendMassWithdrawals(array $payments, string $currency): array {
        if (empty($payments)) {
            return ['success' => false, 'error' => 'No payments provided.'];
        }

        $currency = strtoupper(trim($currency));
        $plisioCurrency = $this->toPlisioCurrency($currency);

        $result = $this->client->massWithdraw($payments, $plisioCurrency);
        $apiStatus = $result['data']['status'] ?? ($result['status'] ?? 'error');

        if (($result['status'] ?? '') === 'success') {
            $sendmany = $result['data']['sendmany'] ?? [];
            return [
                'success' => true,
                'message' => 'Mass withdrawal ' . ($apiStatus === 'completed' ? 'completed' : 'submitted') . '.',
                'txn_id' => $result['data']['id'] ?? null,
                'total_recipients' => count($payments),
                'total_amount' => array_sum($payments),
                'fee' => $result['data']['fee'] ?? null,
                'sendmany' => $sendmany,
            ];
        }

        $errorMsg = $result['data']['message'] ?? 'Mass withdrawal failed.';
        return ['success' => false, 'error' => $errorMsg];
    }

    /**
     * Pay commissions to multiple pastors via mass withdrawal.
     * $commissions = [['user_id' => 1, 'amount' => 0.001, 'address' => 'bc1q...'], ...]
     */
    public function payPastorCommissions(array $commissions, string $currency): array {
        $payments = [];
        $recipients = [];

        foreach ($commissions as $c) {
            $user = $this->getUserById($c['user_id']);
            if (!$user) continue;

            $addressField = 'plisio_' . strtolower($currency) . '_address';
            $address = $user[$addressField] ?? null;

            if (empty($address)) {
                $recipients[] = [
                    'user_id' => $c['user_id'],
                    'status' => 'skipped',
                    'reason' => 'No ' . $currency . ' address on file.',
                ];
                continue;
            }

            $payments[$address] = $c['amount'];
            $recipients[] = [
                'user_id' => $c['user_id'],
                'address' => $address,
                'amount' => $c['amount'],
                'status' => 'queued',
            ];
        }

        if (empty($payments)) {
            return ['success' => false, 'error' => 'No valid addresses found for any recipient.'];
        }

        $result = $this->sendMassWithdrawals($payments, $currency);
        $result['recipients'] = $recipients;
        return $result;
    }

    /**
     * Check Plisio balance for a currency.
     */
    public function checkBalance(string $currency): array {
        $plisioCurrency = $this->toPlisioCurrency($currency);
        return $this->client->getBalance($plisioCurrency);
    }

    // ── Database helpers ──

    private function getUserById(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
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

    private function recordWithdrawal(int $userId, ?string $txnId, string $currency, float $amount, string $address, string $status): void {
        $stmt = $this->db->prepare(
            'INSERT INTO withdrawals (user_id, txn_id, currency, amount, address, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([$userId, $txnId ?? '', $currency, number_format($amount, 8, '.', ''), $address, $status]);
    }

    private function toPlisioCurrency(string $ourCurrency): string {
        $map = [
            'BTC' => 'BTC',
            'ETH' => 'ETH',
            'USDT' => 'USDT_TRX',
        ];
        return $map[$ourCurrency] ?? $ourCurrency;
    }
}
