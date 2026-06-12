<?php

require_once '../Php/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('customer');
ensureReservationsTable($pdo);

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$reservationId = (int) ($data['reservation_id'] ?? 0);
$customerId = (int) ($_SESSION['user_id'] ?? 0);

if (!$reservationId) {
    respond(['error' => 'Reservation not found'], 400);
}

$stmt = $pdo->prepare(
    "SELECT id, table_id, status
     FROM reservations
     WHERE id = ? AND customer_id = ?
     LIMIT 1"
);
$stmt->execute([$reservationId, $customerId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    respond(['error' => 'Reservation not found'], 404);
}

if (!in_array($reservation['status'], ['pending', 'approved', 'confirmed'], true)) {
    respond(['error' => 'This reservation cannot be cancelled'], 400);
}

try {
    $pdo->beginTransaction();

    $pdo->prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?")
        ->execute([$reservationId]);

    $active = $pdo->prepare(
        "SELECT COUNT(*) FROM reservations
         WHERE table_id = ?
           AND status IN ('pending', 'approved', 'confirmed')
           AND id <> ?"
    );
    $active->execute([$reservation['table_id'], $reservationId]);

    if ((int) $active->fetchColumn() === 0) {
        $pdo->prepare("UPDATE restaurant_tables SET status = 'available' WHERE id = ?")
            ->execute([$reservation['table_id']]);
    }

    $pdo->commit();
    respond(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => 'Could not cancel reservation'], 500);
}
