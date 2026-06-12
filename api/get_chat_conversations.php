<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';

if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'forbidden']);
    exit;
}

try {
    $stmt = $pdo->query(
        "SELECT session_id,
                MAX(created_at) AS last_activity,
                GROUP_CONCAT(DISTINCT COALESCE(name, email, 'Guest') ORDER BY created_at DESC SEPARATOR ', ') AS participants,
                MAX(CASE WHEN source = 'user' THEN created_at ELSE NULL END) AS last_user_message
         FROM chat_messages
         WHERE session_id IS NOT NULL
         GROUP BY session_id
         ORDER BY last_activity DESC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $conversations = array_map(function ($row) {
        return [
            'session_id' => $row['session_id'],
            'last_activity' => $row['last_activity'],
            'participants' => $row['participants'],
            'last_user_message' => $row['last_user_message'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'conversations' => $conversations]);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'server_error']);
    exit;
}
