<?php
require_once __DIR__ . '/db.php';

try {
    $pdo->beginTransaction();

    // 1. Clear existing data
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE order_items");
    $pdo->exec("TRUNCATE TABLE orders");
    $pdo->exec("TRUNCATE TABLE recipes");
    $pdo->exec("TRUNCATE TABLE reservations");
    $pdo->exec("TRUNCATE TABLE restaurant_tables");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "Cleared old dummy data.\n";

    // 2. Fetch or Create Users for each role
    function getOrCreateUser($pdo, $role, $name, $email, $password = 'password') {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE role = ? LIMIT 1");
        $stmt->execute([$role]);
        $id = $stmt->fetchColumn();
        if (!$id) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, approval_status, approval_decided_at) VALUES (?, ?, ?, ?, 'approved', NOW())");
            $stmt->execute([$name, $email, $hash, $role]);
            $id = $pdo->lastInsertId();
            
            // Insert role-specific tables if needed
            if ($role === 'admin') {
                $pdo->exec("INSERT INTO admins (user_id, is_super, can_manage_staff) VALUES ($id, 1, 1)");
            } elseif ($role === 'chief') {
                $pdo->exec("INSERT INTO chiefs (user_id, specialty, years_experience) VALUES ($id, 'General', 5)");
            } elseif ($role === 'waiter') {
                $pdo->exec("INSERT INTO waiters (user_id, shift, assigned_section) VALUES ($id, 'Morning', 'Main Hall')");
            }
        }
        return $id;
    }

    $adminId = getOrCreateUser($pdo, 'admin', 'Admin User', 'admin@gmail.com');
    $chefId = getOrCreateUser($pdo, 'chief', 'Head Chef', 'chef@gmail.com');
    $waiterId = getOrCreateUser($pdo, 'waiter', 'John Waiter', 'waiter@gmail.com');
    $customerId = getOrCreateUser($pdo, 'customer', 'Test Customer', 'customer@gmail.com');

    echo "Ensured all user roles exist.\n";

    // 3. Create Recipes (7 approved for customer menu, 1 pending for admin to approve)
    $recipesData = [
        ['Alu Vorta Special', 'Traditional mashed potatoes with mustard oil, dried chilies, and fresh onions. A classic comfort food.', 4.50, '10', 'Breakfast', '../Images/food/Alu vorta.jpg', 'approved'],
        ['Classic Beef Burger', 'Juicy beef patty with fresh lettuce, tomatoes, cheese, and our secret house sauce in a toasted brioche bun.', 12.00, '15', 'Lunch', '../Images/food/Burger.jpg', 'approved'],
        ['Mutton Dum Biryani', 'Aromatic basmati rice cooked with tender mutton pieces and a blend of rich spices, served with raita.', 22.00, '35', 'Dinner', '../Images/food/Dam biriani.jpg', 'approved'],
        ['Spicy Roast Chicken', 'Oven-roasted half chicken marinated in spicy herbs, served with roasted vegetables and gravy.', 18.50, '25', 'Dinner', '../Images/food/chicken.jpg', 'approved'],
        ['Vegetable Curry Mix', 'A healthy mix of seasonal vegetables simmered in a mildly spiced coconut curry sauce.', 10.00, '20', 'Lunch', '../Images/food/vagitable.jpg', 'approved'],
        ['Khichuri Platter', 'Flavorful lentil and rice dish cooked together, served with fried eggplant and pickles.', 14.00, '25', 'Breakfast', '../Images/food/khichuri.jpg', 'approved'],
        ['Chef\'s Special Salad', 'Fresh organic greens, cherry tomatoes, cucumbers, and grilled chicken strips with balsamic vinaigrette.', 9.50, '10', 'Lunch', '../Images/food/pexels-lucas-porras-1937324539-35723478 (1).jpg', 'approved'],
        ['Strawberry Delight', 'A sweet and refreshing dessert featuring fresh strawberries, cream, and a buttery biscuit base.', 8.00, '5', 'Desserts', '../Images/food/pexels-ionela-mat-268382825-19671341.jpg', 'pending'],
    ];

    $recipeStmt = $pdo->prepare("INSERT INTO recipes (chef_id, name, description, price, prep_time, category, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $recipeIds = [];
    foreach ($recipesData as $idx => $r) {
        $chefForRecipe = ($r[6] === 'pending') ? $chefId : NULL;
        $recipeStmt->execute([$chefForRecipe, $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6]]);
        $recipeIds[] = $pdo->lastInsertId();
    }

    echo "Inserted 8 realistic recipes.\n";

    // 4. Create Tables
    $tableStmt = $pdo->prepare("INSERT INTO restaurant_tables (table_number, capacity, position, status, assigned_waiter_id, active_customer_id) VALUES (?, ?, ?, ?, ?, ?)");
    $tableStmt->execute([1, 4, 'Window Side', 'occupied', $waiterId, $customerId]);
    $table1 = $pdo->lastInsertId();
    $tableStmt->execute([2, 2, 'Main Hall', 'reserved', NULL, NULL]);
    $table2 = $pdo->lastInsertId();
    $tableStmt->execute([3, 6, 'Patio', 'available', NULL, NULL]);
    $table3 = $pdo->lastInsertId();
    $tableStmt->execute([4, 4, 'Main Hall', 'available', NULL, NULL]);
    $table4 = $pdo->lastInsertId();

    echo "Inserted 4 restaurant tables.\n";

    // 5. Create Orders
    $orderStmt = $pdo->prepare("INSERT INTO orders (customer_id, table_id, waiter_id, chef_id, status, total_amount, payment_method, guest_name, delivery_address, total_prep_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, recipe_id, name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");

    // Order 1: Waiter order for Table 1 (In Progress)
    $orderStmt->execute([$customerId, $table1, $waiterId, $chefId, 'in_progress', 31.50, 'Cash', NULL, NULL, 45]);
    $order1 = $pdo->lastInsertId();
    $itemStmt->execute([$order1, $recipeIds[2], 'Mutton Dum Biryani', 22.00, 1, 22.00]);
    $itemStmt->execute([$order1, $recipeIds[6], 'Chef\'s Special Salad', 9.50, 1, 9.50]);

    // Order 2: Waiter order for Table 3 (Served) - wait, table 3 is available, let's just make it historical
    $orderStmt->execute([NULL, $table3, $waiterId, $chefId, 'served', 30.50, 'Card', NULL, NULL, 40]);
    $order2 = $pdo->lastInsertId();
    $itemStmt->execute([$order2, $recipeIds[1], 'Classic Beef Burger', 12.00, 1, 12.00]);
    $itemStmt->execute([$order2, $recipeIds[3], 'Spicy Roast Chicken', 18.50, 1, 18.50]);

    // Order 3: Customer online order (Delivery - Queued)
    $orderStmt->execute([$customerId, NULL, NULL, NULL, 'queued', 18.50, 'Card', NULL, '123 Test Ave, NY', 35]);
    $order3 = $pdo->lastInsertId();
    $itemStmt->execute([$order3, $recipeIds[5], 'Khichuri Platter', 14.00, 1, 14.00]);
    $itemStmt->execute([$order3, $recipeIds[0], 'Alu Vorta Special', 4.50, 1, 4.50]);

    // Order 4: Guest online order (Delivery - Ready)
    $orderStmt->execute([NULL, NULL, NULL, $chefId, 'ready', 24.00, 'Cash', 'John Guest', '789 Elm Street, NY', 30]);
    $order4 = $pdo->lastInsertId();
    $itemStmt->execute([$order4, $recipeIds[1], 'Classic Beef Burger', 12.00, 2, 24.00]);

    // Order 5: Customer online order (Delivery - Delivered - Historical)
    $orderStmt->execute([$customerId, NULL, NULL, $chefId, 'delivered', 14.00, 'Card', NULL, '123 Test Ave, NY', 25]);
    $order5 = $pdo->lastInsertId();
    $itemStmt->execute([$order5, $recipeIds[5], 'Khichuri Platter', 14.00, 1, 14.00]);

    echo "Inserted 5 diverse orders (Waiter, Customer, Guest, In Progress, Queued, Delivered, etc).\n";

    $pdo->commit();
    echo "Database seeding completed successfully!\n";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "Failed: " . $e->getMessage() . "\n";
}
?>
