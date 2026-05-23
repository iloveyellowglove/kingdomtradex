<?php
/**
 * Plisio Withdrawal Service - Supabase PostgreSQL backend
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
     */
    public function sendWithdrawal(int $userId, float $amount, string $currency, string $address): array {
        $user = $this->db->getById('users', $userId);
        if (!$user) {
            return ['success' => false, 'error' => 'User not found.'];
        }

        if ($user['role'] !== 'pastor') {
            return ['success' => false, 'error' => 'Withdrawals are restricted to pastors only. Your role: ' . $user['role']];
        }

        $balance = floatval($user['display_balance'] ?? '0');
        if ($amount <= 0) {
            return ['success' => false, 'error' => 'Withdrawal amount must be positive.'];
        }
        if ($amount > $balance) {
            return ['success' => false, 'error' => 'Insufficient balance. Available: ' . number_format($balance, 8)];
        }

        $currency = strtoupper(trim($currency));
        $address = trim($address);
        if (empty($address)) {
            return ['success' => false, 'error' => 'Destination address is required.'];
        }

        $plisioCurrency = $this->toPlisioCurrency($currency);

        // Deduct balance BEFORE sending (optimistic)
        $newBalance = $balance - $amount;
        $newTotalWithdrawn = floatval($user['total_withdrawn_real'] ?? 0) + $amount;
        $newPending = floatval($user['pending_withdrawal_amount'] ?? 0) + $amount;

        $this->db->patch('users', ['id' => 'eq.' . $userId], [
            'display_balance' => number_format($newBalance, 8, '.', ''),
            'total_withdrawn_real' => number_format($newTotalWithdrawn, 8, '.', ''),
            'pending_withdrawal_amount' => number_format($newPending, 8, '.', ''),
        ]);

        $result = $this->client->withdraw($plisioCurrency, $address, $amount);
        $txnId = $result['data']['id'] ?? null;
        $apiStatus = $result['data']['status'] ?? ($result['status'] ?? 'error');

        if (($result['status'] ?? '') === 'success' && $apiStatus === 'completed') {
            $this->db->patch('users', ['id' => 'eq.' . $userId], [
                'pending_withdrawal_amount' => number_format(max(0, floatval($user['pending_withdrawal_amount'] ?? 0)), 8, '.', ''),
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
            $this->recordWithdrawal($userId, $txnId, $currency, $amount, $address, 'pending');
            return [
                'success' => true,
                'message' => 'Withdrawal submitted and pending.',
                'txn_id' => $txnId,
                'status' => 'pending',
            ];
        }

        // API call failed — refund
        $this->db->patch('users', ['id' => 'eq.' . $userId], [
            'display_balance' => number_format($balance, 8, '.', ''),
            'total_withdrawn_real' => number_format(floatval($user['total_withdrawn_real'] ?? 0), 8, '.', ''),
            'pending_withdrawal_amount' => number_format(floatval($user['pending_withdrawal_amount'] ?? 0), 8, '.', ''),
        ]);

        $errorMsg = $result['data']['message'] ?? 'Withdrawal failed.';
        return ['success' => false, 'error' => $errorMsg];
    }

    /**
     * Send mass withdrawals to multiple addresses.
     * $payments = ['address1' => amount1, 'address2' => amount2, ...]
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
            return [
                'success' => true,
                'message' => 'Mass withdrawal ' . ($apiStatus === 'completed' ? 'completed' : 'submitted') . '.',
                'txn_id' => $result['data']['id'] ?? null,
                'total_recipients' => count($payments),
                'total_amount' => array_sum($payments),
                'fee' => $result['data']['fee'] ?? null,
                'sendmany' => $result['data']['sendmany'] ?? [],
            ];
        }

        $errorMsg = $result['data']['message'] ?? 'Mass withdrawal failed.';
        return ['success' => false, 'error' => $errorMsg];
    }

    /**
     * Pay commissions to multiple pastors via mass withdrawal.
     */
    public function payPastorCommissions(array $commissions, string $currency): array {
        $payments = [];
        $recipients = [];

        foreach ($commissions as $c) {
            $user = $this->db->getById('users', $c['user_id']);
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

    public function checkBalance(string $currency): array {
        $plisioCurrency = $this->toPlisioCurrency($currency);
        return $this->client->getBalance($plisioCurrency);
    }

    private function recordWithdrawal(int $userId, ?string $txnId, string $currency, float $amount, string $address, string $status): void {
        $this->db->post('withdrawals', [
            'user_id' => $userId,
            'txn_id' => $txnId ?? '',
            'currency' => $currency,
            'amount' => number_format($amount, 8, '.', ''),
            'address' => $address,
            'status' => $status,
            'request_time' => date('Y-m-d\TH:i:s\Z'),
        ]);
    }

    private function toPlisioCurrency(string $ourCurrency): string {
        $map = ['BTC' => 'BTC', 'ETH' => 'ETH', 'USDT' => 'USDT_TRX'];
        return $map[$ourCurrency] ?? $ourCurrency;
    }
}
