<?php
/**
 * Flat-File JSON Database - Zero Dependency Backend
 * Implements enough of the PDO interface to run the exchange demo without MySQL.
 *
 * Legacy flat-file storage (replaced by Supabase PostgreSQL).
 */

class FlatDBStatement {
    private FlatDB $db;
    private string $sql;
    private array $params = [];
    private array $resultSet = [];
    private int $rowsAffected = 0;
    private ?string $insertId = null;

    public function __construct(FlatDB $db, string $sql) {
        $this->db = $db;
        $this->sql = $sql;
    }

    public function execute(array $params = []): bool {
        $this->params = $params;
        $this->resultSet = [];
        $this->rowsAffected = 0;

        $sql = $this->sql;
        // Replace ? with actual params (handling quoting)
        $paramIdx = 0;
        $sql = preg_replace_callback('/\?/', function() use (&$paramIdx, $params) {
            $val = $params[$paramIdx++] ?? 'NULL';
            return $this->db->quote($val);
        }, $sql);

        // Replace NOW() with current timestamp
        $sql = str_replace('NOW()', "'" . date('Y-m-d H:i:s') . "'", $sql);
        // Replace DATE_ADD(NOW(), INTERVAL X HOUR) patterns
        $sql = preg_replace_callback("/DATE_ADD\('[\d\-: ]+', INTERVAL (\d+) HOUR\)/", function($m) {
            return "'" . date('Y-m-d H:i:s', strtotime("+{$m[1]} hours")) . "'";
        }, $sql);
        // Replace DATE_SUB(NOW(), INTERVAL X HOUR)
        $sql = preg_replace_callback("/DATE_SUB\('[\d\-: ]+', INTERVAL (\d+) HOUR\)/", function($m) {
            return "'" . date('Y-m-d H:i:s', strtotime("-{$m[1]} hours")) . "'";
        }, $sql);

        // Handle INSERT ... ON DUPLICATE KEY UPDATE
        if (preg_match('/^INSERT\s+(OR\s+(\w+)\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(\s+ON\s+DUPLICATE\s+KEY\s+UPDATE\s+(.+))?$/is', $sql, $m)) {
            $mode = strtoupper($m[2] ?? '');
            $table = trim($m[3], '`');
            $columns = array_map(function($c) { return trim(trim($c), '`"\' '); }, explode(',', $m[4]));
            $values = $this->db->parseValues($m[5]);
            $onDup = $m[7] ?? '';

            $this->insertId = $this->db->insert($table, $columns, $values, $mode, $onDup);
            $this->rowsAffected = $this->insertId ? 1 : 0;
            return true;
        }

        // Handle UPDATE
        if (preg_match('/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/is', $sql, $m)) {
            $table = trim($m[1], '`');
            $sets = $this->db->parseSetClauses($m[2]);
            $where = $m[3] ?? '';
            $limit = isset($m[4]) ? (int)$m[4] : 0;
            $this->rowsAffected = $this->db->update($table, $sets, $where, $limit);
            return true;
        }

        // Handle DELETE
        if (preg_match('/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/is', $sql, $m)) {
            $table = trim($m[1], '`');
            $where = $m[2] ?? '';
            $limit = isset($m[3]) ? (int)$m[3] : 0;
            $this->rowsAffected = $this->db->delete($table, $where, $limit);
            return true;
        }

        // Handle SELECT (including JOIN, COUNT, SUM, COALESCE)
        if (preg_match('/^SELECT\s+(.+?)\s+FROM\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?(?:\s+OFFSET\s+(\d+))?(?:\s+FOR\s+UPDATE)?$/is', $sql, $m)) {
            $what = $m[1];
            $from = $m[2];
            $where = $m[3] ?? '';
            $groupBy = $m[4] ?? '';
            $orderBy = $m[5] ?? '';
            $limit = isset($m[6]) ? (int)$m[6] : 0;
            $offset = isset($m[7]) ? (int)$m[7] : 0;

            $this->resultSet = $this->db->select($what, $from, $where, $orderBy, $limit, $offset, $groupBy);
            return true;
        }

        return false;
    }

