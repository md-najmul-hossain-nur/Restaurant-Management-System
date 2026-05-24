<?php
/**
 * api/get_orders.php
 * Returns all orders for the logged-in customer with items
 */

require_once '../PHP/db.php';
header('Content-Type: application/json');

requireLogin();

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare(
    "SELECT
        o.id,
        o.status,
        o.total_amount,
        o.created_at,
        rt.table_number
     FROM orders o
     LEFT JOIN restaurant_tables rt ON o.table_id = rt.id
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC"
);
$stmt->execute([$userId]);
$orders = $stmt->fetchAll();

// Attach items to each order
foreach ($orders as &$order) {
    $itemStmt = $pdo->prepare(
        "SELECT name, price, quantity, subtotal
         FROM order_items
         WHERE order_id = ?"
    );
    $itemStmt->execute([$order['id']]);
    $order['items'] = $itemStmt->fetchAll();
}

respond($orders ?: []);