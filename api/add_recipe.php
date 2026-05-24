<?php
// api/add_recipe.php
// Called by chief.js — Add Recipe form
// Method: POST multipart/form-data

if (session_status() === PHP_SESSION_NONE) session_start();
require_once '../PHP/db.php';
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
    $uploadDir = '../uploads/recipes/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $ext      = pathinfo($_FILES['recipeImageFile']['name'], PATHINFO_EXTENSION);
    $safeName = 'recipe_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES['recipeImageFile']['tmp_name'], $uploadDir . $safeName))
        $imagePath = $uploadDir . $safeName;
}

$pdo->prepare(
    'INSERT INTO recipes (chef_id, name, description, price, image_path, status) VALUES (?, ?, ?, ?, ?, ?)'
)->execute([$chefId, $name, $desc, $price, $imagePath, 'pending']);

respond(['success' => true, 'recipe_id' => $pdo->lastInsertId(), 'message' => 'Recipe submitted for approval!']);