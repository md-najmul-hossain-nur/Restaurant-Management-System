<?php
// api/update_menu_item.php
// Called by admin.js — Edit Menu Item form
// Method: POST multipart/form-data

if (session_status() === PHP_SESSION_NONE) session_start();
require_once '../PHP/db.php';
requireLogin('admin');

$recipeId = (int)  ($_POST['recipe_id']    ?? 0);
$name     = trim($_POST['editMenuName']    ?? '');
$price    = (float)($_POST['editMenuPrice'] ?? 0);
$desc     = trim($_POST['editMenuDesc']    ?? '');
$category = trim($_POST['editMenuTag']     ?? '');

if (!$recipeId || !$name || !$price || !$category)
    respond(['error' => 'Required fields missing'], 400);

// Optional image upload
$imagePath = null;
if (!empty($_FILES['editMenuImage']['name'])) {
    $uploadDir = '../uploads/menu/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $ext      = pathinfo($_FILES['editMenuImage']['name'], PATHINFO_EXTENSION);
    $safeName = 'menu_' . $recipeId . '_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES['editMenuImage']['tmp_name'], $uploadDir . $safeName))
        $imagePath = $uploadDir . $safeName;
}

if ($imagePath) {
    $pdo->prepare('UPDATE recipes SET name=?, price=?, description=?, category=?, image_path=? WHERE id=?')
        ->execute([$name, $price, $desc, $category, $imagePath, $recipeId]);
} else {
    $pdo->prepare('UPDATE recipes SET name=?, price=?, description=?, category=? WHERE id=?')
        ->execute([$name, $price, $desc, $category, $recipeId]);
}

respond(['success' => true]);