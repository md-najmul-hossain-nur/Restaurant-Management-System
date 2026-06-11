<?php
// api/approve_menu_item.php
// Called by admin.js — approve or reject a pending recipe
// Method: POST JSON  { recipe_id, action: 'approve'|'reject' }

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('admin');

$data     = json_decode(file_get_contents('php://input'), true);
$recipeId = (int)  ($data['recipe_id'] ?? 0);
$action   = trim($data['action']       ?? '');

if (!$recipeId || !in_array($action, ['approve', 'reject']))
    respond(['error' => 'Invalid input'], 400);

$status = $action === 'approve' ? 'approved' : 'rejected';
$pdo->prepare('UPDATE recipes SET status = ? WHERE id = ?')->execute([$status, $recipeId]);

respond(['success' => true, 'status' => $status]);
