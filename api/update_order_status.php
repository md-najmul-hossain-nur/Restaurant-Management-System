<?php
// api/update_order_status.php
// Called by chief.js (mark ready) and waiter.js (deliver)
// Method: POST JSON  { order_id, status }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin(); // both chief and waiter can call this
if (!in_array($_SESSION['role'] ?? '', ['chief', 'waiter', 'admin'])) {
    respond(['error' => 'Forbidden'], 403);
}

$data    = json_decode(file_get_contents('php://input'), true);
$orderId = (int)  ($data['order_id'] ?? 0);
$status  = trim($data['status']      ?? '');

error_log("update_order_status called: user=" . ($_SESSION['user_id'] ?? 'none') . " role=" . ($_SESSION['role'] ?? 'none') . " order=" . $orderId . " status=" . $status);

$allowed = ['queued', 'in_progress', 'ready', 'delivered', 'served', 'cancelled', 'paid'];
if (!$orderId || !in_array($status, $allowed))
    respond(['error' => 'Invalid input'], 400);

if (($_SESSION['role'] ?? '') === 'waiter') {
    $pdo->prepare('UPDATE orders SET status = ?, waiter_id = COALESCE(waiter_id, ?) WHERE id = ?')
        ->execute([$status, $_SESSION['user_id'], $orderId]);
} else {
    $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $orderId]);
}
error_log("update_order_status success for order " . $orderId);
respond(['success' => true]);
