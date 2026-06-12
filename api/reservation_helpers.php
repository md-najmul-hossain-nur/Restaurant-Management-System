<?php

function ensureReservationsTable(PDO $pdo) {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_id INT NOT NULL,
            customer_id INT DEFAULT NULL,
            reserved_date DATE NOT NULL,
            reserved_time TIME NOT NULL,
            reserved_end_time TIME NOT NULL DEFAULT '21:00:00',
            guest_count INT NOT NULL DEFAULT 1,
            special_requests TEXT,
            status ENUM('pending','approved','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_reservations_customer (customer_id),
            INDEX idx_reservations_table (table_id),
            CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE,
            CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    $stmt = $pdo->prepare(
        "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'reservations'
           AND COLUMN_NAME IN ('status', 'customer_id', 'updated_at', 'reserved_end_time')"
    );
    $stmt->execute();
    $columns = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
        $columns[$column['COLUMN_NAME']] = $column;
    }

    if (isset($columns['status'])) {
        $statusType = strtolower((string) $columns['status']['COLUMN_TYPE']);
        $needsStatusUpdate = strpos($statusType, "'approved'") === false
            || strpos($statusType, "'rejected'") === false
            || strpos($statusType, "'confirmed'") === false
            || strpos($statusType, "'completed'") === false;

        if ($needsStatusUpdate) {
            $pdo->exec(
                "ALTER TABLE reservations
                 MODIFY status ENUM('pending','approved','confirmed','rejected','cancelled','completed') NOT NULL DEFAULT 'pending'"
            );
        }

        $pdo->exec("UPDATE reservations SET status = 'approved' WHERE status = ''");
    }

    if (isset($columns['customer_id']) && ($columns['customer_id']['IS_NULLABLE'] ?? '') !== 'YES') {
        $pdo->exec(
            "ALTER TABLE reservations
             MODIFY customer_id INT DEFAULT NULL"
        );
    }

    if (!isset($columns['updated_at'])) {
        $pdo->exec("ALTER TABLE reservations ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    }

    if (!isset($columns['reserved_end_time'])) {
        $pdo->exec("ALTER TABLE reservations ADD COLUMN reserved_end_time TIME NOT NULL DEFAULT '21:00:00' AFTER reserved_time");
        $pdo->exec("UPDATE reservations SET reserved_end_time = ADDTIME(reserved_time, '01:00:00') WHERE reserved_end_time = '21:00:00'");
    }
}

function normalizeReservationTime(?string $time): ?string {
    $time = trim((string) $time);
    if ($time === '') {
        return null;
    }

    $dt = DateTime::createFromFormat('H:i', $time) ?: DateTime::createFromFormat('H:i:s', $time);
    if (!$dt) {
        return null;
    }

    return $dt->format('H:i');
}

function formatReservationRange(?string $start, ?string $end): string {
    $start = normalizeReservationTime($start) ?: '00:00';
    $end = normalizeReservationTime($end) ?: $start;
    return $start . ' - ' . $end;
}
