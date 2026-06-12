<?php
session_start();
require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';

// only admins can delete messages
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'forbidden']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'error' => 'invalid_id']);
    exit;
}

$stmt = $pdo->prepare('DELETE FROM chat_messages WHERE id = ?');
$stmt->execute([$id]);

echo json_encode(['success' => true]);
exit;
?>
