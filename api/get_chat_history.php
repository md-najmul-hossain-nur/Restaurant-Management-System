<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../PHP/db.php';
require_once __DIR__ . '/../PHP/bootstrap.php';

$sessionIdentifier = null;
$userRole = $_SESSION['role'] ?? null;

if ($userRole === 'admin') {
    $sessionIdentifier = trim($_GET['session_id'] ?? '');
    if ($sessionIdentifier === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'session_id_required']);
        exit;
    }
} else {
    // Guest/customer: strictly use current session identifier.
    $sessionIdentifier = session_id();
}

try {
    $stmt = $pdo->prepare(
        'SELECT id, user_id, name, email, role, source, message, created_at
         FROM chat_messages
         WHERE session_id = ?
         ORDER BY created_at ASC'
    );
    $stmt->execute([$sessionIdentifier]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'session_id' => $sessionIdentifier, 'messages' => $messages]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'server_error']);
    exit;
}
