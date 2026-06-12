<?php

require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

$role = strtolower(trim((string) ($_SESSION['role'] ?? '')));
if (!isset($_SESSION['user_id']) || !in_array($role, ['customer', 'waiter', 'admin'], true)) {
    respond(['error' => 'Login required'], 401);
}

$stmt = $pdo->query(
    "SELECT rt.id, rt.table_number, rt.capacity, rt.position,
            CASE
              WHEN rt.status = 'reserved' THEN 'reserved'
              WHEN rt.assigned_waiter_id IS NOT NULL THEN 'occupied'
              ELSE rt.status
            END AS status,
            rt.image_path,
            (SELECT TIME_FORMAT(r.reserved_time, '%h:%i %p')
             FROM reservations r 
             WHERE r.table_id = rt.id 
               AND r.reserved_date = CURRENT_DATE
               AND r.status IN ('pending', 'approved', 'confirmed', 'completed')
             ORDER BY r.reserved_time DESC LIMIT 1) as next_reserved_time
     FROM restaurant_tables rt
     ORDER BY rt.table_number"
);

$tables = $stmt->fetchAll();
respond($tables ?: []);
