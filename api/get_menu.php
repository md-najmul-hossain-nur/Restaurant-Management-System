<?php
/**
 * api/get_menu.php
 * PUBLIC endpoint — no login required
 * Returns all approved recipes as JSON
 */

require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

// No requireLogin() — this is a public endpoint for guests and customers

$category = $_GET['category'] ?? null;

if ($category && $category !== 'All') {
    $stmt = $pdo->prepare(
        "SELECT id, name, description, price, category, image_path, prep_time
         FROM recipes
         WHERE status = 'approved' AND category = ?
         ORDER BY category, name"
    );
    $stmt->execute([$category]);
} else {
    $stmt = $pdo->query(
        "SELECT id, name, description, price, category, image_path, prep_time
         FROM recipes
         WHERE status = 'approved'
         ORDER BY category, name"
    );
}

$recipes = $stmt->fetchAll();
respond($recipes ?: []);
