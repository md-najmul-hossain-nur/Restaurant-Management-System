<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';
requireLogin();

// Expect JSON { action: 'in'|'out' }
$payload = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = (int) ($_SESSION['user_id'] ?? 0);
$action = ($payload['action'] ?? '') === 'in' ? 'in' : 'out';

if (!$userId || !$action) {
    respond(['error' => 'Missing parameters'], 400);
}

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
            $pdo->prepare('UPDATE waiters SET is_clocked_in = 0, last_clock_out = NOW() WHERE user_id = ?')
                ->execute([$userId]);
        } else {
            $pdo->prepare('UPDATE chiefs SET is_clocked_in = 0, last_clock_out = NOW() WHERE user_id = ?')
                ->execute([$userId]);
        }
    }

    $table = $role === 'waiter' ? 'waiters' : 'chiefs';
    $clockStmt = $pdo->prepare("SELECT is_clocked_in, last_clock_in, last_clock_out FROM {$table} WHERE user_id = ?");
    $clockStmt->execute([$userId]);
    $clockRow = $clockStmt->fetch();

    respond([
        'success' => true,
        'action' => $action,
        'clocked_in' => $clockRow['is_clocked_in'] ?? 0,
        'last_clock_in' => $clockRow['last_clock_in'] ?? null,
        'last_clock_out' => $clockRow['last_clock_out'] ?? null,
    ]);
} catch (Exception $e) {
    respond(['error' => $e->getMessage()], 500);
}

?>
