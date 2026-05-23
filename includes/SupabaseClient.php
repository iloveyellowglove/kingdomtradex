<?php
/**
 * Supabase REST API Client
 * Replaces FlatDB with PostgreSQL via Supabase REST API.
 * Uses PHP streams (no cURL). Service role key used server-side; anon key never exposed to client.
 */
class SupabaseClient {
    private string $url;
    private string $serviceKey;
    private int $timeout = 30;

    public function __construct(string $url, string $serviceKey) {
        $this->url = rtrim($url, '/');
        $this->serviceKey = $serviceKey;
    }

    /**
     * Build and execute a Supabase REST request.
     */
    private function request(string $method, string $path, ?array $body = null, array $query = [], array $headers = []): array {
        $qs = '';
        if (!empty($query)) {
            // Build Supabase filter query strings
            $parts = [];
            foreach ($query as $k => $v) {
                $parts[] = urlencode($k) . '=' . urlencode((string)$v);
            }
            $qs = '?' . implode('&', $parts);
        }

        $url = $this->url . '/rest/v1/' . $path . $qs;

        $httpHeaders = [
            'apikey: ' . $this->serviceKey,
            'Authorization: Bearer ' . $this->serviceKey,
            'Content-Type: application/json',
            'Prefer: return=representation',
        ];
        foreach ($headers as $h) {
            $httpHeaders[] = $h;
        }

        $opts = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $httpHeaders),
                'timeout' => $this->timeout,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
            ],
        ];

        if ($body !== null && in_array($method, ['POST', 'PATCH', 'PUT'])) {
            $opts['http']['content'] = json_encode($body);
        }

        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);

        // Extract HTTP status from response headers
        $httpCode = 0;
        if (isset($http_response_header)) {
            $firstLine = $http_response_header[0] ?? '';
            if (preg_match('/\s(\d{3})\s/', $firstLine, $m)) {
                $httpCode = (int)$m[1];
            }
        }

        if ($response === false || $response === '') {
            return [
                'success' => false,
                'error' => 'HTTP request failed',
                'http_code' => $httpCode,
                'data' => null,
            ];
        }

        $data = json_decode($response, true);

        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'http_code' => $httpCode,
            'data' => $data,
        ];
    }

    // ── CRUD Operations ──

    /**
     * SELECT rows from a table.
     *
     * Examples:
     *   get('users', ['id' => 'eq.1'])                  → WHERE id = 1
     *   get('users', ['role' => 'eq.pastor', 'select' => 'id,username'])
     *   get('users', ['order' => 'created_at.desc', 'limit' => '10'])
     */
    public function get(string $table, array $params = []): array {
        $query = [];
        $select = $params['select'] ?? '*';
        unset($params['select']);

        $query['select'] = $select;

        // Build filters: key => value pairs where value is "operator.value"
        foreach ($params as $k => $v) {
            if (in_array($k, ['order', 'limit', 'offset'])) {
                $query[$k] = $v;
            } else {
                // Filter: column=eq.value, column=in.(1,2,3), etc.
                if (is_array($v)) {
                    $query[$k] = 'in.(' . implode(',', $v) . ')';
                } else {
                    // If value starts with eq./gt./lt./like./ilike./is./in.(...), use as-is
                    if (preg_match('/^(eq|gt|lt|gte|lte|like|ilike|is|in|neq|cs|cd)\./', $v)) {
                        $query[$k] = $v;
                    } else {
                        $query[$k] = 'eq.' . $v;
                    }
                }
            }
        }

        $result = $this->request('GET', $table, null, $query);
        return $result['data'] ?? [];
    }

    /**
     * Get a single row by ID.
     */
    public function getById(string $table, $id): ?array {
        $rows = $this->get($table, ['id' => 'eq.' . $id, 'limit' => '1']);
        return $rows[0] ?? null;
    }

    /**
     * INSERT a row. Returns the inserted row(s).
     */
    public function post(string $table, array $data, array $extraHeaders = []): ?array {
        $result = $this->request('POST', $table, $data, [], array_merge([
            'Prefer: return=representation',
        ], $extraHeaders));

        if ($result['success'] && $result['data']) {
            return is_array($result['data']) ? $result['data'] : [];
        }

        // On conflict with no return, just return the data we tried to insert
        if ($result['http_code'] === 409) {
            return null; // duplicate key
        }

        return $result['data'] ?? [];
    }

    /**
     * INSERT a row, returning minimal info. Returns the ID as string or null.
     */
    public function insert(string $table, array $data): ?string {
        $result = $this->request('POST', $table, $data, [], [
            'Prefer: return=representation',
        ]);

        if ($result['success'] && !empty($result['data'])) {
            $row = is_array($result['data']) ? ($result['data'][0] ?? $result['data']) : $result['data'];
            return isset($row['id']) ? (string)$row['id'] : null;
        }

        return null;
    }

    /**
     * UPDATE rows. $where is a filter array.
     */
    public function patch(string $table, array $where, array $data): int {
        $query = [];
        foreach ($where as $k => $v) {
            if (preg_match('/^(eq|gt|lt|gte|lte|like|ilike|is|in|neq)\./', $v)) {
                $query[$k] = $v;
            } else {
                $query[$k] = 'eq.' . $v;
            }
        }

        $result = $this->request('PATCH', $table, $data, $query, [
            'Prefer: return=representation',
        ]);

        if ($result['success']) {
            return is_array($result['data']) ? count($result['data']) : 1;
        }
        return 0;
    }

    /**
     * DELETE rows matching filter.
     */
    public function delete(string $table, array $where): int {
        $query = [];
        foreach ($where as $k => $v) {
            if (preg_match('/^(eq|gt|lt|gte|lte|like|ilike|is|in|neq)\./', $v)) {
                $query[$k] = $v;
            } else {
                $query[$k] = 'eq.' . $v;
            }
        }

        $result = $this->request('DELETE', $table, null, $query, [
            'Prefer: return=representation',
        ]);

        if ($result['success']) {
            return is_array($result['data']) ? count($result['data']) : 1;
        }
        return 0;
    }

    /**
     * Execute a raw SELECT via Supabase RPC or direct REST query.
     * Supports JOIN-like queries by chaining multiple get() calls.
     */
    public function query(string $table, array $filters = [], string $select = '*', string $order = '', int $limit = 0, int $offset = 0): array {
        $params = ['select' => $select];
        foreach ($filters as $k => $v) {
            $params[$k] = $v;
        }
        if ($order) {
            $params['order'] = $order; // e.g., 'created_at.desc'
        }
        if ($limit > 0) {
            $params['limit'] = (string)$limit;
        }
        if ($offset > 0) {
            $params['offset'] = (string)$offset;
        }
        return $this->get($table, $params);
    }

    /**
     * Run a raw count query. Returns count as integer.
     */
    public function count(string $table, array $filters = []): int {
        $params = [
            'select' => 'id',
        ];
        foreach ($filters as $k => $v) {
            $params[$k] = $v;
        }
        $result = $this->get($table, $params);
        return count($result);
    }

    /**
     * Get the count from a count query (uses Prefer: count=exact header).
     */
    public function countExact(string $table, array $filters = []): int {
        $query = ['select' => 'id'];
        foreach ($filters as $k => $v) {
            $query[$k] = $v;
        }

        $result = $this->request('GET', $table, null, $query, [
            'Prefer: count=exact',
        ]);

        if ($result['success']) {
            // The count is in the Content-Range header, but we can also just count the array
            return is_array($result['data']) ? count($result['data']) : 0;
        }
        return 0;
    }

    /**
     * Perform a "JOIN" by fetching from table A, extracting IDs, then fetching from table B.
     * Returns merged results. For simple needs; complex queries should use Supabase Views or RPC.
     */
    public function join(string $table, array $filters, string $joinTable, string $joinKey, string $foreignKey, string $select = '*', string $order = '', int $limit = 0): array {
        $rows = $this->query($table, $filters, $select, $order, $limit);

        if (empty($rows)) return [];

        // Extract foreign keys
        $ids = array_unique(array_map(function($r) use ($foreignKey) {
            return $r[$foreignKey] ?? null;
        }, $rows));
        $ids = array_filter($ids, function($v) { return $v !== null; });

        if (empty($ids)) return $rows;

        $joinedRows = $this->query($joinTable, [$joinKey => 'in.(' . implode(',', $ids) . ')']);

        // Index joined rows by key
        $indexed = [];
        foreach ($joinedRows as $jr) {
            $key = $jr[$joinKey] ?? null;
            if ($key !== null) {
                $indexed[$key] = $jr;
            }
        }

        // Merge
        foreach ($rows as &$row) {
            $fk = $row[$foreignKey] ?? null;
            if ($fk !== null && isset($indexed[$fk])) {
                // Prefix join columns to avoid name conflicts
                foreach ($indexed[$fk] as $col => $val) {
                    $row[$joinTable . '_' . $col] = $val;
                }
            }
        }

        return $rows;
    }

    /**
     * Perform an aggregate: sum a column across rows matching filters.
     */
    public function sum(string $table, string $column, array $filters = []): float {
        $params = ['select' => $column];
        foreach ($filters as $k => $v) {
            $params[$k] = $v;
        }
        $rows = $this->get($table, $params);
        $sum = 0.0;
        foreach ($rows as $r) {
            $sum += (float)($r[$column] ?? 0);
        }
        return $sum;
    }

    /**
     * Get the last inserted ID for a table (approximate: fetches max id).
     */
    public function lastInsertId(string $table): int {
        $rows = $this->query($table, [], 'id', 'id.desc', 1);
        if (!empty($rows)) {
            return (int)$rows[0]['id'];
        }
        return 0;
    }
}
