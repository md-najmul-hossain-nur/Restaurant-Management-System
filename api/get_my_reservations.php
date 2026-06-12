<?php

require_once __DIR__ . '/../PHP/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('customer');
ensureReservationsTable($pdo);

$customerId = (int) ($_SESSION['user_id'] ?? 0);
$knownReservationIds = [];

if (!empty($_SESSION['customer_reservation_ids']) && is_array($_SESSION['customer_reservation_ids'])) {
    $knownReservationIds = array_merge($knownReservationIds, $_SESSION['customer_reservation_ids']);
}

if (!empty($_GET['ids'])) {
    $knownReservationIds = array_merge($knownReservationIds, explode(',', (string) $_GET['ids']));
}

$knownReservationIds = array_values(array_unique(array_filter(array_map('intval', $knownReservationIds))));

if ($knownReservationIds) {
    $placeholders = implode(',', array_fill(0, count($knownReservationIds), '?'));
    $repairStmt = $pdo->prepare(
        "UPDATE reservations
         SET customer_id = ?
         WHERE customer_id IS NULL
           AND id IN ($placeholders)"
    );
    $repairStmt->execute(array_merge([$customerId], $knownReservationIds));
    $_SESSION['customer_reservation_ids'] = $knownReservationIds;
}

$knownTableId = (int) ($_GET['table_id'] ?? 0);
if ($knownTableId > 0) {
    $repairByTable = $pdo->prepare(
        "UPDATE reservations
         SET customer_id = ?
         WHERE customer_id IS NULL
           AND table_id = ?
           AND status IN ('pending', 'approved', 'confirmed')
         ORDER BY created_at DESC, id DESC
         LIMIT 1"
    );
    $repairByTable->execute([$customerId, $knownTableId]);
}

$stmt = $pdo->prepare(
    "SELECT
        r.id,
        r.table_id,
        rt.table_number,
        rt.capacity,
        rt.position,
        r.reserved_date,
        TIME_FORMAT(r.reserved_time, '%H:%i') AS reserved_time,
        TIME_FORMAT(r.reserved_end_time, '%H:%i') AS reserved_end_time,
        r.guest_count,
        r.special_requests,
        r.status,
        r.created_at
     FROM reservations r
     JOIN restaurant_tables rt ON rt.id = r.table_id
     WHERE r.customer_id = ?
       AND r.status IN ('pending', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled')
     ORDER BY FIELD(r.status, 'approved', 'confirmed', 'pending', 'completed', 'rejected', 'cancelled'),
              r.reserved_date DESC,
              r.reserved_time DESC,
              r.id DESC"
);
$stmt->execute([$customerId]);

respond($stmt->fetchAll() ?: []);
