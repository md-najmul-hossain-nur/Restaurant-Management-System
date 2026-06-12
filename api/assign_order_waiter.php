<?php
require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

requireLogin();
if (($_SESSION['role'] ?? '') !== 'admin') {
    respond(['error' => 'Forbidden'], 403);
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$orderId = (int) ($data['order_id'] ?? 0);
$waiterId = (int) ($data['waiter_id'] ?? 0);

if (!$orderId || !$waiterId) {
    respond(['error' => 'Missing order_id or waiter_id'], 400);
}

try {
    // Confirm the order exists (do not rely on UPDATE rowCount — MySQL
    // returns 0 affected rows when the waiter is already assigned).
    $check = $pdo->prepare("SELECT id FROM orders WHERE id = ?");
    $check->execute([$orderId]);
    if (!$check->fetch()) {
        respond(['error' => 'Order not found'], 404);
    }

    // Confirm the waiter is a real waiter account.
    $waiterCheck = $pdo->prepare("SELECT id FROM users WHERE id = ? AND role = 'waiter'");
    $waiterCheck->execute([$waiterId]);
    if (!$waiterCheck->fetch()) {
        respond(['error' => 'Invalid waiter selected'], 400);
    }

    $pdo->prepare("UPDATE orders SET waiter_id = ? WHERE id = ?")
        ->execute([$waiterId, $orderId]);

    respond(['success' => true]);
} catch (Exception $e) {
    respond(['error' => $e->getMessage()], 500);
}
