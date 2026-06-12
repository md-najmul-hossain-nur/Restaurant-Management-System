<?php
/**
 * api/place_order.html
 * Option C: linked to account if logged in, guest if not
 */

require_once '../Php/db.php';
require_once '../Php/bootstrap.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$userId = $_SESSION['user_id'] ?? null;

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

// Calculate total
$total = 0;
foreach ($items as $item) {
    $total += $item['price'] * $item['quantity'];
}
$tax        = $total * 0.10;
$grandTotal = round($total + $tax, 2);

try {
    $pdo->beginTransaction();

    $assignedWaiterId = null;
    if ($tableId !== null) {
        $waiterStmt = $pdo->prepare(
            "SELECT assigned_waiter_id FROM restaurant_tables WHERE id = ?"
        );
        $waiterStmt->execute([$tableId]);
        $assignedWaiterId = $waiterStmt->fetchColumn() ?: null;
    }

    $scheduledTime = !empty($data['scheduled_time']) ? str_replace('T', ' ', $data['scheduled_time']) : null;
    
    // Calculate max prep time from recipes
    $totalPrepTime = 0;
    if (!empty($items)) {
        $recipeIds = array_column($items, 'recipe_id');
        $recipeIds = array_filter($recipeIds);
        if (!empty($recipeIds)) {
            $inClause = str_repeat('?,', count($recipeIds) - 1) . '?';
            $prepStmt = $pdo->prepare("SELECT MAX(CAST(prep_time AS UNSIGNED)) FROM recipes WHERE id IN ($inClause)");
            $prepStmt->execute($recipeIds);
            $totalPrepTime = (int) $prepStmt->fetchColumn();
        }
    }

    // Insert order
    $stmt = $pdo->prepare(
        "INSERT INTO orders (customer_id, table_id, waiter_id, status, total_amount, payment_method, guest_name, guest_phone, notes, scheduled_time, total_prep_time)
         VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $tableId, $assignedWaiterId, $grandTotal, $paymentMethod, $guestName ?: null, $guestPhone ?: null, $notes, $scheduledTime, $totalPrepTime]);
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
        $role = strtolower(trim((string) ($_SESSION['role'] ?? '')));
        // If it's a customer, set active_customer_id to their ID.
        // If it's a waiter, active_customer_id remains null (guest or walk-in).
        $activeCustId = ($role === 'customer') ? $userId : null;

        $pdo->prepare("UPDATE restaurant_tables SET status = 'occupied', active_customer_id = ? WHERE id = ?")
            ->execute([$activeCustId, $tableId]);
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
