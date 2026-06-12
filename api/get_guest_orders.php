<?php
require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

requireLogin();
if (($_SESSION['role'] ?? '') !== 'admin') {
    respond(['error' => 'Forbidden'], 403);
}

try {
    // Guest delivery orders (customer_id IS NULL); the admin assigns a waiter.
    // Logged-in customer deliveries are claimed by waiters from their own pool instead.
    $stmt = $pdo->prepare("
        SELECT o.id, o.guest_name, o.guest_phone, o.delivery_address, o.status, o.total_amount, o.created_at, o.waiter_id
        FROM orders o
        WHERE o.customer_id IS NULL
        ORDER BY o.created_at DESC
    ");
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all waiters
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE role = 'waiter' AND approved = 1");
    $stmt->execute();
    $waiters = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch items for each order
    foreach ($orders as &$order) {
        $stmt = $pdo->prepare("SELECT name, quantity FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['success' => true, 'orders' => $orders, 'waiters' => $waiters]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
