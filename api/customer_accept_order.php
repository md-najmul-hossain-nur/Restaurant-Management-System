<?php
// api/customer_accept_order.php
// Called by customer_orders.js when a customer accepts a ready order
// Method: POST JSON { order_id }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('customer');

$data = json_decode(file_get_contents('php://input'), true);
$orderId = (int) ($data['order_id'] ?? 0);
$customerId = (int) $_SESSION['user_id'];

if (!$orderId) {
    respond(['error' => 'Invalid order ID'], 400);
}

try {
    // Only allow customer to accept their own order if it's currently 'ready' or 'delivered'
    $stmt = $pdo->prepare("UPDATE orders SET status = 'served' WHERE id = ? AND customer_id = ? AND status IN ('ready', 'delivered')");
    $stmt->execute([$orderId, $customerId]);

    if ($stmt->rowCount() > 0) {
        respond(['success' => true]);
    } else {
        respond(['error' => 'Could not accept order. Either it was not found, not ready, or you do not have permission.'], 403);
    }
} catch (Exception $e) {
    respond(['error' => 'Database error: ' . $e->getMessage()], 500);
}
