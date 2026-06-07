<?php
session_start();
if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? '') !== 'chief') {
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

$clockStmt = $pdo->prepare('SELECT is_clocked_in, last_clock_in, last_clock_out FROM chiefs WHERE user_id = ?');
$clockStmt->execute([$userId]);
$clockData = $clockStmt->fetch() ?: [];
$isClockedIn = (int) ($clockData['is_clocked_in'] ?? 0);
$lastClockIn = $clockData['last_clock_in'] ?? '';
$lastClockOut = $clockData['last_clock_out'] ?? '';

$pendingCount = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'queued'")->fetchColumn();
$progressCount = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'in_progress'")->fetchColumn();
$completedToday = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'served' AND DATE(created_at) = CURDATE()")
    ->fetchColumn();

$orderStmt = $pdo->query(
    "SELECT o.id, o.status, o.created_at, o.table_id, rt.table_number, rt.image_path
     FROM orders o
     LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
     WHERE o.status IN ('queued','in_progress','ready')
     ORDER BY o.created_at ASC"
);
$orders = $orderStmt->fetchAll() ?: [];

$ordersWithItems = [];
$itemStmt = $pdo->prepare('SELECT name, quantity FROM order_items WHERE order_id = ?');
foreach ($orders as $order) {
    $itemStmt->execute([$order['id']]);
    $order['items'] = $itemStmt->fetchAll() ?: [];
    $ordersWithItems[] = $order;
}

$recipesStmt = $pdo->prepare(
    "SELECT id, name, description, price, image_path, status, created_at
     FROM recipes
     WHERE chef_id = ?
     ORDER BY created_at DESC"
);
$recipesStmt->execute([$userId]);
$recipes = $recipesStmt->fetchAll() ?: [];

$normalizeImagePath = function ($path, $fallback) {
    if (!$path) {
        return $fallback;
    }
    if (strpos($path, 'http') === 0 || strpos($path, '../') === 0) {
        return $path;
    }
    return '../' . ltrim($path, '/');
};

function formatOrderStatus($status) {
    $status = strtolower(trim($status));
    if ($status === 'in_progress') return 'In Progress';
    if ($status === 'queued') return 'Queued';
    if ($status === 'ready') return 'Ready';
    if ($status === 'served') return 'Served';
    return ucfirst($status);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feliciano — Chief Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <link rel="stylesheet" href="../CSS/chief.css" />
  <link rel="stylesheet" href="../CSS/responsive.css">
</head>
<body data-clocked="<?php echo $isClockedIn ? '1' : '0'; ?>" data-last-clock-in="<?php echo htmlspecialchars($lastClockIn); ?>" data-last-clock-out="<?php echo htmlspecialchars($lastClockOut); ?>">
  <div class="dashboard">
     <!-- Topbar -->
    <header class="topbar">
      <div class="brand">Feliciano</div>
      <div class="top-right">
        <div class="admin-title">Chief<br>Dashboard</div>
        <div class="logout" onclick="window.location.href='login.html'">
          <img src="../Images/logout.png" alt="Logout" class="logout-icon">
         </div>
      </div>
    </header>
    <!-- Outer glass wrapper -->
    <div class="outer-wrapper">
         <section class="panel hero">
            <div>
                <p class="eyebrow">Kitchen command center</p>
                <h1 class="page-title">Work Status</h1>
                <p class="page-subtitle">You are currently in the kitchen. Track orders, manage recipes, and keep the shift moving from one shared interface.</p>
                <div class="shift-clock">
                  <span class="shift-clock-label">Shift timer</span>
                  <span class="shift-clock-value" id="shiftTimer">Not clocked in</span>
                </div>
            </div>
            <button class="btn btn-primary" data-clock-out>Clock Out</button>
        </section>
      <!-- Navbar / Tabs -->
      <nav class="navbar">
        <div class="tab active" data-section="overview">
          <i class="fas fa-chart-pie"></i>
          <span>Overview</span>
        </div>
        <div class="tab" data-section="tables">
          <i class="fas fa-chair"></i>
          <span>Order</span>
        </div>
        <div class="tab" data-section="order">
          <i class="fas fa-utensils"></i>
          <span>Recipes</span>
        </div>
        <div class="tab" data-section="profile">
          <i class="fas fa-user"></i>
          <span>Profile</span>
        </div>
      </nav>

      <!-- Main Scrollable Content -->
      <main class="main-content">

        <!-- ===================== OVERVIEW ===================== -->
        <div class="section-content active" id="overview">

          <h1 class="page-title">Overview</h1>
          <p class="page-subtitle">Your shift status at a glance</p>

          <div class="stats waiter-stats">
            <div class="card waiter-card waiter-stat--pending">
              <div class="waiter-stat">
                <div class="waiter-stat-icon" aria-hidden="true">
                  <i class="fas fa-receipt"></i>
                </div>
                <div class="waiter-stat-body">
                  <div class="waiter-stat-label">Pending Orders</div>
                  <div class="waiter-stat-value" id="statPending"><?php echo $pendingCount; ?></div>
                </div>
              </div>
            </div>

            <div class="card waiter-card waiter-stat--progress">
              <div class="waiter-stat">
                <div class="waiter-stat-icon" aria-hidden="true">
                  <i class="fas fa-hourglass-half"></i>
                </div>
                <div class="waiter-stat-body">
                  <div class="waiter-stat-label">In Progress</div>
                  <div class="waiter-stat-value" id="statProgress"><?php echo $progressCount; ?></div>
                </div>
              </div>
            </div>

            <div class="card waiter-card waiter-stat--completed">
              <div class="waiter-stat">
                <div class="waiter-stat-icon" aria-hidden="true">
                  <i class="fas fa-circle-check"></i>
                </div>
                <div class="waiter-stat-body">
                  <div class="waiter-stat-label">Completed Today</div>
                  <div class="waiter-stat-value" id="statCompleted"><?php echo $completedToday; ?></div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-grid">
            <article class="card card-pad grid-6">
              <div class="card-head">
                <div>
                  <h2 class="card-title">Shift Snapshot</h2>
                  <p class="card-subtitle">A quick view of the kitchen rhythm for the current shift.</p>
                </div>
                <span class="status-badge">Live</span>
              </div>

              <div class="metrics-list">
                <div class="list-row">
                  <div>
                    <strong>Queued tickets</strong>
                    <p><?php echo $pendingCount; ?> waiting in queue</p>
                  </div>
                  <span class="pill">Queued</span>
                </div>

                <div class="list-row">
                  <div>
                    <strong>Active tickets</strong>
                    <p><?php echo $progressCount; ?> in progress</p>
                  </div>
                  <span class="pill">Cooking</span>
                </div>
                <div class="list-row">
                  <div>
                    <strong>Completed</strong>
                    <p><?php echo $completedToday; ?> served today</p>
                  </div>
                  <span class="pill">Served</span>
                </div>
              </div>
            </article>

            <article class="card card-pad grid-6">
              <div class="card-head">
                <div>
                  <h2 class="card-title">Immediate Focus</h2>
                  <p class="card-subtitle">The next actions the chief should watch closely.</p>
                </div>
              </div>
              <div class="metrics-list">
                <div class="list-row">
                  <div>
                    <strong>Next ready handoff</strong>
                    <p>Monitor ready tickets for pickup</p>
                  </div>
                  <span class="pill">Ready</span>
                </div>

                <div class="list-row">
                  <div>
                    <strong>Recipe approvals</strong>
                    <p>New recipes await admin review</p>
                  </div>
                  <span class="pill">Pending</span>
                </div>

                <div class="list-row">
                  <div>
                    <strong>Order queue</strong>
                    <p>Keep prep aligned with queued tickets</p>
                  </div>
                  <span class="pill">Queue</span>
                </div>
              </div>
            </article>
          </div>
        </div>
        <!-- ===================== ORDER (CARDS) ===================== -->
        <div class="section-content" id="tables">
          <h1 class="page-title">Table Orders</h1>
          <p class="page-subtitle">Kitchen queue and handoff status</p>

          <div class="section-grid" id="kitchenOrdersGrid">
            <?php if (!$ordersWithItems) { ?>
              <article class="card order-card grid-6">
                <div class="order-body">
                  <div class="card-head">
                    <div>
                      <h3 class="card-title">No active orders</h3>
                      <p class="card-subtitle">The kitchen queue is empty.</p>
                    </div>
                  </div>
                </div>
              </article>
            <?php } else { ?>
              <?php foreach ($ordersWithItems as $order) {
                  $status = strtolower($order['status'] ?? 'queued');
                  $tableNumber = $order['table_number'] ?? 'N/A';
                  $imageSrc = $normalizeImagePath($order['image_path'] ?? '', '../Images/Table/4_people table.jpg');
              ?>
                <article class="card order-card grid-6" data-order-id="<?php echo (int) $order['id']; ?>" data-order-status="<?php echo htmlspecialchars($status); ?>">
                  <img class="order-image" src="<?php echo htmlspecialchars($imageSrc); ?>" alt="Table <?php echo htmlspecialchars((string) $tableNumber); ?>">
                  <div class="order-body">
                    <div class="card-head">
                      <div>
                        <h3 class="card-title">Table <?php echo htmlspecialchars((string) $tableNumber); ?></h3>
                        <p class="card-subtitle">Placed <?php echo date('g:i A', strtotime($order['created_at'] ?? 'now')); ?></p>
                      </div>
                      <span class="status-badge"><?php echo htmlspecialchars(formatOrderStatus($status)); ?></span>
                    </div>
                    <div class="order-meta">
                      <?php if (!empty($order['items'])) { ?>
                        <?php foreach ($order['items'] as $item) { ?>
                          <span class="pill"><?php echo (int) $item['quantity']; ?>x <?php echo htmlspecialchars($item['name']); ?></span>
                        <?php } ?>
                      <?php } else { ?>
                        <span class="pill">No items</span>
                      <?php } ?>
                    </div>
                    <div class="divider"></div>
                    <div class="actions">
                      <?php if ($status !== 'ready') { ?>
                        <button class="btn btn-secondary" type="button" data-mark-ready>Mark Ready</button>
                      <?php } ?>
                      <span class="pill"><?php echo htmlspecialchars(formatOrderStatus($status)); ?></span>
                    </div>
                  </div>
                </article>
              <?php } ?>
            <?php } ?>
          </div>
        </div>

        <!-- ===================== RECIPES ===================== -->
        <div class="section-content" id="order">
          <div class="order-header">
            <div>
              <h1 class="page-title">Recipes</h1>
              <p class="page-subtitle">Images, details, price, and approval status</p>
            </div>
            <button class="order-new-btn" type="button" data-add-recipe>+ Add Recipe</button>
          </div>

          <div class="section-grid" id="recipesGrid">
            <?php if (!$recipes) { ?>
              <article class="card order-card recipe-card grid-6">
                <div class="order-body">
                  <div class="card-head">
                    <div>
                      <h3 class="card-title">No recipes yet</h3>
                      <p class="card-subtitle">Add your first recipe for approval.</p>
                    </div>
                  </div>
                </div>
              </article>
            <?php } else { ?>
              <?php foreach ($recipes as $recipe) {
                  $imageSrc = $normalizeImagePath($recipe['image_path'] ?? '', '../Images/food/default.png');
                  $status = strtolower($recipe['status'] ?? 'pending');
              ?>
                <article class="card order-card recipe-card grid-6" data-recipe-id="<?php echo (int) $recipe['id']; ?>">
                  <span class="status-badge corner-badge"><?php echo htmlspecialchars(ucfirst($status)); ?></span>
                  <img class="order-image" src="<?php echo htmlspecialchars($imageSrc); ?>" alt="<?php echo htmlspecialchars($recipe['name'] ?? 'Recipe'); ?>" />
                  <div class="order-body">
                    <div class="card-head">
                      <div>
                        <h3 class="card-title"><?php echo htmlspecialchars($recipe['name'] ?? 'Recipe'); ?></h3>
                        <p class="card-subtitle"><?php echo $status === 'approved' ? 'Live on menu' : 'Awaiting approval'; ?></p>
                      </div>
                    </div>
                    <div class="order-meta">
                      <span class="pill"><?php echo $status === 'approved' ? 'Approved' : 'Pending'; ?></span>
                    </div>
                    <p class="recipe-desc">Details: <?php echo htmlspecialchars($recipe['description'] ?? ''); ?></p>
                    <div class="divider"></div>
                    <div class="actions recipe-actions">
                      <span class="pill recipe-price">$<?php echo number_format((float) ($recipe['price'] ?? 0), 2); ?></span>
                      <button class="order-edit-btn" data-edit-recipe>Edit</button>
                    </div>
                  </div>
                </article>
              <?php } ?>
            <?php } ?>
          </div>
        </div>
          <!-- Add Recipe Modal -->
<div class="recipe-modal" id="addRecipeModal" aria-hidden="true" inert>
  <div class="recipe-modal-backdrop" data-recipe-close></div>
  <div class="recipe-modal-box" role="dialog" aria-modal="true" aria-label="Add Recipe">

    <div class="recipe-modal-head">
      <div class="recipe-modal-heading">
        <i class="fas fa-bowl-food"></i>
        Add Recipe
      </div>
      <button class="recipe-modal-close" type="button" data-recipe-close aria-label="Close">&times;</button>
    </div>

    <form class="recipe-form" id="addRecipeForm">

      <div class="recipe-row">
        <div class="recipe-field recipe-field--full">
          <label class="recipe-label" for="recipeName">Recipe Name</label>
          <input class="recipe-input" id="recipeName" name="recipeName" type="text" placeholder="e.g., Seafood Trio" required />
          <span class="recipe-error" id="recipeNameError"></span>
        </div>
      </div>

      <div class="recipe-row recipe-row--full">
        <div class="recipe-field">
          <label class="recipe-label" for="recipeDetails">Details</label>
          <textarea class="recipe-input recipe-textarea" id="recipeDetails" name="recipeDetails" rows="4" placeholder="Ingredients / short description" required></textarea>
          <span class="recipe-error" id="recipeDetailsError"></span>
        </div>
      </div>

      <div class="recipe-row">
        <div class="recipe-field">
          <label class="recipe-label" for="recipePrice">Price</label>
          <input class="recipe-input" id="recipePrice" name="recipePrice" type="number" step="0.01" min="0" placeholder="e.g., 12.99" required />
          <span class="recipe-error" id="recipePriceError"></span>
        </div>
        <div class="recipe-field">
          <label class="recipe-label" for="recipeImageFile">Recipe Image</label>
          <input class="recipe-input recipe-file" id="recipeImageFile" name="recipeImageFile" type="file" accept="image/*" />
        </div>
      </div>

      <img class="recipe-preview" id="recipeImagePreview" alt="Recipe preview" style="display: none;" />

      <div class="recipe-form-footer">
        <button class="order-place-btn recipe-btn-add" type="submit">Add Recipe</button>
        <button class="order-cancel-btn recipe-btn-cancel" type="button" data-recipe-close>Cancel</button>
      </div>

    </form>
  </div>
</div>
        <!-- ===================== PROFILE ===================== -->
        <div class="section-content" id="profile">
          <h1 class="page-title">Profile</h1>
          <p class="page-subtitle">Your account details and settings</p>

          <div class="profile-card">
            <div class="profile-left">
              <div class="profile-avatar" aria-hidden="true">
                <img src="<?php echo htmlspecialchars($normalizeImagePath($user['avatar_path'] ?? '', '../Images/Customer/pexels-emad-hussien-830139385-27856326.jpg')); ?>" alt="Profile" />
              </div>

              <div class="profile-info">
                <div class="profile-name" id="displayName"><?php echo htmlspecialchars($user['name'] ?? ''); ?></div>
                <div class="profile-sub">Member since <?php echo !empty($user['created_at']) ? date('M Y', strtotime($user['created_at'])) : 'N/A'; ?></div>

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
          <input type="password" id="inputCurrentPwd" class="form-input-cp" placeholder="Enter current password" />
          <button type="button" class="pw-toggle-cp" data-target="inputCurrentPwd"><i class="far fa-eye"></i></button>
        </div>
        <span class="field-error" id="currentPwdError"></span>
      </div>
      <div class="form-group-cp">
        <label class="form-label-cp" for="inputNewPwd"><i class="fas fa-lock-open"></i> New Password</label>
        <div class="pw-wrap-cp">
          <input type="password" id="inputNewPwd" class="form-input-cp" placeholder="At least 8 characters" />
          <button type="button" class="pw-toggle-cp" data-target="inputNewPwd"><i class="far fa-eye"></i></button>
        </div>
        <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
        <span class="strength-label" id="strengthLabel"></span>
        <span class="field-error" id="newPwdError"></span>
      </div>
      <div class="form-group-cp">
        <label class="form-label-cp" for="inputConfirmPwd"><i class="fas fa-check-double"></i> Confirm Password</label>
        <div class="pw-wrap-cp">
          <input type="password" id="inputConfirmPwd" class="form-input-cp" placeholder="Re-enter new password" />
          <button type="button" class="pw-toggle-cp" data-target="inputConfirmPwd"><i class="far fa-eye"></i></button>
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

        <div class="success-toast" id="successToast" role="status" aria-live="polite">
  <span class="toast-icon"><i class="fas fa-check"></i></span>
  <span class="toast-msg">Recipe added successfully!</span>
</div>

  </div>
  <script src="../JavaScript/chief.js"></script>
</body>
</html>
