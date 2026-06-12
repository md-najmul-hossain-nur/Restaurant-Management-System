<?php
// api/waiter_place_order.html
// Called by waiter.js when waiter places an order for a table
// Method: POST JSON

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('waiter');

$waiterId = $_SESSION['user_id'];
$data     = json_decode(file_get_contents('php://input'), true);
$tableId  = (int) ($data['table_id'] ?? 0);
$items    = $data['items'] ?? [];

if (!$tableId)   respond(['error' => 'No table selected'], 400);
if (!$items)     respond(['error' => 'No items selected'], 400);

$tableCheck = $pdo->prepare(
    "SELECT assigned_waiter_id, active_customer_id, reserved_customer_id FROM restaurant_tables WHERE id = ?"
);
$tableCheck->execute([$tableId]);
$tableInfo = $tableCheck->fetch();
if (!$tableInfo || (int) $tableInfo['assigned_waiter_id'] !== (int) $waiterId) {
    respond(['error' => 'Table is not assigned to you'], 403);
}
$customerId = $tableInfo['active_customer_id'] ?: $tableInfo['reserved_customer_id'] ?: null;

$total = 0;
foreach ($items as $item) $total += $item['price'] * $item['quantity'];
$grandTotal = round($total * 1.10, 2); // 10% tax
$paymentMethod = $data['payment_method'] ?? 'Cash';

$pdo->beginTransaction();
try {
    $pdo->prepare(
        'INSERT INTO orders (customer_id, table_id, waiter_id, status, total_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$customerId, $tableId, $waiterId, 'queued', $grandTotal, $paymentMethod]);
    $orderId = $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, recipe_id, name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
    );
    foreach ($items as $item) {
        $sub = round($item['price'] * $item['quantity'], 2);
        $itemStmt->execute([
            $orderId,
            $item['recipe_id'] ?? null,
            $item['name'],
            $item['price'],
            $item['quantity'],
            $sub
        ]);
    }

    $pdo->prepare("UPDATE restaurant_tables SET status='occupied' WHERE id=?")->execute([$tableId]);
    $pdo->commit();
    respond(['success' => true, 'order_id' => $orderId]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => $e->getMessage()], 500);
}
