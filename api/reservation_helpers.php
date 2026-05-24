<?php

function ensureReservationsTable(PDO $pdo) {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            table_id INT NOT NULL,
            customer_id INT DEFAULT NULL,
            reserved_date DATE NOT NULL,
            reserved_time TIME NOT NULL,
            guest_count INT NOT NULL DEFAULT 1,
            special_requests TEXT,
            status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_reservations_customer (customer_id),
            INDEX idx_reservations_table (table_id),
            CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE,
            CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

