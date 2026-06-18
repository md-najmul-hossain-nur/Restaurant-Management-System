<?php
require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

requireLogin();
if (($_SESSION['role'] ?? '') !== 'waiter') {
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

try {
    // Get delivery orders (table_id IS NULL) that are 'ready' but have no waiter assigned
    $stmt = $pdo->prepare("
        SELECT o.id, o.customer_id, o.guest_name, o.guest_phone, o.delivery_address, o.status, o.total_amount, o.created_at
        FROM orders o
        WHERE o.table_id IS NULL AND o.waiter_id IS NULL AND o.status = 'ready'
        ORDER BY o.created_at ASC
    ");
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$order) {
        $stmt = $pdo->prepare("SELECT name, quantity FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['success' => true, 'orders' => $orders]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
