<?php
session_start();
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'waiter') {
  header('Location: login.html');
  exit;
}

require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';

$userId = (int) $_SESSION['user_id'];

$userStmt = $pdo->prepare(
  "SELECT name, email, phone, address, avatar_path, created_at
     FROM users
     WHERE id = ?"
);
$userStmt->execute([$userId]);
$user = $userStmt->fetch() ?: [];

$clockStmt = $pdo->prepare('SELECT is_clocked_in, last_clock_in, last_clock_out FROM waiters WHERE user_id = ?');
$clockStmt->execute([$userId]);
$clockData = $clockStmt->fetch() ?: [];
$isClockedIn = (int) ($clockData['is_clocked_in'] ?? 0);
$lastClockIn = $clockData['last_clock_in'] ?? '';
$lastClockOut = $clockData['last_clock_out'] ?? '';

$myTablesStmt = $pdo->prepare(
  "SELECT rt.id, rt.table_number, rt.capacity, rt.image_path, rt.active_customer_id, u.name AS customer_name
   FROM restaurant_tables rt
   LEFT JOIN users u ON u.id = rt.active_customer_id
   WHERE rt.assigned_waiter_id = ?
   ORDER BY rt.table_number"
);
$myTablesStmt->execute([$userId]);
$myTables = $myTablesStmt->fetchAll() ?: [];

$availTablesStmt = $pdo->query(
  "SELECT id, table_number, capacity, image_path, status
   FROM restaurant_tables
   WHERE status IN ('available', 'reserved') AND assigned_waiter_id IS NULL
   ORDER BY table_number"
);
$availableTables = $availTablesStmt->fetchAll() ?: [];

$resStmt = $pdo->query(
  "SELECT r.*, u.name as customer_name
   FROM reservations r
   LEFT JOIN users u ON u.id = r.customer_id
   WHERE r.status IN ('pending', 'approved', 'confirmed', 'completed') AND r.reserved_date = CURRENT_DATE
   ORDER BY r.reserved_time ASC"
);
$reservationsForWaiter = $resStmt->fetchAll() ?: [];
$latestByTable = [];
foreach ($reservationsForWaiter as $r) {
  $latestByTable[$r['table_id']] = $r;
}

$orderStmt = $pdo->prepare(
  "SELECT o.id, o.status, o.total_amount, o.created_at, o.table_id, o.guest_name,
            rt.table_number, rt.image_path
     FROM orders o
     LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
     WHERE o.waiter_id = ? OR o.waiter_id IS NULL
     ORDER BY o.created_at DESC"
);
$orderStmt->execute([$userId]);
$orders = $orderStmt->fetchAll() ?: [];

$itemStmt = $pdo->prepare(
  "SELECT name, price, quantity, subtotal
     FROM order_items
     WHERE order_id = ?"
);
$ordersWithItems = [];
foreach ($orders as $order) {
  $itemStmt->execute([$order['id']]);
  $order['items'] = $itemStmt->fetchAll() ?: [];
  $ordersWithItems[] = $order;
}

$readyCount = 0;
$kitchenCount = 0;
$completedToday = 0;
foreach ($ordersWithItems as $order) {
  $status = strtolower(trim($order['status'] ?? ''));
  if ($status === 'ready') {
    $readyCount++;
  } elseif (in_array($status, ['queued', 'in_progress'], true)) {
    $kitchenCount++;
  } elseif ($status === 'served') {
    $orderDate = !empty($order['created_at']) ? date('Y-m-d', strtotime($order['created_at'])) : '';
    if ($orderDate === date('Y-m-d')) {
      $completedToday++;
    }
  }
}

$menuStmt = $pdo->query(
  "SELECT id, name, price
     FROM recipes
     WHERE status = 'approved'
     ORDER BY name"
);
$menuItems = $menuStmt->fetchAll() ?: [];

$normalizeImagePath = function ($path, $fallback) {
  if (!$path) {
    return $fallback;
  }
  if (strpos($path, 'http') === 0 || strpos($path, '../') === 0) {
    return $path;
  }
  return '../' . ltrim($path, '/');
};

