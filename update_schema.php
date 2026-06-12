<?php
require 'Php/db.php';
try {
    $pdo->exec('ALTER TABLE orders ADD COLUMN delivery_address VARCHAR(255) NULL');
    echo "Added delivery_address\n";
} catch (Exception $e) {
    echo "delivery_address may already exist: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE orders MODIFY COLUMN status ENUM('queued','in_progress','ready','delivered','served','cancelled','paid') NOT NULL DEFAULT 'queued'");
    echo "Modified status ENUM\n";
} catch (Exception $e) {
    echo "Failed to modify ENUM: " . $e->getMessage() . "\n";
}
