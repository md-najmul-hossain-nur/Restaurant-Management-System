<?php

require_once '../PHP/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('customer');
ensureReservationsTable($pdo);

$customerId = (int) ($_SESSION['user_id'] ?? 0);

$stmt = $pdo->prepare(
    "SELECT
        r.id,
        r.table_id,
        rt.table_number,
        rt.capacity,
        rt.position,
        r.reserved_date,
        TIME_FORMAT(r.reserved_time, '%H:%i') AS reserved_time,
        r.guest_count,
        r.special_requests,
        r.status,
        r.created_at
     FROM reservations r
     JOIN restaurant_tables rt ON rt.id = r.table_id
     WHERE r.customer_id = ?
       AND r.status IN ('pending', 'approved')
     ORDER BY r.reserved_date DESC, r.reserved_time DESC, r.id DESC"
);
$stmt->execute([$customerId]);

respond($stmt->fetchAll() ?: []);
