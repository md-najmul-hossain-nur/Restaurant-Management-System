<?php

require_once __DIR__ . '/../Php/db.php';
require_once '../Php/bootstrap.php';
header('Content-Type: application/json');

requireLogin('admin');

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$customerId = (int) ($data['customer_id'] ?? 0);
$status = $data['status'] ?? '';

if (!$customerId || !in_array($status, ['approved', 'rejected'], true)) {
    respond(['error' => 'Invalid customer approval request'], 400);
}

$stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$customerId]);
$customer = $stmt->fetch();

if (!$customer || ($customer['role'] ?? '') !== 'customer') {
    respond(['error' => 'Customer not found'], 404);
}

$pdo->prepare(
    'UPDATE users SET approval_status = ?, approval_decided_at = NOW() WHERE id = ?'
)->execute([$status, $customerId]);

respond(['success' => true, 'status' => $status]);
