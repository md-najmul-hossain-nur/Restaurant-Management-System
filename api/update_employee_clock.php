<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('admin');

// Expect JSON { user_id: int, action: 'in'|'out' }
$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload || empty($payload['user_id']) || empty($payload['action'])) {
    respond(['error' => 'Missing parameters'], 400);
}
$userId = (int)$payload['user_id'];
$action = $payload['action'] === 'in' ? 'in' : 'out';

// Determine which role table to update (chiefs or waiters)
$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$userId]);
$u = $stmt->fetch();
if (!$u) respond(['error' => 'User not found'], 404);
$role = $u['role'];

try {
    if ($action === 'in') {
        if ($role === 'waiter') {
            $pdo->prepare('UPDATE waiters SET is_clocked_in = 1, last_clock_in = NOW() WHERE user_id = ?')
                ->execute([$userId]);
        } else {
            $pdo->prepare('UPDATE chiefs SET is_clocked_in = 1, last_clock_in = NOW() WHERE user_id = ?')
                ->execute([$userId]);
        }
    } else {
        if ($role === 'waiter') {
            $pdo->prepare('UPDATE waiters SET is_clocked_in = 0 WHERE user_id = ?')
                ->execute([$userId]);
        } else {
            $pdo->prepare('UPDATE chiefs SET is_clocked_in = 0 WHERE user_id = ?')
                ->execute([$userId]);
        }
    }
    respond(['success' => true, 'action' => $action]);
} catch (Exception $e) {
    respond(['error' => $e->getMessage()], 500);
}

?>
