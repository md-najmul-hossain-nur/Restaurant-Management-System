<?php
// test_mark_ready.php
session_start();
$_SESSION['user_id'] = 1; // Assuming user 1 is admin/chief
$_SESSION['role'] = 'chief';
require_once 'Php/db.php';

// Create a dummy order
$pdo->exec("INSERT INTO orders (status, total_prep_time) VALUES ('in_progress', 30)");
$orderId = $pdo->lastInsertId();

echo "Created order $orderId\n";

$ch = curl_init('http://localhost/Restaurant-Management-System/api/update_order_status.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['order_id' => $orderId, 'status' => 'ready']));
// Set the session cookie so the API request is authenticated
$sessionName = session_name();
$sessionId = session_id();
session_write_close();
curl_setopt($ch, CURLOPT_COOKIE, "$sessionName=$sessionId");

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpcode\n";
echo "Response: $response\n";

// Verify DB
$stmt = $pdo->query("SELECT status FROM orders WHERE id = $orderId");
echo "DB Status: " . $stmt->fetchColumn() . "\n";
