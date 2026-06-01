<?php

require_once '../PHP/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

// Params: table_id (int), date (YYYY-MM-DD)
$tableId = isset($_GET['table_id']) ? (int) $_GET['table_id'] : 0;
$date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

if (!$tableId) {
    http_response_code(400);
    echo json_encode(['error' => 'table_id required']);
    exit;
}

// Return list of reserved times for the table on the given date
$stmt = $pdo->prepare("SELECT reserved_time, status FROM reservations WHERE table_id = ? AND reserved_date = ? AND status NOT IN ('cancelled','rejected')");
$stmt->execute([$tableId, $date]);
$rows = $stmt->fetchAll();

// Normalize TIME values to HH:MM for frontend comparisons
$occupied = array_map(function($r){
    $t = $r['reserved_time'];
    return is_string($t) ? substr($t,0,5) : $t;
}, $rows);

echo json_encode(['date' => $date, 'table_id' => $tableId, 'occupied' => array_values(array_unique($occupied))]);
