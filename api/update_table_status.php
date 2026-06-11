<?php
// api/update_table_status.php
// Called by admin.js when status dropdown changes
// Method: POST JSON  { table_id, status }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('admin');

$data    = json_decode(file_get_contents('php://input'), true);
$tableId = (int)  ($data['table_id'] ?? 0);
$status  = trim($data['status'] ?? '');
$delete  = !empty($data['_delete']);

if (!$tableId) {
    respond(['error' => 'Invalid input'], 400);
}

if ($delete) {
    $pdo->prepare('DELETE FROM restaurant_tables WHERE id = ?')->execute([$tableId]);
    respond(['success' => true, 'deleted' => true]);
}

if (!in_array($status, ['available', 'reserved', 'occupied'], true)) {
    respond(['error' => 'Invalid input'], 400);
}

$pdo->prepare('UPDATE restaurant_tables SET status = ? WHERE id = ?')
    ->execute([$status, $tableId]);

respond(['success' => true]);
