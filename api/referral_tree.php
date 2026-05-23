<?php
/**
 * GET /api/referral/tree - Returns hierarchical downline tree
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/functions.php';

$user = requireLogin();
$db = getDB();

$tree = getDownlineTree($db, (int)$user['id'], 5);
echo json_encode(['success' => true, 'referral_tree' => $tree]);
