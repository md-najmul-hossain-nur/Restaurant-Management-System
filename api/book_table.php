<?php

require_once '../PHP/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin();
ensureReservationsTable($pdo);

$userId = (int) ($_SESSION['user_id'] ?? 0);
$roleStmt = $pdo->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
$roleStmt->execute([$userId]);
$role = strtolower(trim((string) $roleStmt->fetchColumn()));
$sessionRole = strtolower(trim((string) ($_SESSION['role'] ?? '')));
if ($role === '' && $sessionRole !== '') {
    $role = $sessionRole;
}
if ($role !== 'customer') {
    respond(['error' => 'Access denied'], 403);
}
$_SESSION['role'] = $role;

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
if ($table['status'] === 'occupied') {
    respond(['error' => 'Table is currently occupied'], 409);
}
if ($guests > $table['capacity']) {
    respond(['error' => 'Too many guests for this table'], 400);
}

$date            = $data['date']             ?? date('Y-m-d');
$time            = $data['time']             ?? '19:00';
$specialRequests = $data['special_requests'] ?? '';

// Get the logged-in customer's ID from session
$customerId = $userId ?: null;

// Check for conflicting reservations (same table, same date & time)
$conflictStmt = $pdo->prepare(
    "SELECT id FROM reservations WHERE table_id = ? AND reserved_date = ? AND TIME_FORMAT(reserved_time, '%H:%i') = ? AND status NOT IN ('cancelled','rejected') LIMIT 1"
);
$conflictStmt->execute([$tableId, $date, $time]);
$conflict = $conflictStmt->fetch();

if ($conflict) {
    respond(['error' => 'Selected time slot is already occupied for this table. Please choose another time.'], 409);
}

try {
    $pdo->beginTransaction();

    // Insert reservation record (time-based)
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (table_id, customer_id, reserved_date, reserved_time, guest_count, special_requests, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->execute([$tableId, $customerId, $date, $time, $guests, $specialRequests]);
    $reservationId = $pdo->lastInsertId();

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
