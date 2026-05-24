<?php

require_once '../PHP/db.php';
header('Content-Type: application/json');

$stmt = $pdo->query(
    "SELECT id, table_number, capacity, position, status, image_path
     FROM restaurant_tables
     ORDER BY table_number"
);

$tables = $stmt->fetchAll();
respond($tables ?: []);