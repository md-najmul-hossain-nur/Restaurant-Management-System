<?php

require_once '../PHP/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

ensureReservationsTable($pdo);

// Params: table_id (int), date (YYYY-MM-DD)
$tableId = isset($_GET['table_id']) ? (int) $_GET['table_id'] : 0;
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

if (!$tableId) {
    http_response_code(400);
    echo json_encode(['error' => 'table_id required']);
    exit;
}

// Return reserved time ranges for the table on the given date.
$stmt = $pdo->prepare(
    "SELECT
        TIME_FORMAT(reserved_time, '%H:%i') AS reserved_time,
        TIME_FORMAT(reserved_end_time, '%H:%i') AS reserved_end_time,
        status
     FROM reservations
     WHERE table_id = ?
       AND reserved_date = ?
       AND status NOT IN ('cancelled','rejected')
     ORDER BY reserved_time ASC"
);
$stmt->execute([$tableId, $date]);
$rows = $stmt->fetchAll();

$slots = array_map(function($r) {
    return [
        'start' => $r['reserved_time'],
        'end' => $r['reserved_end_time'],
        'status' => $r['status'],
        'label' => formatReservationRange($r['reserved_time'], $r['reserved_end_time']),
    ];
}, $rows);

$occupied = array_map(fn($slot) => $slot['start'], $slots);

echo json_encode([
    'date' => $date,
    'table_id' => $tableId,
    'occupied' => array_values(array_unique($occupied)),
    'slots' => $slots,
]);
