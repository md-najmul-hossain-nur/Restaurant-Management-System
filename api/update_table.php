<?php
// api/update_table.php
// Update table details (capacity, position, optional image)
// Method: POST multipart/form-data

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('admin');

$tableId  = (int)($_POST['tableId'] ?? $_POST['table_id'] ?? 0);
$capacity = (int)($_POST['tableCapacity'] ?? $_POST['editTableCapacity'] ?? 0);
$position = trim($_POST['tablePosition'] ?? $_POST['editTablePosition'] ?? '');

if (!$tableId || !$capacity || $position === '') {
    respond(['error' => 'All fields are required'], 400);
}

$imagePath = null;
if (!empty($_FILES['tableImageFile']['name']) || !empty($_FILES['editTableImageFile']['name'])) {
    $fileKey = !empty($_FILES['tableImageFile']['name']) ? 'tableImageFile' : 'editTableImageFile';
    $uploadDir = __DIR__ . '/../uploads/tables/';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        respond(['error' => 'Unable to create upload folder'], 500);
    }

    $ext = pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION);
    $safeName = 'table_' . $tableId . '_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES[$fileKey]['tmp_name'], $uploadDir . $safeName)) {
        $imagePath = 'uploads/tables/' . $safeName;
    }
}

if ($imagePath) {
    $pdo->prepare('UPDATE restaurant_tables SET capacity = ?, position = ?, image_path = ? WHERE id = ?')
        ->execute([$capacity, $position, $imagePath, $tableId]);
} else {
    $pdo->prepare('UPDATE restaurant_tables SET capacity = ?, position = ? WHERE id = ?')
        ->execute([$capacity, $position, $tableId]);
}

respond([
    'success' => true,
    'table_id' => $tableId,
    'image_path' => $imagePath,
]);
