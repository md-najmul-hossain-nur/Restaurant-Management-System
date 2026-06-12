<?php
require 'Php/db.php';
$stmt = $pdo->query('SHOW COLUMNS FROM orders');
print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
