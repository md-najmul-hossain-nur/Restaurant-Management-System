<?php
/**
 * api/profile.php
 * GET  → returns logged-in user's profile data + recent orders
 * POST → updates name, phone, address, email (or password, or avatar)
 */

require_once __DIR__ . '/../Php/db.php';
header('Content-Type: application/json');

requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Return profile data ──────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        "SELECT id, name, email, phone, address, role, avatar_path, created_at
         FROM users WHERE id = ?"
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        respond(['error' => 'User not found'], 404);
    }

    // Stats
    $orderStmt = $pdo->prepare(
        "SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent
         FROM orders WHERE customer_id = ?"
    );
    $orderStmt->execute([$userId]);
    $stats = $orderStmt->fetch();

    // Recent orders (last 5)
    $recentStmt = $pdo->prepare(
        "SELECT o.id, o.total_amount, o.status, o.created_at,
                GROUP_CONCAT(oi.name ORDER BY oi.id SEPARATOR ', ') as item_names
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.customer_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT 5"
    );
    $recentStmt->execute([$userId]);
    $recentOrders = $recentStmt->fetchAll();

    respond([
        'user'          => $user,
        'stats'         => $stats,
        'recent_orders' => $recentOrders,
    ]);
}

// ── POST: Update profile, password, or avatar ─────────────
if ($method === 'POST') {

    // --- Avatar upload (multipart form) ---
    if (isset($_FILES['avatar'])) {
        $file    = $_FILES['avatar'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($file['type'], $allowed)) {
            respond(['error' => 'Only JPG, PNG, WEBP or GIF allowed'], 400);
        }
        if ($file['size'] > $maxSize) {
            respond(['error' => 'Image must be under 5MB'], 400);
        }

        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $userId . '_' . time() . '.' . $ext;
        $uploadDir = '../Images/avatars/';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            respond(['error' => 'Failed to save image'], 500);
        }

        $avatarPath = 'Images/avatars/' . $filename;
        $pdo->prepare("UPDATE users SET avatar_path = ? WHERE id = ?")
            ->execute([$avatarPath, $userId]);

        respond(['success' => true, 'avatar_path' => $avatarPath]);
    }

    $data   = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    // --- Update profile info ---
    if ($action === 'update_profile') {
        $name    = trim($data['name']    ?? '');
        $email   = trim($data['email']   ?? '');
        $phone   = trim($data['phone']   ?? '');
        $address = trim($data['address'] ?? '');

        if (!$name || !$email) {
            respond(['error' => 'Name and email are required'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond(['error' => 'Invalid email format'], 400);
        }

        $check = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $check->execute([$email, $userId]);
        if ($check->fetch()) {
            respond(['error' => 'Email already in use'], 409);
        }

        $pdo->prepare(
            "UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?"
        )->execute([$name, $email, $phone, $address, $userId]);

        respond(['success' => true, 'message' => 'Profile updated!']);
    }

    // --- Change password ---
    if ($action === 'change_password') {
        $currentPwd = $data['current_password'] ?? '';
        $newPwd     = $data['new_password']     ?? '';

        if (strlen($newPwd) < 8) {
            respond(['error' => 'Password must be at least 8 characters'], 400);
        }

        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!password_verify($currentPwd, $user['password'])) {
            respond(['error' => 'Current password is wrong'], 401);
        }

        $hashed = password_hash($newPwd, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")
            ->execute([$hashed, $userId]);

        respond(['success' => true, 'message' => 'Password changed!']);
    }

    respond(['error' => 'Unknown action'], 400);
}

respond(['error' => 'Method not allowed'], 405);