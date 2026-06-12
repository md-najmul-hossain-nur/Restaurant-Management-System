<?php
require 'Php/db.php';
$stmt = $pdo->query('SELECT * FROM reservations ORDER BY id DESC LIMIT 5');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
