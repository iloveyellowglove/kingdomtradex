<?php
/**
 * Plisio API Client
 * Lightweight HTTP client using PHP streams (no cURL required).
 * Handles all Plisio API v1 communication.
 */
class PlisioClient {
    private string $apiKey;
    private string $baseUrl = 'https://api.plisio.net/api/v1';
    private int $timeout = 30;

    public function __construct(string $apiKey) {
        $this->apiKey = $apiKey;
    }

    /**
     * Make a GET request to the Plisio API.
     */
    public function get(string $endpoint, array $params = []): array {
        $params['api_key'] = $this->apiKey;
        $url = $this->baseUrl . $endpoint . '?' . http_build_query($params);

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Content-Type: application/json\r\n",
                'timeout' => $this->timeout,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false || $response === '') {
            return ['status' => 'error', 'data' => ['message' => 'API request failed', 'code' => 0]];
        }

        $data = json_decode($response, true);
        if (!is_array($data)) {
            return ['status' => 'error', 'data' => ['message' => 'Invalid JSON response', 'code' => 0]];
        }

        return $data;
    }

    /**
     * Verify a Plisio webhook callback signature.
     * Uses HMAC-SHA1 as specified by Plisio docs.
     */
    public function verifyCallback(array $postData): bool {
        if (empty($postData['verify_hash'])) {
            return false;
        }

        $providedHash = $postData['verify_hash'];
        unset($postData['verify_hash']);

        // Sort keys alphabetically
        ksort($postData);

        // JSON encode the sorted data
        $dataString = json_encode($postData);

        // Compute HMAC-SHA1 with the secret key
        $computedHash = hash_hmac('sha1', $dataString, $this->apiKey);

        return hash_equals($computedHash, $providedHash);
    }

    // ── Convenience methods for each Plisio endpoint ──

    /**
     * Generate permanent deposit addresses for a user.
     * Returns array of ['psys_cid' => 'hash'] on success.
     */
    public function createDepositAddresses(string $uid, array $currencies): array {
        $result = $this->get('/shops/deposit/new', [
            'uid' => $uid,
            'psys_cid' => implode(',', $currencies),
        ]);

        if (($result['status'] ?? '') !== 'success') {
            return ['success' => false, 'error' => $result['data']['message'] ?? 'Unknown error'];
        }

        $data = $result['data'];
        // Normalize: single result or array of results
        if (isset($data['hash'])) {
            $data = [$data];
        }

        $addresses = [];
        foreach ($data as $entry) {
            $addresses[$entry['psys_cid']] = $entry['hash'];
        }

        return ['success' => true, 'addresses' => $addresses];
    }

    /**
     * Send a single withdrawal.
     */
    public function withdraw(string $currency, string $address, float $amount, string $feePlan = 'normal'): array {
        return $this->get('/operations/withdraw', [
            'currency' => $currency,
            'type' => 'cash_out',
            'to' => $address,
            'amount' => number_format($amount, 8, '.', ''),
            'feePlan' => $feePlan,
        ]);
    }

    /**
     * Send a mass withdrawal to multiple addresses.
     * $payments = ['address1' => amount1, 'address2' => amount2, ...]
     */
    public function massWithdraw(array $payments, string $currency, string $feePlan = 'normal'): array {
        $addresses = array_keys($payments);
        $amounts = array_values($payments);

        return $this->get('/operations/withdraw', [
            'currency' => $currency,
            'type' => 'mass_cash_out',
            'to' => implode(',', $addresses),
            'amount' => implode(',', array_map(function($a) {
                return number_format($a, 8, '.', '');
            }, $amounts)),
            'feePlan' => $feePlan,
        ]);
    }

    /**
     * Check balance for a specific cryptocurrency.
     */
    public function getBalance(string $psysCid): array {
        return $this->get("/balances/{$psysCid}");
    }

    /**
     * Create an invoice for a user to pay.
     */
    public function createInvoice(array $params): array {
        return $this->get('/invoices/new', $params);
    }
}
