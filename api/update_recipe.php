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

if (!$recipeId || !$name || !$desc || !$price) {
    respond(['error' => 'Name, details and price are required'], 400);
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

    $ext = pathinfo($_FILES['recipeImageFile']['name'], PATHINFO_EXTENSION);
    $safeName = 'recipe_' . $recipeId . '_' . uniqid() . '.' . $ext;
    if (move_uploaded_file($_FILES['recipeImageFile']['tmp_name'], $uploadDir . $safeName)) {
        $imagePath = 'uploads/recipes/' . $safeName;
    }
}

if ($imagePath) {
    $pdo->prepare('UPDATE recipes SET name = ?, description = ?, price = ?, image_path = ? WHERE id = ?')
        ->execute([$name, $desc, $price, $imagePath, $recipeId]);
} else {
    $pdo->prepare('UPDATE recipes SET name = ?, description = ?, price = ? WHERE id = ?')
        ->execute([$name, $desc, $price, $recipeId]);
}

respond([
    'success' => true,
    'recipe_id' => $recipeId,
    'image_path' => $imagePath,
]);
