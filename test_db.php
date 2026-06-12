<?php
require 'Php/db.php';
$stmt = $pdo->query('SELECT * FROM restaurant_tables WHERE id=3 OR table_number=3');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt = $pdo->query('SELECT * FROM reservations WHERE table_id IN (SELECT id FROM restaurant_tables WHERE table_number=3)');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt = $pdo->query('SELECT * FROM orders WHERE table_id IN (SELECT id FROM restaurant_tables WHERE table_number=3)');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
