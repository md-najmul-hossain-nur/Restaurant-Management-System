<?php
// ============================================================
// db.php — Core database connection + shared helpers
// Included at the top of every API file
// ============================================================

// Problem 1 fix: only start session if one isn't already active
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

function ensureCustomerApprovalSchema($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME IN ('approval_status', 'approval_decided_at')"
    );
    $stmt->execute();
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $hasApprovalStatus = in_array('approval_status', $existingColumns, true);
    $hasApprovalDecidedAt = in_array('approval_decided_at', $existingColumns, true);

    if (!$hasApprovalStatus || !$hasApprovalDecidedAt) {
        $alterParts = [];

        if (!$hasApprovalStatus) {
            $alterParts[] = "ADD COLUMN approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER role";
        }

        if (!$hasApprovalDecidedAt) {
            $alterParts[] = "ADD COLUMN approval_decided_at TIMESTAMP NULL DEFAULT NULL AFTER approval_status";
        }

        $pdo->exec('ALTER TABLE users ' . implode(', ', $alterParts));

        if (!$hasApprovalStatus) {
            $pdo->exec("UPDATE users SET approval_status = 'approved', approval_decided_at = COALESCE(approval_decided_at, created_at)");
        } elseif (!$hasApprovalDecidedAt) {
            $pdo->exec("UPDATE users SET approval_decided_at = COALESCE(approval_decided_at, created_at) WHERE approval_status = 'approved'");
        }
    }
}

ensureCustomerApprovalSchema($pdo);

function ensureDefaultAdminAccount($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $adminEmail = 'admin@gmail.com';
    $adminPasswordHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

    $stmt = $pdo->prepare("SELECT id, password, role FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$adminEmail]);
    $adminUser = $stmt->fetch();

    if (!$adminUser) {
        $insertUser = $pdo->prepare(
            "INSERT INTO users (name, email, password, role, approval_status, approval_decided_at)
             VALUES (?, ?, ?, ?, 'approved', NOW())"
        );
        $insertUser->execute(['Admin', $adminEmail, $adminPasswordHash, 'admin']);
        $adminUserId = (int) $pdo->lastInsertId();
    } else {
        $adminUserId = (int) $adminUser['id'];

        if (($adminUser['role'] ?? '') !== 'admin' || strtolower(trim($adminUser['password'] ?? '')) !== $adminPasswordHash) {
            $pdo->prepare(
                "UPDATE users
                 SET name = 'Admin', password = ?, role = 'admin', approval_status = 'approved', approval_decided_at = NOW()
                 WHERE id = ?"
            )->execute([$adminPasswordHash, $adminUserId]);
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM admins WHERE user_id = ? LIMIT 1");
    $stmt->execute([$adminUserId]);

    if (!$stmt->fetch()) {
        $pdo->prepare(
            "INSERT INTO admins (user_id, is_super, can_manage_staff)
             VALUES (?, 1, 1)"
        )->execute([$adminUserId]);
    }
}

ensureDefaultAdminAccount($pdo);

// ── respond() — send JSON and stop ───────────────────────────
// Problem 3 fix: clear any accidental output before sending JSON
// Problem 4 fix: add CORS header so browser doesn't block requests
function respond($data, $status = 200) {
    // Clear anything that may have been printed before this call
    if (ob_get_level()) ob_clean();

    http_response_code($status);
    header('Content-Type: application/json');

    // Allow requests from same origin (adjust in production)
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    echo json_encode($data);
    exit;
}

// ── requireLogin() — block if not logged in ──────────────────
// Problem 5 fix: optional role check added
// Usage:
//   requireLogin();              → any logged-in user
//   requireLogin('customer');    → only customers
//   requireLogin('admin');       → only admins
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