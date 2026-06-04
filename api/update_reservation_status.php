<?php

require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('admin');
ensureReservationsTable($pdo);

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$reservationId = (int) ($data['reservation_id'] ?? 0);
$status = $data['status'] ?? '';

if (!$reservationId || !in_array($status, ['approved', 'rejected', 'cancelled'], true)) {
    respond(['error' => 'Invalid reservation update'], 400);
}

$stmt = $pdo->prepare("SELECT id, table_id, customer_id FROM reservations WHERE id = ? LIMIT 1");
$stmt->execute([$reservationId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    respond(['error' => 'Reservation not found'], 404);
}

try {
    $pdo->beginTransaction();

    $pdo->prepare("UPDATE reservations SET status = ? WHERE id = ?")
        ->execute([$status, $reservationId]);

    if ($status === 'approved') {
        $pdo->prepare(
            "UPDATE restaurant_tables
             SET status = CASE WHEN status = 'occupied' THEN 'occupied' ELSE 'reserved' END,
                 reserved_customer_id = ?
             WHERE id = ?"
        )->execute([$reservation['customer_id'] ?: null, $reservation['table_id']]);
    } else {
        $active = $pdo->prepare(
            "SELECT COUNT(*) FROM reservations
             WHERE table_id = ?
               AND status IN ('pending', 'approved')
               AND id <> ?"
        );
        $active->execute([$reservation['table_id'], $reservationId]);

        $assigned = $pdo->prepare(
            "SELECT assigned_waiter_id FROM restaurant_tables WHERE id = ?"
        );
        $assigned->execute([$reservation['table_id']]);
        $assignedWaiter = $assigned->fetchColumn();

        if ((int) $active->fetchColumn() === 0 && empty($assignedWaiter)) {
            $pdo->prepare("UPDATE restaurant_tables SET status = 'available', reserved_customer_id = NULL WHERE id = ?")
                ->execute([$reservation['table_id']]);
        }
    }

    $pdo->commit();
    respond(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => 'Could not update reservation'], 500);
}

