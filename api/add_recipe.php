<?php
// api/add_recipe.php
// Called by chief.js — Add Recipe form
// Method: POST multipart/form-data

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('chief');

$chefId = $_SESSION['user_id'];
$name   = trim($_POST['recipeName']    ?? '');
$desc   = trim($_POST['recipeDetails'] ?? '');
$price  = (float)($_POST['recipePrice'] ?? 0);

if (!$name || !$desc || !$price)
    respond(['error' => 'Name, details and price are required'], 400);

// Image upload
$imagePath = null;
if (!empty($_FILES['recipeImageFile']['name'])) {
    $uploadDir = __DIR__ . '/../uploads/recipes/';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        respond(['error' => 'Unable to create upload folder'], 500);
    }
    $ext      = strtolower(pathinfo($_FILES['recipeImageFile']['name'], PATHINFO_EXTENSION));
    $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $actualMime = mime_content_type($_FILES['recipeImageFile']['tmp_name']);
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!in_array($ext, $allowedExts) || !in_array($actualMime, $allowedMimes)) {
        respond(['error' => 'Invalid image format'], 400);
    }
    $safeName = 'recipe_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES['recipeImageFile']['tmp_name'], $uploadDir . $safeName)) {
        $imagePath = 'uploads/recipes/' . $safeName;
    }
}

$pdo->prepare(
    'INSERT INTO recipes (chef_id, name, description, price, image_path, status) VALUES (?, ?, ?, ?, ?, ?)'
)->execute([$chefId, $name, $desc, $price, $imagePath, 'pending']);

respond([
    'success' => true,
    'recipe_id' => $pdo->lastInsertId(),
    'image_path' => $imagePath,
    'message' => 'Recipe submitted for approval!'
]);
