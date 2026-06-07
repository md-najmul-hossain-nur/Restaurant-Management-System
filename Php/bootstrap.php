<?php

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

function ensureOrderGuestColumns($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'orders'
           AND COLUMN_NAME IN ('guest_name', 'guest_phone')"
    );
    $stmt->execute();
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $hasGuestName = in_array('guest_name', $existingColumns, true);
    $hasGuestPhone = in_array('guest_phone', $existingColumns, true);

    if (!$hasGuestName || !$hasGuestPhone) {
        $alterParts = [];

        if (!$hasGuestName) {
            $alterParts[] = "ADD COLUMN guest_name VARCHAR(100) NULL AFTER total_amount";
        }

        if (!$hasGuestPhone) {
            $alterParts[] = "ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_name";
        }

        $pdo->exec('ALTER TABLE orders ' . implode(', ', $alterParts));
    }
}

function ensureOrderCustomerColumn($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'orders'
           AND COLUMN_NAME IN ('customer_id', 'payment_method')"
    );
    $stmt->execute();
    $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('customer_id', $existing, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN customer_id INT DEFAULT NULL AFTER id");
    }
    if (!in_array('payment_method', $existing, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash' AFTER total_amount");
    }
}

function ensureEmployeeClockColumns($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $targets = ['waiters', 'chiefs'];
    foreach ($targets as $table) {
        $stmt = $pdo->prepare(
                "SELECT COLUMN_NAME
                         FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = DATABASE()
                             AND TABLE_NAME = ?
                             AND COLUMN_NAME IN ('is_clocked_in', 'last_clock_in', 'last_clock_out')"
        );
        $stmt->execute([$table]);
        $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $alterParts = [];
        if (!in_array('is_clocked_in', $existing, true)) {
            $alterParts[] = "ADD COLUMN is_clocked_in TINYINT(1) NOT NULL DEFAULT 0";
        }
        if (!in_array('last_clock_in', $existing, true)) {
            $alterParts[] = "ADD COLUMN last_clock_in TIMESTAMP NULL DEFAULT NULL";
        }
        if (!in_array('last_clock_out', $existing, true)) {
            $alterParts[] = "ADD COLUMN last_clock_out TIMESTAMP NULL DEFAULT NULL";
        }

        if ($alterParts) {
            $pdo->exec('ALTER TABLE ' . $table . ' ' . implode(', ', $alterParts));
        }
    }
}

function ensureTableAssignmentColumn($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'restaurant_tables'
           AND COLUMN_NAME = 'assigned_waiter_id'"
    );
    $stmt->execute();
    $hasAssigned = (bool) $stmt->fetchColumn();

    if (!$hasAssigned) {
        $pdo->exec("ALTER TABLE restaurant_tables ADD COLUMN assigned_waiter_id INT DEFAULT NULL AFTER status");
    }
}

function ensureTableCustomerColumns($pdo) {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'restaurant_tables'
           AND COLUMN_NAME IN ('reserved_customer_id', 'active_customer_id')"
    );
    $stmt->execute();
    $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $alterParts = [];
    if (!in_array('reserved_customer_id', $existing, true)) {
        $alterParts[] = "ADD COLUMN reserved_customer_id INT DEFAULT NULL AFTER assigned_waiter_id";
    }
    if (!in_array('active_customer_id', $existing, true)) {
        $alterParts[] = "ADD COLUMN active_customer_id INT DEFAULT NULL AFTER reserved_customer_id";
    }

    if ($alterParts) {
        $pdo->exec('ALTER TABLE restaurant_tables ' . implode(', ', $alterParts));
    }
}

ensureCustomerApprovalSchema($pdo);
ensureDefaultAdminAccount($pdo);
ensureOrderGuestColumns($pdo);
ensureOrderCustomerColumn($pdo);
ensureEmployeeClockColumns($pdo);
ensureTableAssignmentColumn($pdo);
ensureTableCustomerColumns($pdo);
// Ensure chat messages table exists for chatbot logging
function ensureChatMessagesTable($pdo) {
    static $initialized = false;
    if ($initialized) return;
    $initialized = true;

    $stmt = $pdo->prepare(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'"
    );
    $stmt->execute();
    if ($stmt->fetch()) {
        // Ensure session_id column exists for conversation linking.
        $colStmt = $pdo->prepare(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'session_id'"
        );
        $colStmt->execute();
        if (!$colStmt->fetch()) {
            $pdo->exec("ALTER TABLE chat_messages ADD COLUMN session_id VARCHAR(128) NULL AFTER role");
        }
        return;
    }

    $pdo->exec(
        "CREATE TABLE chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            name VARCHAR(150) NULL,
            email VARCHAR(150) NULL,
            role VARCHAR(50) NULL,
            session_id VARCHAR(128) NULL,
            source ENUM('user','bot') NOT NULL DEFAULT 'user',
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

ensureChatMessagesTable($pdo);