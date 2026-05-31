<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ── Database credentials ─────────────────────────────────────
$DB_HOST = 'localhost';
$DB_NAME = 'restaurant_db';
$DB_USER = 'root';
$DB_PASS = '';

$dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    // Problem 2 fix: set JSON header before outputting error
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'DB Connection failed: ' . $e->getMessage()]);
    exit;
}

function respond($data, $status = 200) {
    // Clear anything that may have been printed before this call
    if (ob_get_level()) ob_clean();

    http_response_code($status);
    header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    echo json_encode($data);
    exit;
}

function requireLogin($requiredRole = null) {
    if (empty($_SESSION['user_id'])) {
        respond(['error' => 'Not logged in'], 401);
    }

    if ($requiredRole !== null) {
        $actualRole = $_SESSION['role'] ?? '';
        if ($actualRole !== $requiredRole) {
            respond(['error' => 'Access denied'], 403);
        }
    }
}