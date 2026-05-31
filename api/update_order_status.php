<?php
// api/update_order_status.php
// Called by chief.js (mark ready) and waiter.js (deliver)
// Method: POST JSON  { order_id, status }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin(); // both chief and waiter can call this

$data    = json_decode(file_get_contents('php://input'), true);
$orderId = (int)  ($data['order_id'] ?? 0);
$status  = trim($data['status']      ?? '');

$allowed = ['queued', 'in_progress', 'ready', 'served', 'cancelled'];
if (!$orderId || !in_array($status, $allowed))
    respond(['error' => 'Invalid input'], 400);

$pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $orderId]);
respond(['success' => true]);