function formatWaiterStatusLabel($status)
{
  $status = strtolower(trim($status));
  if (in_array($status, ['queued', 'in_progress'], true))
    return 'In Kitchen';
  if ($status === 'ready')
    return 'Ready';
  if ($status === 'served')
    return 'Delivered';
  return ucfirst($status);
}

function waiterStatusClass($status)
{
  $status = strtolower(trim($status));
  if ($status === 'ready')
    return 'order-status--ready';
  if ($status === 'served')
    return 'order-status--delivered';
  return 'order-status--kitchen';
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feliciano — Waiter Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
    rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="../CSS/waiter.css" />
  <link rel="stylesheet" href="../CSS/responsive.css">
</head>

<body data-clocked="<?php echo $isClockedIn ? '1' : '0'; ?>" data-last-clock-in="<?php echo htmlspecialchars($lastClockIn); ?>" data-last-clock-out="<?php echo htmlspecialchars($lastClockOut); ?>">
  <div class="dashboard">

    <!-- Topbar -->
    <header class="topbar">
      <div class="brand">Feliciano</div>
      <div class="top-right">
        <div class="admin-title">Waiter<br>Dashboard</div>
        <div class="logout" onclick="window.location.href='login.html'">
          <img src="../Images/logout.png" alt="Logout" class="logout-icon">
        </div>
      </div>
    </header>

    <!-- Outer glass wrapper -->
    <div class="outer-wrapper">

      <!-- Hero -->
      <section class="panel hero">
        <div>
          <p class="eyebrow">Service command center</p>
          <h1 class="page-title">Work Status</h1>
          <p class="page-subtitle">You're currently on shift. Track tables and orders, and keep service moving from one
            shared interface.</p>
          <div class="shift-clock">
            <span class="shift-clock-label">Shift timer</span>
            <span class="shift-clock-value" id="shiftTimer">Not clocked in</span>
          </div>
        </div>
        <button class="btn btn-primary" data-clock-out>Clock Out</button>
      </section>

      <!-- Navbar -->
      <nav class="navbar">
        <div class="tab active" data-section="overview">
          <i class="fas fa-chart-pie"></i>
          <span>Overview</span>
        </div>
        <div class="tab" data-section="tables">
          <i class="fas fa-chair"></i>
          <span>Tables</span>
        </div>
        <div class="tab" data-section="order">
          <i class="fas fa-utensils"></i>
          <span>Order</span>
        </div>
        <div class="tab" data-section="profile">
          <i class="fas fa-user"></i>
          <span>Profile</span>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">

        <!-- ===== OVERVIEW ===== -->
        <div class="section-content active" id="overview">
          <h1 class="page-title">Overview</h1>
          <p class="page-subtitle">Your shift status at a glance</p>

          <div class="stats waiter-stats">
            <div class="card waiter-card waiter-stat--pending">
              <div class="waiter-stat">
                <div class="waiter-stat-icon"><i class="fas fa-receipt"></i></div>
                <div class="waiter-stat-body">
                  <div class="waiter-stat-label">Pending Orders</div>
                  <div class="waiter-stat-value" id="statPending"><?php echo $readyCount; ?></div>
                </div>
              </div>
            </div>

            <div class="card waiter-card waiter-stat--progress">
              <div class="waiter-stat">
                <div class="waiter-stat-icon"><i class="fas fa-hourglass-half"></i></div>
                <div class="waiter-stat-body">
                  <div class="waiter-stat-label">In Progress</div>
                  <div class="waiter-stat-value" id="statProgress"><?php echo $kitchenCount; ?></div>
                </div>
              </div>
            </div>

            <div class="card waiter-card waiter-stat--completed">
              <div class="waiter-stat">
                <div class="waiter-stat-icon"><i class="fas fa-circle-check"></i></div>
                <div class="waiter-stat-body">
                  <div class="waiter-stat-label">Completed Today</div>
                  <div class="waiter-stat-value" id="statCompleted"><?php echo $completedToday; ?></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== TABLES ===== -->
        <div class="section-content" id="tables">
          <h1 class="page-title">Tables</h1>
          <p class="page-subtitle">Assigned tables and available seating</p>

          <div class="waiter-table-section">
            <h2 class="waiter-table-title">My Tables (<span id="myTableCount"><?php echo count($myTables); ?></span>)
            </h2>
            <div class="waiter-table-grid" id="myTablesGrid">
              <?php if (!$myTables) { ?>
                <div class="waiter-table-card">
                  <div class="waiter-table-name">No assigned tables</div>
                </div>
              <?php } else { ?>
                <?php foreach ($myTables as $table) {
                  $imageSrc = $normalizeImagePath($table['image_path'] ?? '', '../Images/Table/4_people table.jpg');
                  ?>
                  <div class="waiter-table-card" data-table-id="<?php echo (int) $table['id']; ?>"
                    data-table-number="<?php echo (int) $table['table_number']; ?>">
                    <div class="waiter-table-media">
                      <img class="waiter-table-img" src="<?php echo htmlspecialchars($imageSrc); ?>"
                        alt="Table <?php echo (int) $table['table_number']; ?>" />
                    </div>
                    <div class="waiter-table-name">Table <?php echo (int) $table['table_number']; ?></div>
                    <div class="waiter-table-meta">Seats: <?php echo (int) $table['capacity']; ?>
                      <?php if (!empty($table['customer_name'])) { ?>
                        <br>Guest: <strong><?php echo htmlspecialchars($table['customer_name']); ?></strong>
                      <?php } ?>
                    </div>
                    <button class="waiter-table-action waiter-table-action--release" type="button"
                      data-release="<?php echo (int) $table['id']; ?>">Release Table</button>
                  </div>
                <?php } ?>
              <?php } ?>
            </div>

            <h2 class="waiter-table-title waiter-table-title--spaced">Available Tables (<span
                id="availTableCount"><?php echo count($availableTables); ?></span>)</h2>
            <div class="waiter-table-grid" id="availTablesGrid">
              <?php if (!$availableTables) { ?>
                <div class="waiter-table-card">
                  <div class="waiter-table-name">No available tables</div>
                </div>
              <?php } else { ?>
                <?php foreach ($availableTables as $table) {
                  $imageSrc = $normalizeImagePath($table['image_path'] ?? '', '../Images/Table/4_people table.jpg');
                  ?>
                  <div class="waiter-table-card" data-table-id="<?php echo (int) $table['id']; ?>"
                    data-table-number="<?php echo (int) $table['table_number']; ?>">
                    <div class="waiter-table-media">
                      <img class="waiter-table-img" src="<?php echo htmlspecialchars($imageSrc); ?>"
                        alt="Table <?php echo (int) $table['table_number']; ?>" />
                    </div>
                    <div class="waiter-table-name">Table <?php echo (int) $table['table_number']; ?></div>
                    <div class="waiter-table-meta">Seats: <?php echo (int) $table['capacity']; ?>
                      <?php 
                      if (($table['status'] ?? '') === 'reserved') {
                        $res = $latestByTable[$table['id']] ?? null;
                        if ($res) {
                          $guest = htmlspecialchars($res['customer_name'] ?? 'Walk-in');
                          $time = date('g:i A', strtotime($res['reserved_time']));
                          echo " - <strong style='color:var(--c-gold)'>RESERVED ($guest at $time)</strong>";
                        } else {
                          echo ' - <strong style="color:var(--c-gold)">RESERVED</strong>';
                        }
                      }
                      ?>
                    </div>
                    <button class="waiter-table-action waiter-table-action--take" type="button"
                      data-take="<?php echo (int) $table['id']; ?>">Take Table</button>
                  </div>
                <?php } ?>
              <?php } ?>
            </div>
          </div>
        </div>

        <!-- ===== ORDER ===== -->
        <div class="section-content" id="order">
          <div class="order-header">
            <div>
              <h1 class="page-title">My Orders (<span id="orderCount"><?php echo count($ordersWithItems); ?></span>)
              </h1>
            </div>
            <button class="order-new-btn" type="button" data-new-order>+ New Order</button>
          </div>

          <div class="order-list" id="orderList">
            <?php if (!$ordersWithItems) { ?>
              <div class="order-card">
                <div class="order-card-top">
                  <div class="order-left">
                    <div class="order-head">
                      <div>
                        <div class="order-table">No orders yet</div>
                        <div class="order-muted">Start a new order from the button above.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            <?php } else { ?>
              <?php foreach ($ordersWithItems as $order) {
                $imageSrc = $normalizeImagePath($order['image_path'] ?? '', '../Images/Table/4_people table.jpg');
                $status = $order['status'] ?? 'queued';
                $tableNumber = $order['table_number'] ?? 'N/A';
                $guestName = $order['guest_name'] ?? 'Walk-in';
                $statusLabel = formatWaiterStatusLabel($status);
                $statusClass = waiterStatusClass($status);
                ?>
                <div class="order-card" data-order-id="<?php echo (int) $order['id']; ?>">
                  <div class="order-card-top">
                    <div class="order-left">
                      <div class="order-head">
                        <div class="order-thumb">
                          <img src="<?php echo htmlspecialchars($imageSrc); ?>"
                            alt="Table <?php echo htmlspecialchars((string) $tableNumber); ?>" />
                        </div>
                        <div>
                          <div class="order-table">Table <?php echo htmlspecialchars((string) $tableNumber); ?></div>
                          <div class="order-muted"><?php echo htmlspecialchars($guestName); ?></div>
                          <div class="order-muted"><?php echo date('g:i A', strtotime($order['created_at'] ?? 'now')); ?>
                          </div>
                        </div>
                      </div>
                      <div class="order-items">
                        <?php if (!empty($order['items'])) { ?>
                          <?php foreach ($order['items'] as $item) { ?>
                            <div><?php echo (int) $item['quantity']; ?>× <?php echo htmlspecialchars($item['name']); ?></div>
                          <?php } ?>
                        <?php } else { ?>
                          <div>No items</div>
                        <?php } ?>
                      </div>
                      <div class="order-total-label">Total (incl. tax)</div>
                    </div>
                    <div class="order-right">
                      <div class="order-status <?php echo $statusClass; ?>"><?php echo htmlspecialchars($statusLabel); ?>
                      </div>
                      <div class="order-prices">
                        <?php if (!empty($order['items'])) { ?>
                          <?php foreach ($order['items'] as $item) { ?>
                            <div class="order-price"><?php echo (int) $item['quantity']; ?>×
                              $<?php echo number_format((float) $item['price'], 2); ?> =
                              $<?php echo number_format((float) $item['subtotal'], 2); ?></div>
                          <?php } ?>
                        <?php } ?>
                        <div class="order-grand">$<?php echo number_format((float) ($order['total_amount'] ?? 0), 2); ?>
                        </div>
                      </div>
                      <?php if (strtolower($status) === 'ready') { ?>
                        <button class="order-delivered-btn" type="button" data-deliver-order>Mark as Delivered</button>
                      <?php } ?>
                    </div>
                  </div>
                </div>
              <?php } ?>
            <?php } ?>
          </div>

          <!-- New Order Modal -->
          <div class="order-modal" id="newOrderModal" aria-hidden="true" inert>
            <div class="order-modal-backdrop" data-order-close></div>
            <div class="order-modal-content" role="dialog" aria-modal="true" aria-label="New Order">
              <div class="order-modal-header">
                <div class="order-modal-title">New Order</div>
                <button class="order-modal-x" type="button" data-order-close aria-label="Close">&times;</button>
              </div>

              <div class="order-form">
                <label class="order-label" for="orderTableSelect">Table:</label>
                <select id="orderTableSelect" class="order-select">
                  <option value="">— Select Table —</option>
                  <?php if ($myTables) { ?>
                    <optgroup label="My Tables">
                      <?php foreach ($myTables as $table) { ?>
                        <option id="table-option-<?php echo (int) $table['id']; ?>"
                          value="<?php echo (int) $table['id']; ?>">Table <?php echo (int) $table['table_number']; ?>
                        </option>
                      <?php } ?>
                    </optgroup>
                  <?php } ?>
                  <?php if ($availableTables) { ?>
                    <optgroup label="Available Tables">
                      <?php foreach ($availableTables as $table) { ?>
                        <option id="table-option-<?php echo (int) $table['id']; ?>"
                          value="<?php echo (int) $table['id']; ?>">Table <?php echo (int) $table['table_number']; ?>
                        </option>
                      <?php } ?>
                    </optgroup>
                  <?php } ?>
                </select>
              </div>

              <div class="order-items-grid" aria-label="Menu items">
                <?php if (!$menuItems) { ?>
                  <div class="order-selected-title">No menu items available.</div>
                <?php } else { ?>
                  <?php foreach ($menuItems as $item) { ?>
                    <button class="order-item-chip" type="button" data-menu-item
                      data-name="<?php echo htmlspecialchars($item['name']); ?>"
                      data-price="<?php echo number_format((float) $item['price'], 2, '.', ''); ?>"
                      data-recipe-id="<?php echo (int) $item['id']; ?>">
                      <?php echo htmlspecialchars($item['name']); ?><span>$<?php echo number_format((float) $item['price'], 2); ?></span>
                    </button>
                  <?php } ?>
                <?php } ?>
              </div>

              <div class="order-selected">
                <div class="order-selected-title">Selected Items:</div>
                <div class="order-selected-list" id="selectedItemsList"><span
                    style="color:rgba(254,254,255,0.45);font-style:italic">No items selected</span></div>
                <div class="order-selected-footer">
                  <div class="order-selected-total" id="selectedItemsTotal">$0.00</div>
                  <div class="order-selected-actions">
                    <button class="order-place-btn" type="button" data-order-place>Place Order</button>
                    <button class="order-cancel-btn" type="button" data-order-close>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== PROFILE ===== -->
        <div class="section-content" id="profile">
          <h1 class="page-title">Profile</h1>
          <p class="page-subtitle">Your account details and settings</p>

          <div class="profile-card">
            <div class="profile-left">
              <div class="profile-avatar">
                <img
                  src="<?php echo htmlspecialchars($normalizeImagePath($user['avatar_path'] ?? '', '../Images/Customer/pexels-emad-hussien-830139385-27856326.jpg')); ?>"
                  alt="Profile photo" />
              </div>
              <div class="profile-info">
                <div class="profile-name" id="displayName"><?php echo htmlspecialchars($user['name'] ?? ''); ?></div>
                <div class="profile-sub">Waiter · Member since
                  <?php echo !empty($user['created_at']) ? date('M Y', strtotime($user['created_at'])) : 'N/A'; ?></div>
                <div class="profile-rows">
                  <div class="profile-row">
                    <i class="fa-solid fa-envelope"></i>
                    <span id="displayEmail"><?php echo htmlspecialchars($user['email'] ?? ''); ?></span>
                  </div>
                  <div class="profile-row">
                    <i class="fa-solid fa-phone"></i>
                    <span id="displayPhone"><?php echo htmlspecialchars($user['phone'] ?? ''); ?></span>
                  </div>
                  <div class="profile-row">
                    <i class="fa-solid fa-location-dot"></i>
                    <span id="displayLocation"><?php echo htmlspecialchars($user['address'] ?? ''); ?></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile-right">
              <button class="profile-settings-btn" id="openSettingsBtn" type="button">
                <i class="fa-solid fa-gear"></i>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
        <!-- ======= Settings Picker Modal ======= -->
        <div class="modal-overlay" id="settingsOverlay" role="dialog" aria-modal="true">
          <div class="settings-modal">
            <h3 class="settings-modal-title">Settings</h3>
            <p class="settings-modal-sub">What would you like to update?</p>
            <div class="settings-options">
              <button class="settings-option-btn" id="openEditProfile">
                <span class="option-icon"><i class="far fa-user-circle"></i></span>
                <div class="option-text">
                  <span class="option-label">Edit Profile</span>
                  <span class="option-desc">Update your name, phone &amp; address</span>
                </div>
                <i class="fas fa-chevron-right option-arrow"></i>
              </button>
              <button class="settings-option-btn" id="openEditPassword">
                <span class="option-icon"><i class="fas fa-lock"></i></span>
                <div class="option-text">
                  <span class="option-label">Change Password</span>
                  <span class="option-desc">Update your current password</span>
                </div>
                <i class="fas fa-chevron-right option-arrow"></i>
              </button>
            </div>
            <button class="modal-cancel-btn" id="closeSettings">Cancel</button>
          </div>
        </div>

        <!-- ======= Edit Profile Modal ======= -->
        <div class="modal-overlay" id="editProfileOverlay" role="dialog" aria-modal="true">
          <div class="form-modal">
            <h3 class="form-modal-title"><i class="far fa-user-circle"></i> Update Profile</h3>
            <div class="form-grid">
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputName"><i class="far fa-id-card"></i> Full Name</label>
                <input type="text" id="inputName" class="form-input-cp" placeholder="Your full name" />
                <span class="field-error" id="nameError"></span>
              </div>
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputAddress"><i class="fas fa-location-dot"></i> Address</label>
                <input type="text" id="inputAddress" class="form-input-cp" placeholder="Your address" />
                <span class="field-error" id="addressError"></span>
              </div>
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputPhone"><i class="fas fa-phone"></i> Phone Number</label>
                <input type="tel" id="inputPhone" class="form-input-cp" placeholder="+1 (555) 000-0000" />
                <span class="field-error" id="phoneError"></span>
              </div>
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputEmail"><i class="far fa-envelope"></i> Email</label>
                <input type="email" id="inputEmail" class="form-input-cp" placeholder="you@email.com" />
                <span class="field-error" id="emailError"></span>
              </div>
            </div>
            <div class="form-actions-cp">
              <button class="btn-update-cp" id="saveProfile">Update Profile</button>
              <button class="btn-cancel-cp" id="closeEditProfile">Cancel</button>
            </div>
          </div>
        </div>

        <!-- ======= Change Password Modal ======= -->
        <div class="modal-overlay" id="editPasswordOverlay" role="dialog" aria-modal="true">
          <div class="form-modal form-modal--narrow">
            <h3 class="form-modal-title"><i class="fas fa-lock"></i> Change Password</h3>
            <div class="form-grid form-grid--single">
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputCurrentPwd"><i class="fas fa-key"></i> Current Password</label>
                <div class="pw-wrap-cp">
                  <input type="password" id="inputCurrentPwd" class="form-input-cp"
                    placeholder="Enter current password" />
                  <button type="button" class="pw-toggle-cp" data-target="inputCurrentPwd"><i
                      class="far fa-eye"></i></button>
                </div>
                <span class="field-error" id="currentPwdError"></span>
              </div>
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputNewPwd"><i class="fas fa-lock-open"></i> New Password</label>
                <div class="pw-wrap-cp">
                  <input type="password" id="inputNewPwd" class="form-input-cp" placeholder="At least 8 characters" />
                  <button type="button" class="pw-toggle-cp" data-target="inputNewPwd"><i
                      class="far fa-eye"></i></button>
                </div>
                <div class="strength-bar">
                  <div class="strength-fill" id="strengthFill"></div>
                </div>
                <span class="strength-label" id="strengthLabel"></span>
                <span class="field-error" id="newPwdError"></span>
              </div>
              <div class="form-group-cp">
                <label class="form-label-cp" for="inputConfirmPwd"><i class="fas fa-check-double"></i> Confirm
                  Password</label>
                <div class="pw-wrap-cp">
                  <input type="password" id="inputConfirmPwd" class="form-input-cp"
                    placeholder="Re-enter new password" />
                  <button type="button" class="pw-toggle-cp" data-target="inputConfirmPwd"><i
                      class="far fa-eye"></i></button>
                </div>
                <span class="field-error" id="confirmPwdError"></span>
              </div>
            </div>
            <div class="form-actions-cp">
              <button class="btn-update-cp" id="savePassword">Update Password</button>
              <button class="btn-cancel-cp" id="closeEditPassword">Cancel</button>
            </div>
          </div>
        </div>

        <!-- ======= Toast ======= -->
        <div class="success-toast" id="successToast" role="status" aria-live="polite">
          <span class="toast-icon"><i class="fas fa-check"></i></span>
          <span class="toast-msg">Order placed successfully!</span>
        </div>

        <script src="../JavaScript/waiter.js"></script>
</body>

</html>
