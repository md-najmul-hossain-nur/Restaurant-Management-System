<?php

require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/reservation_helpers.php';
header('Content-Type: application/json');

requireLogin('admin');
ensureReservationsTable($pdo);

$stmt = $pdo->query(
    "SELECT
        r.id,
        rt.table_number,
        u.name AS customer_name,
        u.email AS customer_email,
        r.reserved_date,
        TIME_FORMAT(r.reserved_time, '%H:%i') AS reserved_time,
        TIME_FORMAT(r.reserved_end_time, '%H:%i') AS reserved_end_time,
        r.guest_count,
        r.special_requests,
        r.status,
        r.created_at
     FROM reservations r
     JOIN restaurant_tables rt ON rt.id = r.table_id
     LEFT JOIN users u ON u.id = r.customer_id
     ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected', 'cancelled'),
              r.reserved_date DESC,
              r.reserved_time DESC"
);

respond($stmt->fetchAll() ?: []);

