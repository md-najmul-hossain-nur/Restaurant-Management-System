<?php
// api/chef_pick_order.php
// Called by chief.js when a chef picks an order
// Method: POST JSON { order_id }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('chief');

$data = json_decode(file_get_contents('php://input'), true);
$orderId = (int) ($data['order_id'] ?? 0);
error_log("chef_pick_order.php called with order_id: $orderId, user_id: " . $_SESSION['user_id']);

if (!$orderId) {
    error_log("Invalid order ID");
    respond(['error' => 'Invalid order ID'], 400);
}

try {
    $pdo->beginTransaction();

    // Check if the order is already picked
    $stmt = $pdo->prepare("SELECT chef_id FROM orders WHERE id = ? FOR UPDATE");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        error_log("Order not found: $orderId");
        respond(['error' => 'Order not found'], 404);
    }

    if ($order['chef_id'] !== null) {
        $pdo->rollBack();
        error_log("Order $orderId is already picked by " . $order['chef_id']);
        respond(['error' => 'Order is already picked by another chef'], 409);
    }

    // Pick the order
    $updateStmt = $pdo->prepare("UPDATE orders SET chef_id = ?, status = 'in_progress' WHERE id = ?");
    $res = $updateStmt->execute([$_SESSION['user_id'], $orderId]);
    error_log("Update result: " . ($res ? 'success' : 'fail'));

    $pdo->commit();
    error_log("Order $orderId picked successfully by " . $_SESSION['user_id']);
    respond(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    error_log("Exception in chef_pick_order: " . $e->getMessage());
    respond(['error' => 'Failed to pick order: ' . $e->getMessage()], 500);
}
