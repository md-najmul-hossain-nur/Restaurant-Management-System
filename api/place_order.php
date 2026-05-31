<?php
/**
 * api/place_order.php
 * Option C: linked to account if logged in, guest if not
 */

require_once '../PHP/db.php';
require_once '../PHP/bootstrap.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$forceGuest = !empty($data['force_guest']);
$userId = $forceGuest ? null : ($_SESSION['user_id'] ?? null);

$guestName  = trim($data['guest_name']  ?? '');
$guestPhone = trim($data['guest_phone'] ?? '');

// Guest must provide name + phone
if (!$userId && (!$guestName || !$guestPhone)) {
    respond(['error' => 'Please provide your name and phone number.'], 400);
}

if (empty($data['items']) || !is_array($data['items'])) {
    respond(['error' => 'No items in order'], 400);
}

$tableId       = isset($data['table_id']) && $data['table_id'] !== null && $data['table_id'] !== ''
    ? (int) $data['table_id']
    : null;
$paymentMethod = $data['payment_method'] ?? 'Cash';
$notes         = $data['notes']          ?? '';
$items         = $data['items'];

$waiterId = null;
if (empty($_SESSION['user_id'])) {
    $stmt = $pdo->query(
        "SELECT user_id
         FROM waiters
         WHERE is_active = 1 AND is_clocked_in = 1
         ORDER BY last_clock_in DESC
         LIMIT 1"
    );
    $waiterId = (int) ($stmt->fetchColumn() ?: 0);
    if (!$waiterId) {
        $stmt = $pdo->query(
            "SELECT user_id
             FROM waiters
             WHERE is_active = 1
             ORDER BY created_at ASC
             LIMIT 1"
        );
        $waiterId = (int) ($stmt->fetchColumn() ?: 0);
    }
    if ($waiterId === 0) {
        $waiterId = null;
    }
}

// Calculate total
$total = 0;
foreach ($items as $item) {
    $total += $item['price'] * $item['quantity'];
}
$tax        = $total * 0.10;
$grandTotal = round($total + $tax, 2);

try {
    $pdo->beginTransaction();

    // Insert order
    $stmt = $pdo->prepare(
        "INSERT INTO orders (customer_id, table_id, waiter_id, status, total_amount, guest_name, guest_phone, notes)
         VALUES (?, ?, ?, 'queued', ?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $tableId, $waiterId, $grandTotal, $guestName ?: null, $guestPhone ?: null, $notes]);
    $orderId = $pdo->lastInsertId();

    // Insert items
    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (order_id, recipe_id, name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    foreach ($items as $item) {
        $subtotal = round($item['price'] * $item['quantity'], 2);
        $itemStmt->execute([
            $orderId,
            $item['recipe_id'] ?? null,
            $item['name'],
            $item['price'],
            $item['quantity'],
            $subtotal,
        ]);
    }

    // Mark table occupied if selected
    if ($tableId !== null) {
        $pdo->prepare("UPDATE restaurant_tables SET status = 'occupied' WHERE id = ?")
            ->execute([$tableId]);
    }

    $pdo->commit();

    respond([
        'success'  => true,
        'order_id' => $orderId,
        'total'    => $grandTotal,
        'message'  => 'Order placed successfully!',
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => 'Order failed: ' . $e->getMessage()], 500);
}
