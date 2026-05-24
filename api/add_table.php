<?php
// api/add_table.php
// Called by admin.js — Add Table form
// Method: POST multipart/form-data

if (session_status() === PHP_SESSION_NONE) session_start();
require_once '../PHP/db.php';
requireLogin('admin');

$tableNumber = (int) ($_POST['tableNumber']  ?? 0);
$capacity    = (int) ($_POST['tableCapacity'] ?? 0);
$position    = trim($_POST['tablePosition']   ?? '');

if (!$tableNumber || !$capacity || !$position)
    respond(['error' => 'All fields are required'], 400);

// Check table number not already taken
$check = $pdo->prepare('SELECT id FROM restaurant_tables WHERE table_number = ?');
$check->execute([$tableNumber]);
if ($check->fetch()) respond(['error' => 'Table number already exists'], 409);

// Optional image upload
$imagePath = null;
if (!empty($_FILES['tableImageFile']['name'])) {
    $uploadDir = '../uploads/tables/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $ext      = pathinfo($_FILES['tableImageFile']['name'], PATHINFO_EXTENSION);
    $safeName = 'table_' . $tableNumber . '_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES['tableImageFile']['tmp_name'], $uploadDir . $safeName))
        $imagePath = $uploadDir . $safeName;
}

$pdo->prepare('INSERT INTO restaurant_tables (table_number, capacity, position, image_path) VALUES (?, ?, ?, ?)')
    ->execute([$tableNumber, $capacity, $position, $imagePath]);

respond(['success' => true, 'table_id' => $pdo->lastInsertId()]);