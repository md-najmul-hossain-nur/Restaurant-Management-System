<?php
// api/update_recipe.php
// Update a recipe owned by the logged-in chef
// Method: POST multipart/form-data

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('chief');

$chefId = (int) ($_SESSION['user_id'] ?? 0);
$recipeId = (int) ($_POST['recipe_id'] ?? 0);
$name = trim($_POST['recipeName'] ?? '');
$desc = trim($_POST['recipeDetails'] ?? '');
$priceRaw = trim((string) ($_POST['recipePrice'] ?? ''));
$priceRaw = ltrim($priceRaw, "$ ");
$price = (float) $priceRaw;
$prepTime = (int) ($_POST['recipePrepTime'] ?? 0);

if (!$recipeId || !$name || !$desc || !$price) {
    respond(['error' => 'Name, details and price are required'], 400);
}
if ($prepTime < 1) {
    respond(['error' => 'Prep time (minutes) is required'], 400);
}

$stmt = $pdo->prepare('SELECT id FROM recipes WHERE id = ? AND chef_id = ? LIMIT 1');
$stmt->execute([$recipeId, $chefId]);
if (!$stmt->fetch()) {
    respond(['error' => 'Recipe not found'], 404);
}

$imagePath = null;
if (!empty($_FILES['recipeImageFile']['name'])) {
    $uploadDir = __DIR__ . '/../uploads/recipes/';
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        respond(['error' => 'Unable to create upload folder'], 500);
    }

    $ext = strtolower(pathinfo($_FILES['recipeImageFile']['name'], PATHINFO_EXTENSION));
    $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $actualMime = mime_content_type($_FILES['recipeImageFile']['tmp_name']);
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!in_array($ext, $allowedExts) || !in_array($actualMime, $allowedMimes)) {
        respond(['error' => 'Invalid image format'], 400);
    }
    $safeName = 'recipe_' . $recipeId . '_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES['recipeImageFile']['tmp_name'], $uploadDir . $safeName)) {
        $imagePath = 'uploads/recipes/' . $safeName;
    }
}

if ($imagePath) {
    $pdo->prepare('UPDATE recipes SET name = ?, description = ?, price = ?, prep_time = ?, image_path = ? WHERE id = ?')
        ->execute([$name, $desc, $price, $prepTime, $imagePath, $recipeId]);
} else {
    $pdo->prepare('UPDATE recipes SET name = ?, description = ?, price = ?, prep_time = ? WHERE id = ?')
        ->execute([$name, $desc, $price, $prepTime, $recipeId]);
}

respond([
    'success' => true,
    'recipe_id' => $recipeId,
    'image_path' => $imagePath,
]);
