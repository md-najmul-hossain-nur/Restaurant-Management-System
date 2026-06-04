<?php

require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

$role = strtolower(trim((string) ($_SESSION['role'] ?? '')));
if (!isset($_SESSION['user_id']) || !in_array($role, ['customer', 'waiter', 'admin'], true)) {
    respond(['error' => 'Login required'], 401);
}

$stmt = $pdo->query(
    "SELECT id, table_number, capacity, position,
            CASE
              WHEN assigned_waiter_id IS NOT NULL THEN 'occupied'
              ELSE status
            END AS status,
            image_path
     FROM restaurant_tables
     ORDER BY table_number"
);

$tables = $stmt->fetchAll();
respond($tables ?: []);