    public function fetch(int $mode = 0): array|false {
        $row = current($this->resultSet);
        if ($row === false) return false;
        next($this->resultSet);
        return $row;
    }

    public function fetchAll(int $mode = 0): array {
        if ($mode === 3) { // PDO::FETCH_COLUMN
            return array_map(function($row) { return reset($row); }, $this->resultSet);
        }
        return $this->resultSet;
    }

    public function fetchColumn(int $column = 0): mixed {
        $row = $this->fetch();
        if ($row === false) return false;
        $vals = array_values($row);
        return $vals[$column] ?? null;
    }

    public function rowCount(): int {
        return $this->rowsAffected ?: count($this->resultSet);
    }
}

class FlatDB {
    private string $dataDir;
    private bool $inTransaction = false;
    private array $snapshots = [];

    public function __construct(string $dataDir) {
        $this->dataDir = rtrim($dataDir, '/');
        if (!is_dir($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
    }

    public function prepare(string $sql): FlatDBStatement {
        return new FlatDBStatement($this, $sql);
    }

    public function query(string $sql): FlatDBStatement {
        $stmt = $this->prepare($sql);
        $stmt->execute([]);
        return $stmt;
    }

    public function lastInsertId(): string {
        $tables = $this->readTable('_meta');
        return (string)($tables['last_insert_id'] ?? '0');
    }

    public function beginTransaction(): bool {
        $this->inTransaction = true;
        $this->snapshots = [];
        return true;
    }

    public function commit(): bool {
        $this->inTransaction = false;
        $this->snapshots = [];
        return true;
    }

    public function rollBack(): bool {
        if ($this->inTransaction) {
            foreach ($this->snapshots as $table => $data) {
                $this->writeTable($table, $data);
            }
        }
        $this->inTransaction = false;
        $this->snapshots = [];
        return true;
    }

    // ---- Internal CRUD ----

    public function quote($val): string {
        if ($val === null || $val === 'NULL') return 'NULL';
        if (is_int($val) || is_float($val)) return (string)$val;
        return "'" . str_replace("'", "''", (string)$val) . "'";
    }

    public function parseValues(string $valsStr): array {
        $values = [];
        $current = '';
        $inQuote = false;
        $quoteChar = '';
        foreach (str_split($valsStr) as $ch) {
            if ($inQuote) {
                $current .= $ch;
                if ($ch === $quoteChar) $inQuote = false;
            } elseif ($ch === "'" || $ch === '"') {
                $inQuote = true;
                $quoteChar = $ch;
                $current .= $ch;
            } elseif ($ch === ',') {
                $values[] = $this->unquote(trim($current));
                $current = '';
            } else {
                $current .= $ch;
            }
        }
        if ($current !== '') $values[] = $this->unquote(trim($current));
        return $values;
    }

    public function unquote(string $val): mixed {
        $val = trim($val);
        if ($val === 'NULL') return null;
        if (($val[0] === "'" && substr($val, -1) === "'") || ($val[0] === '"' && substr($val, -1) === '"')) {
            return substr($val, 1, -1);
        }
        if (is_numeric($val)) {
            return str_contains($val, '.') ? (float)$val : (int)$val;
        }
        return $val;
    }

    public function parseSetClauses(string $setsStr): array {
        $sets = [];
        preg_match_all('/(\w+)\s*=\s*(.+?)(?:,|$)/', $setsStr, $matches, PREG_SET_ORDER);
        foreach ($matches as $m) {
            $col = trim($m[1], '`');
            $val = $this->unquote(trim($m[2]));
            // Handle display_balance + ? or total_deposited_real - ? etc.
            if (preg_match('/^([a-zA-Z_]\w*)\s*([+\-])\s*(.+)$/', (string)$val, $arith)) {
                // Arithmetic update - handled separately
                $sets[$col] = ['expr' => true, 'col' => $arith[1], 'op' => $arith[2], 'val' => $this->unquote($arith[3])];
            } else {
                $sets[$col] = $val;
            }
        }
        return $sets;
    }

    public function insert(string $table, array $columns, array $values, string $mode = '', string $onDupSql = ''): ?string {
        $rows = $this->readTable($table);

        // Check for unique constraints
        if ($mode === 'IGNORE') {
            // Try to find duplicates - simple check on first column assumed unique
            // For ai_trading_profits: UNIQUE (user_id, date)
            if ($table === 'ai_trading_profits') {
                $uidIdx = array_search('user_id', $columns);
                $dateIdx = array_search('date', $columns);
                foreach ($rows as $row) {
                    if (($row['user_id'] ?? null) == ($values[$uidIdx] ?? null) &&
                        ($row['date'] ?? null) == ($values[$dateIdx] ?? null)) {
                        return null; // Skip duplicate
                    }
                }
            }
        }

        // ON DUPLICATE KEY UPDATE handling
        if ($onDupSql && $table === 'withdrawal_locks') {
            $uidIdx = array_search('user_id', $columns);
            foreach ($rows as $idx => $row) {
                if (($row['user_id'] ?? null) == ($values[$uidIdx] ?? null)) {
                    // Update existing row
                    $newRow = $row;
                    foreach ($columns as $i => $col) {
                        $newRow[$col] = $values[$i];
                    }
                    // Parse ON DUPLICATE updates
                    $this->applyDuplicateUpdates($newRow, $onDupSql);
                    $rows[$idx] = $newRow;
                    $this->writeTable($table, $rows);
                    return (string)$row['id'];
                }
            }
        }

        // Auto-increment
        $meta = $this->readTable('_meta');
        $nextId = ($meta[$table] ?? 0) + 1;
        $meta[$table] = $nextId;
        $meta['last_insert_id'] = $nextId;
        $this->writeTable('_meta', $meta);

        $row = ['id' => $nextId];
        foreach ($columns as $i => $col) {
            $row[$col] = $values[$i];
        }
        $rows[] = $row;
        $this->writeTable($table, $rows);
        return (string)$nextId;
    }

    private function applyDuplicateUpdates(array &$row, string $onDupSql): void {
        // Parse: first_deposit_time = NOW(), lock_expiry_time = DATE_ADD(...), is_locked = 1
        preg_match_all('/(\w+)\s*=\s*(.+?)(?:,|$)/', $onDupSql, $matches, PREG_SET_ORDER);
        foreach ($matches as $m) {
            $col = trim($m[1], '`');
            $val = $this->unquote(trim($m[2]));
            $row[$col] = $val;
        }
    }

    public function update(string $table, array $sets, string $whereClause = '', int $limit = 0): int {
        $rows = $this->readTable($table);
        $count = 0;

        // Handle arithmetic updates (deposit_balance = deposit_balance + value)
        $arithmeticUpdates = [];
        $directUpdates = [];
        foreach ($sets as $col => $val) {
            if (is_array($val) && ($val['expr'] ?? false)) {
                $arithmeticUpdates[$col] = $val;
            } else {
                $directUpdates[$col] = $val;
            }
        }

        foreach ($rows as $idx => $row) {
            if ($this->matchesWhere($row, $whereClause)) {
                foreach ($directUpdates as $col => $val) {
                    $row[$col] = $val;
                }
                foreach ($arithmeticUpdates as $col => $arith) {
                    $current = (float)($row[$arith['col']] ?? 0);
                    $change = (float)$arith['val'];
                    $row[$col] = $arith['op'] === '+' ? $current + $change : $current - $change;
                }
                $rows[$idx] = $row;
                $count++;
                if ($limit > 0 && $count >= $limit) break;
            }
        }

        if ($count > 0) {
            $this->writeTable($table, $rows);
        }
        return $count;
    }

    public function delete(string $table, string $whereClause = '', int $limit = 0): int {
        $rows = $this->readTable($table);
        $newRows = [];
        $count = 0;

        foreach ($rows as $row) {
            if ($this->matchesWhere($row, $whereClause)) {
                $count++;
                if ($limit > 0 && $count >= $limit) {
                    continue; // Delete this one
                }
                // Skip this row (delete it)
            } else {
                $newRows[] = $row;
            }
        }

        if ($count > 0) {
            $this->writeTable($table, $newRows);
        }
        return $count;
    }

    public function select(string $what, string $from, string $whereClause = '', string $orderBy = '', int $limit = 0, int $offset = 0, string $groupBy = ''): array {
        // Handle FROM clause (may include JOIN)
        $tables = $this->parseFrom($from);
        $isCount = stripos($what, 'COUNT(') !== false;
        $isSum = stripos($what, 'SUM(') !== false;
        $isCoalesce = stripos($what, 'COALESCE(') !== false;

        // Load primary table
        $mainTable = $tables[0]['table'];
        $mainAlias = $tables[0]['alias'] ?? $mainTable;
        $rows = $this->readTable($mainTable);

        // Handle JOINs
        $joinRows = [];
        foreach ($tables as $i => $t) {
            if ($i === 0) continue;
            $joinRows[$t['alias'] ?? $t['table']] = [
                'table' => $t['table'],
                'rows' => $this->readTable($t['table']),
                'alias' => $t['alias'] ?? $t['table'],
                'on' => $t['on'] ?? '',
            ];
        }

        // Parse selected columns
        $selectCols = [];
        if (!$isCount && !$isSum && !$isCoalesce && $what !== '*') {
            $parts = explode(',', $what);
            foreach ($parts as $part) {
                $part = trim($part);
                // Handle table.column or alias.column or alias.*
                if (preg_match('/(?:(?:`?(\w+)`?)\.)?`?(\w+|\*)`?(?:\s+AS\s+(\w+))?/i', $part, $m)) {
                    $selectCols[] = ['table' => $m[1] ?? '', 'column' => $m[2], 'alias' => $m[3] ?? ''];
                }
            }
        }

        // Perform JOINs - prefix join table columns with alias to avoid overwrites
        $result = [];
        foreach ($rows as $row) {
            $joinedRows = [$row];
            foreach ($joinRows as $jAlias => $jInfo) {
                $newJoined = [];
                foreach ($joinedRows as $baseRow) {
                    foreach ($jInfo['rows'] as $jRow) {
                        if ($this->evaluateJoinOn($baseRow, $jRow, $mainAlias, $jAlias, $jInfo['on'])) {
                            // Prefix join table columns to avoid name conflicts
                            $prefixed = [];
                            foreach ($jRow as $col => $val) {
                                $prefixed[$jAlias . '_' . $col] = $val;
                            }
                            $newJoined[] = array_merge($baseRow, $prefixed);
                        }
                    }
                }
                $joinedRows = $newJoined ?: $joinedRows;
            }

            foreach ($joinedRows as $mergedRow) {
                // Rewrite where clause: strip main table alias, prefix join table columns
                $rewrittenWhere = $whereClause;
                if ($mainAlias && $mainAlias !== $mainTable) {
                    $rewrittenWhere = preg_replace('/\b' . $mainAlias . '\.(\w+)/', '$1', $rewrittenWhere);
                }
                foreach ($joinRows as $jAlias => $jInfo) {
                    $rewrittenWhere = preg_replace('/\b' . $jAlias . '\.(\w+)/', $jAlias . '_$1', $rewrittenWhere);
                }

                if ($this->matchesWhere($mergedRow, $rewrittenWhere)) {
                    if ($isCount) {
                        $result[] = [$what => 1];
                    } elseif ($isSum || $isCoalesce) {
                        if (preg_match('/COALESCE\(SUM\((\w+)\),\s*0\)/i', $what, $sm)) {
                            $col = trim($sm[1], '`');
                            $result[] = [$what => (float)($mergedRow[$col] ?? 0)];
                        } elseif (preg_match('/SUM\((\w+)\)/i', $what, $sm)) {
                            $col = trim($sm[1], '`');
                            $result[] = [$what => (float)($mergedRow[$col] ?? 0)];
                        }
                    } elseif ($what === '*' || empty($selectCols)) {
                        $result[] = $mergedRow;
                    } else {
                        $out = [];
                        foreach ($selectCols as $sc) {
                            if ($sc['column'] === '*') {
                                // Include all columns from the specified table
                                $tbl = $sc['table'];
                                if ($tbl === $mainAlias || empty($tbl)) {
                                    foreach ($mergedRow as $k => $v) {
                                        // Exclude columns prefixed by join table aliases
                                        $fromJoin = false;
                                        foreach ($joinRows as $jAlias => $ji) {
                                            if (str_starts_with($k, $jAlias . '_')) { $fromJoin = true; break; }
                                        }
                                        if (!$fromJoin) $out[$k] = $v;
                                    }
                                } else {
                                    $prefix = $tbl . '_';
                                    foreach ($mergedRow as $k => $v) {
                                        if (str_starts_with($k, $prefix)) {
                                            $out[substr($k, strlen($prefix))] = $v;
                                        }
                                    }
                                }
                            } else {
                                $key = $sc['alias'] ?: $sc['column'];
                                // Check prefixed name first, then bare
                                $prefixedKey = $sc['table'] ? ($sc['table'] . '_' . $sc['column']) : null;
                                if ($prefixedKey && isset($mergedRow[$prefixedKey])) {
                                    $out[$key] = $mergedRow[$prefixedKey];
                                } else {
                                    $out[$key] = $mergedRow[$sc['column']] ?? $mergedRow[$key] ?? null;
                                }
                            }
                        }
                        $result[] = $out;
                    }
                }
            }
        }

        // Handle aggregate queries
        if ($isCount) {
            return [['total' => count($result)]];
        }
        if ($isSum || $isCoalesce) {
            $sum = array_sum(array_map(function($r) use ($what) { return (float)($r[$what] ?? 0); }, $result));
            return [[$what => $sum]];
        }

        // Order by
        if ($orderBy) {
            $parts = explode(' ', trim($orderBy));
            $orderCol = trim($parts[0], '`');
            $orderDir = strtoupper($parts[1] ?? 'ASC');
            usort($result, function($a, $b) use ($orderCol, $orderDir) {
                $va = $a[$orderCol] ?? '';
                $vb = $b[$orderCol] ?? '';
                if ($va == $vb) return 0;
                $cmp = ($va < $vb) ? -1 : 1;
                return $orderDir === 'DESC' ? -$cmp : $cmp;
            });
        }

        // Offset
        if ($offset > 0) {
            $result = array_slice($result, $offset);
        }
        // Limit
        if ($limit > 0) {
            $result = array_slice($result, 0, $limit);
        }

        return $result;
    }

    private function parseFrom(string $from): array {
        $tables = [];
        // Split on JOIN keywords
        $parts = preg_split('/\s+(?:INNER\s+)?JOIN\s+/i', $from);
        foreach ($parts as $idx => $part) {
            if ($idx === 0) {
                // First table: "users u" or "users"
                if (preg_match('/`?(\w+)`?(?:\s+(?:AS\s+)?(\w+))?/i', trim($part), $m)) {
                    $tables[] = ['table' => $m[1], 'alias' => $m[2] ?? ''];
                }
            } else {
                // JOIN: "users u ON u.id = d.user_id"
                if (preg_match('/`?(\w+)`?(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+(.+)/i', trim($part), $m)) {
                    $tables[] = ['table' => $m[1], 'alias' => $m[2] ?? '', 'on' => $m[3]];
                }
            }
        }
        return $tables;
    }

    private function evaluateJoinOn(array $left, array $right, string $lAlias, string $rAlias, string $on): bool {
        // Parse "u.id = d.user_id" or "d.user_id = u.id"
        if (preg_match('/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/', $on, $m)) {
            $lCol = $m[1] === $lAlias ? $m[2] : ($m[3] === $lAlias ? $m[4] : $m[2]);
            $rCol = $m[1] === $rAlias ? $m[2] : ($m[3] === $rAlias ? $m[4] : $m[4]);
            return ($left[$lCol] ?? null) == ($right[$rCol] ?? null);
        }
        return true;
    }

    public function matchesWhere(array $row, string $whereClause): bool {
        if (empty($whereClause)) return true;

        // Handle AND-connected conditions
        $conditions = preg_split('/\s+AND\s+/i', $whereClause);
        foreach ($conditions as $cond) {
            $cond = trim($cond);
            if (empty($cond)) continue;

            // Handle OR inside parentheses
            if (preg_match('/^\((.*)\)$/', $cond, $orM)) {
                $subConds = preg_split('/\s+OR\s+/i', $orM[1]);
                $orMatch = false;
                foreach ($subConds as $sc) {
                    if ($this->evaluateCondition($row, trim($sc))) {
                        $orMatch = true;
                        break;
                    }
                }
                if (!$orMatch) return false;
                continue;
            }

            if (!$this->evaluateCondition($row, $cond)) {
                return false;
            }
        }
        return true;
    }

    private function evaluateCondition(array $row, string $cond): bool {
        $cond = trim($cond);

        // Handle !=
        if (preg_match('/^`?(\w+)`?\s*!=\s*(.+)$/', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            return ($row[$col] ?? null) != $val;
        }
        // Handle like 'value'
        if (preg_match('/^`?(\w+)`?\s+LIKE\s+(.+)$/i', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            $pattern = str_replace('%', '.*', preg_quote($val, '/'));
            return (bool)preg_match("/^$pattern$/i", (string)($row[$col] ?? ''));
        }
        // Handle IS NULL / IS NOT NULL
        if (preg_match('/^`?(\w+)`?\s+IS\s+NOT\s+NULL$/i', $cond, $m)) {
            return ($row[$m[1]] ?? null) !== null;
        }
        if (preg_match('/^`?(\w+)`?\s+IS\s+NULL$/i', $cond, $m)) {
            return ($row[$m[1]] ?? null) === null;
        }
        // Handle IN (...)
        if (preg_match('/^`?(\w+)`?\s+IN\s+\(([^)]+)\)/i', $cond, $m)) {
            $col = $m[1];
            $vals = array_map(function($v) { return $this->unquote(trim($v)); }, explode(',', $m[2]));
            return in_array($row[$col] ?? null, $vals);
        }
        // Handle >=
        if (preg_match('/^`?(\w+)`?\s*>=\s*(.+)$/', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            return (float)($row[$col] ?? 0) >= (float)$val;
        }
        // Handle <=
        if (preg_match('/^`?(\w+)`?\s*<=\s*(.+)$/', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            return (float)($row[$col] ?? 0) <= (float)$val;
        }
        // Handle >
        if (preg_match('/^`?(\w+)`?\s*>\s*(.+)$/', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            return (float)($row[$col] ?? 0) > (float)$val;
        }
        // Handle <
        if (preg_match('/^`?(\w+)`?\s*<\s*(.+)$/', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            return (float)($row[$col] ?? 0) < (float)$val;
        }
        // Handle = (simple equality)
        if (preg_match('/^`?(\w+)`?\s*=\s*(.+)$/', $cond, $m)) {
            $col = $m[1];
            $val = $this->unquote(trim($m[2]));
            // String comparison
            return ($row[$col] ?? null) == $val;
        }

        return true; // Unknown condition, pass through
    }

    // ---- File I/O ----

    private function tableFile(string $table): string {
        return $this->dataDir . '/' . $table . '.json';
    }

    public function readTable(string $table): array {
        $file = $this->tableFile($table);
        if (!file_exists($file)) return [];
        $data = json_decode(file_get_contents($file), true);
        return is_array($data) ? $data : [];
    }

    public function writeTable(string $table, array $data): void {
        if ($this->inTransaction && !isset($this->snapshots[$table])) {
            $this->snapshots[$table] = $this->readTable($table);
        }
        file_put_contents($this->tableFile($table), json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
    }
}
