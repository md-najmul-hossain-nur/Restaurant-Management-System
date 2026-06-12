<?php
require_once __DIR__ . '/Php/db.php';

// Simulate Waiter placing an order for a table
$tableId = 1;
$waiterId = 1; // Assuming waiter ID 1

$tableCheck = $pdo->prepare(
    "SELECT assigned_waiter_id, active_customer_id, reserved_customer_id FROM restaurant_tables WHERE id = ?"
);
$tableCheck->execute([$tableId]);
$tableInfo = $tableCheck->fetch();

echo "Table Info:\n";
print_r($tableInfo);

$customerId = $tableInfo['active_customer_id'] ?: $tableInfo['reserved_customer_id'] ?: null;
echo "Customer ID determined as: " . var_export($customerId, true) . "\n";
