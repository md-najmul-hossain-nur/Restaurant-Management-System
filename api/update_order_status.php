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

$allowed = ['queued', 'in_progress', 'ready', 'served', 'cancelled', 'paid'];
if (!$orderId || !in_array($status, $allowed))
    respond(['error' => 'Invalid input'], 400);

if (($_SESSION['role'] ?? '') === 'waiter') {
    $pdo->prepare('UPDATE orders SET status = ?, waiter_id = COALESCE(waiter_id, ?) WHERE id = ?')
        ->execute([$status, $_SESSION['user_id'], $orderId]);
} else {
    $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $orderId]);
}
respond(['success' => true]);
