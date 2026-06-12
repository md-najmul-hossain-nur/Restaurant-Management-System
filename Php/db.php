<?php
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
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

    require_once __DIR__ . '/bootstrap.php';

    // Auto-release expired reservations and tables
    $pdo->exec("
        UPDATE restaurant_tables rt
        JOIN reservations r ON rt.id = r.table_id
        SET rt.status = 'available', rt.reserved_customer_id = NULL, rt.active_customer_id = NULL
        WHERE r.status IN ('approved', 'confirmed')
          AND (r.reserved_date < CURRENT_DATE() 
               OR (r.reserved_date = CURRENT_DATE() AND r.reserved_end_time <= CURRENT_TIME()))
          AND rt.status IN ('reserved', 'occupied')
    ");

    $pdo->exec("
        UPDATE reservations
        SET status = 'completed'
        WHERE status IN ('approved', 'confirmed')
          AND (reserved_date < CURRENT_DATE() 
               OR (reserved_date = CURRENT_DATE() AND reserved_end_time <= CURRENT_TIME()))
    ");
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

function rememberRoleSession($user) {
    $role = strtolower(trim((string) ($user['role'] ?? '')));
    if ($role === '') {
        return;
    }

    $_SESSION['auth'][$role] = [
        'user_id' => (int) ($user['id'] ?? $user['user_id'] ?? 0),
        'name'    => $user['name'] ?? null,
        'email'   => $user['email'] ?? null,
        'role'    => $role,
    ];
}

function restoreRoleSession($requiredRole) {
    $requiredRole = strtolower(trim((string) $requiredRole));
    $saved = $_SESSION['auth'][$requiredRole] ?? null;

    if (!is_array($saved) || empty($saved['user_id'])) {
        return false;
    }

    $_SESSION['user_id'] = (int) $saved['user_id'];
    $_SESSION['name'] = $saved['name'] ?? null;
    $_SESSION['email'] = $saved['email'] ?? null;
    $_SESSION['role'] = $requiredRole;

    return true;
}

function requireLogin($requiredRole = null) {
    if (empty($_SESSION['user_id'])) {
        if ($requiredRole !== null && restoreRoleSession($requiredRole)) {
            return;
        }

        respond(['error' => 'Not logged in'], 401);
    }

    if ($requiredRole !== null) {
        $actualRole = strtolower(trim((string) ($_SESSION['role'] ?? '')));
        $requiredRole = strtolower(trim((string) $requiredRole));

        if ($actualRole !== $requiredRole && restoreRoleSession($requiredRole)) {
            $actualRole = $requiredRole;
        }

        if ($actualRole !== $requiredRole) {
            global $pdo;

            if (isset($pdo)) {
                $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
                $stmt->execute([(int) $_SESSION['user_id']]);
                $dbRole = strtolower(trim((string) $stmt->fetchColumn()));

                if ($dbRole !== '') {
                    $_SESSION['role'] = $dbRole;
                    $actualRole = $dbRole;
                }
            }
        }

        if ($actualRole !== $requiredRole) {
            respond(['error' => 'Access denied'], 403);
        }
    }
}
