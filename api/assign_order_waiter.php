<?php
require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

requireLogin();
if (($_SESSION['role'] ?? '') !== 'admin') {
    respond(['error' => 'Forbidden'], 403);
}

$data = json_decode(file_get_contents('php://input'), true);
$orderId = $data['order_id'] ?? null;
$waiterId = $data['waiter_id'] ?? null;

if (!$orderId || !$waiterId) {
    echo json_encode(['error' => 'Missing order_id or waiter_id']);
    exit;
}

try {
    // Assign waiter and make sure status is 'queued' so it appears for the waiter/chef
    $stmt = $pdo->prepare("UPDATE orders SET waiter_id = ? WHERE id = ?");
    $stmt->execute([$waiterId, $orderId]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Order not found or no change made']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
