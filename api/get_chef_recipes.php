<?php
// api/get_chef_recipes.php
// Called by chief.js on page load — loads this chef's recipes
// Method: GET
 
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('chief');
 
$chefId = $_SESSION['user_id'];
$stmt   = $pdo->prepare(
    'SELECT id, name, description, price, prep_time, image_path, status, created_at
     FROM recipes WHERE chef_id = ? ORDER BY created_at DESC'
);
$stmt->execute([$chefId]);
respond($stmt->fetchAll() ?: []);
 
