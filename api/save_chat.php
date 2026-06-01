<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../PHP/db.php';
require_once __DIR__ . '/../PHP/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || !isset($input['message'])) {
    echo json_encode(['success' => false, 'error' => 'invalid_payload']);
    exit;
}

$message = trim($input['message']);
$source = ($input['source'] ?? 'user') === 'bot' ? 'bot' : 'user';

if ($message === '') {
    echo json_encode(['success' => false, 'error' => 'empty_message']);
    exit;
}

$userId = $_SESSION['user_id'] ?? null;
$name = $_SESSION['name'] ?? null;
$email = $_SESSION['email'] ?? null;
$role = $_SESSION['role'] ?? null;
$sessionIdentifier = session_id();

// Allow the client to provide the session identifier for guest chat persistence.
if (!empty($input['session_id'])) {
    $sessionIdentifier = trim($input['session_id']);
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO chat_messages (user_id, name, email, role, session_id, source, message) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $name, $email, $role, $sessionIdentifier, $source, $message]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'server_error']);
    exit;
}

?>
