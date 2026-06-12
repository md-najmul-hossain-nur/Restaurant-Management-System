<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'customer') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$customerId = (int) $_SESSION['user_id'];

try {
    // Auto-claim any unassigned active orders placed by waiters for tables currently assigned to this customer
    $updateStmt = $pdo->prepare(
        "UPDATE orders 
         SET customer_id = ? 
         WHERE customer_id IS NULL 
           AND status != 'paid' 
           AND table_id IN (
               SELECT id FROM restaurant_tables 
               WHERE active_customer_id = ? OR reserved_customer_id = ?
           )"
    );
    $updateStmt->execute([$customerId, $customerId, $customerId]);

    // Fetch orders for this customer (or for a table they are currently sitting at / reserved)
    $stmt = $pdo->prepare(
        "SELECT o.id, o.status, o.total_amount, o.created_at, t.table_number 
         FROM orders o
         LEFT JOIN restaurant_tables t ON o.table_id = t.id
         WHERE o.customer_id = ?
            OR (o.table_id IS NOT NULL AND t.active_customer_id = ? AND o.status != 'paid')
            OR (o.table_id IS NOT NULL AND t.reserved_customer_id = ? AND o.status != 'paid')
         ORDER BY o.created_at DESC"
    );
    $stmt->execute([$customerId, $customerId, $customerId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$orders) {
        echo json_encode([]);
        exit;
    }

    $orderIds = array_column($orders, 'id');
    $placeholders = str_repeat('?,', count($orderIds) - 1) . '?';
    
    // Fetch items for these orders
    $itemsStmt = $pdo->prepare(
        "SELECT order_id, name, price, quantity, subtotal 
         FROM order_items 
         WHERE order_id IN ($placeholders)"
    );
    $itemsStmt->execute($orderIds);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Group items by order_id
    $itemsByOrder = [];
    foreach ($items as $item) {
        $itemsByOrder[$item['order_id']][] = $item;
    }

    // Attach items to orders
    foreach ($orders as &$order) {
        $order['items'] = $itemsByOrder[$order['id']] ?? [];
        $order['status_index'] = match($order['status']) {
            'queued' => 1,
            'in_progress' => 2,
            'ready' => 3,
            'served' => 4,
            default => 0
        };
    }

    echo json_encode($orders);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
