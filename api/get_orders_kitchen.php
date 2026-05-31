<?php
// api/get_orders_kitchen.php
// Called by chief.js to load active kitchen orders
// Returns orders that are queued or in_progress
// Method: GET
 
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('chief');
 
$stmt = $pdo->query(
    "SELECT o.id, o.status, o.total_amount, o.created_at,
            rt.table_number
     FROM orders o
     LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
     WHERE o.status IN ('queued','in_progress','ready')
     ORDER BY o.created_at ASC"
);
$orders = $stmt->fetchAll();
 
foreach ($orders as &$order) {
    $items = $pdo->prepare('SELECT name, quantity FROM order_items WHERE order_id = ?');
    $items->execute([$order['id']]);
    $order['items'] = $items->fetchAll();
}
respond($orders ?: []);
 