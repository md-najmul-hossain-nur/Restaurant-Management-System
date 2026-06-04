<?php
// api/assign_table.php
// Called by waiter.js — take/release table
// Method: POST JSON { table_id, action: 'take'|'release' }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('waiter');

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$tableId = (int) ($data['table_id'] ?? 0);
$action = ($data['action'] ?? '') === 'take' ? 'take' : 'release';
$userId = (int) ($_SESSION['user_id'] ?? 0);

if (!$tableId || !$userId) {
    respond(['error' => 'Invalid input'], 400);
}

try {
    if ($action === 'take') {
        $stmt = $pdo->prepare(
            "UPDATE restaurant_tables
             SET assigned_waiter_id = ?, status = 'occupied'
             WHERE id = ?
               AND status = 'available'
               AND (assigned_waiter_id IS NULL OR assigned_waiter_id = 0)"
        );
        $stmt->execute([$userId, $tableId]);
        if ($stmt->rowCount() < 1) {
            respond(['error' => 'Table not available'], 409);
        }
    } else {
        $futureApproved = $pdo->prepare(
            "SELECT COUNT(*) FROM reservations
             WHERE table_id = ?
               AND status IN ('approved', 'confirmed')
               AND CONCAT(reserved_date, ' ', reserved_end_time) >= NOW()"
        );
        $futureApproved->execute([$tableId]);
        $nextStatus = ((int) $futureApproved->fetchColumn() > 0) ? 'reserved' : 'available';

        $stmt = $pdo->prepare(
            "UPDATE restaurant_tables
             SET assigned_waiter_id = NULL,
                 status = ?,
                 active_customer_id = NULL,
                 reserved_customer_id = CASE WHEN ? = 'available' THEN NULL ELSE reserved_customer_id END
             WHERE id = ? AND assigned_waiter_id = ?"
        );
        $stmt->execute([$nextStatus, $nextStatus, $tableId, $userId]);
        if ($stmt->rowCount() < 1) {
            respond(['error' => 'Table not assigned to you'], 409);
        }
    }

    respond([
        'success' => true,
        'table_id' => $tableId,
        'action' => $action,
        'next_status' => $nextStatus ?? 'occupied',
    ]);
} catch (Exception $e) {
    respond(['error' => 'Failed: ' . $e->getMessage()], 500);
}
