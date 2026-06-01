<?php

require_once __DIR__ . '/../Php/db.php';
require_once '../PHP/bootstrap.php';
header('Content-Type: application/json');

requireLogin('admin');

 $stmt = $pdo->query(
     "SELECT id, name, email, approval_status, approval_decided_at, created_at, avatar_path
      FROM users
      WHERE role = 'customer'
      ORDER BY created_at DESC"
);

$customers = $stmt->fetchAll() ?: [];
$pending = [];
$approved = [];

foreach ($customers as $customer) {
    if (($customer['approval_status'] ?? 'pending') === 'approved') {
        $approved[] = $customer;
    } else {
        $pending[] = $customer;
    }
}

respond([
    'pending' => $pending,
    'approved' => $approved,
]);
