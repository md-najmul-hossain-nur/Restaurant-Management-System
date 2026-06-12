<?php

require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('customer');
ensureReservationsTable($pdo);

$customerId = (int) ($_SESSION['user_id'] ?? 0);
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    respond(['error' => 'Invalid booking request'], 400);
}

$tableId = (int) ($data['table_id'] ?? 0);
$guests  = (int) ($data['guests']   ?? 1);

if (!$tableId) {
    respond(['error' => 'No table selected'], 400);
}

// Check the table exists and is available
$stmt = $pdo->prepare(
    "SELECT id, capacity, status, assigned_waiter_id FROM restaurant_tables WHERE id = ?"
);
$stmt->execute([$tableId]);
$table = $stmt->fetch();

if (!$table) {
    respond(['error' => 'Table not found'], 404);
}
// We no longer block booking based on current table status or assigned_waiter_id.
// A table can be occupied NOW but available for a future reservation.
// The overlap check below handles time conflicts properly.
if ($guests > $table['capacity']) {
    respond(['error' => 'Too many guests for this table'], 400);
}

$date            = $data['date']             ?? date('Y-m-d');
$time            = normalizeReservationTime($data['time'] ?? '19:00');
$endTime         = normalizeReservationTime($data['end_time'] ?? '');
$specialRequests = $data['special_requests'] ?? '';

if (!$time) {
    respond(['error' => 'Please choose a valid start time'], 400);
}

if (!$endTime) {
    $endTime = (new DateTime($time))->modify('+1 hour')->format('H:i');
}

if ($endTime <= $time) {
    respond(['error' => 'End time must be after start time'], 400);
}

// Check for conflicting reservations (same table, same date, overlapping start/end time)
$conflictStmt = $pdo->prepare(
    "SELECT id, TIME_FORMAT(reserved_time, '%H:%i') AS reserved_time, TIME_FORMAT(reserved_end_time, '%H:%i') AS reserved_end_time
     FROM reservations
     WHERE table_id = ?
       AND reserved_date = ?
       AND status NOT IN ('cancelled','rejected')
       AND ? < TIME_FORMAT(reserved_end_time, '%H:%i')
       AND ? > TIME_FORMAT(reserved_time, '%H:%i')
     LIMIT 1"
);
$conflictStmt->execute([$tableId, $date, $time, $endTime]);
$conflict = $conflictStmt->fetch();

if ($conflict) {
    respond([
        'error' => 'Selected time overlaps an existing reservation: ' . formatReservationRange($conflict['reserved_time'], $conflict['reserved_end_time']) . '. Please choose another time.'
    ], 409);
}

try {
    $pdo->beginTransaction();

    // Insert reservation record (time-range based)
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (table_id, customer_id, reserved_date, reserved_time, reserved_end_time, guest_count, special_requests, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->execute([$tableId, $customerId, $date, $time, $endTime, $guests, $specialRequests]);
    $reservationId = $pdo->lastInsertId();
    $_SESSION['customer_reservation_ids'][] = (int) $reservationId;

    // Immediately reserve the table physically so waiters do not assign it to walk-ins
    $pdo->prepare(
        "UPDATE restaurant_tables
         SET status = CASE WHEN status = 'occupied' THEN 'occupied' ELSE 'reserved' END,
             reserved_customer_id = ?
         WHERE id = ?"
    )->execute([$customerId ?: null, $tableId]);

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
