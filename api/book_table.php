<?php

require_once '../PHP/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('customer');
ensureReservationsTable($pdo);

$data = json_decode(file_get_contents('php://input'), true);

$tableId = (int) ($data['table_id'] ?? 0);
$guests  = (int) ($data['guests']   ?? 1);

if (!$tableId) {
    respond(['error' => 'No table selected'], 400);
}

// Check the table exists and is available
$stmt = $pdo->prepare(
    "SELECT id, capacity, status FROM restaurant_tables WHERE id = ?"
);
$stmt->execute([$tableId]);
$table = $stmt->fetch();

if (!$table) {
    respond(['error' => 'Table not found'], 404);
}
if ($table['status'] !== 'available') {
    respond(['error' => 'Table is not available'], 409);
}
if ($guests > $table['capacity']) {
    respond(['error' => 'Too many guests for this table'], 400);
}

$date            = $data['date']             ?? date('Y-m-d');
$time            = $data['time']             ?? '19:00';
$specialRequests = $data['special_requests'] ?? '';

// Get the logged-in customer's ID from session
$customerId = $_SESSION['user_id'] ?? null;

try {
    $pdo->beginTransaction();

    // 1. Insert reservation record
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (table_id, customer_id, reserved_date, reserved_time, guest_count, special_requests, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->execute([$tableId, $customerId, $date, $time, $guests, $specialRequests]);
    $reservationId = $pdo->lastInsertId();

    // 2. Mark table as reserved
    $pdo->prepare("UPDATE restaurant_tables SET status = 'reserved' WHERE id = ?")
        ->execute([$tableId]);

    $pdo->commit();

    respond([
        'success'        => true,
        'reservation_id' => $reservationId,
        'message'        => 'Table reserved successfully!'
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => 'Reservation failed: ' . $e->getMessage()], 500);
}
