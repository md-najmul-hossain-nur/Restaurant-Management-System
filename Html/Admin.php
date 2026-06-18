<?php
session_start();

// Load DB for server-side rendering and to verify the current session role.
require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';

restoreRoleSession('admin');
$sessionRole = strtolower(trim((string) ($_SESSION['role'] ?? '')));
if (isset($_SESSION['user_id']) && $sessionRole !== 'admin') {
  $roleStmt = $pdo->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
  $roleStmt->execute([(int) $_SESSION['user_id']]);
  $dbRole = strtolower(trim((string) $roleStmt->fetchColumn()));

  if ($dbRole !== '') {
    $_SESSION['role'] = $dbRole;
    $sessionRole = $dbRole;
  }
}

if (!isset($_SESSION['user_id']) || $sessionRole !== 'admin') {
  header('Location: login.html');
  exit;
}

// Fetch real-time stats
$empCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role IN ('chief', 'waiter')")->fetchColumn();
$tableCount = (int)$pdo->query("SELECT COUNT(*) FROM restaurant_tables WHERE status = 'available'")->fetchColumn();
$menuCount = (int)$pdo->query("SELECT COUNT(*) FROM recipes WHERE status = 'approved'")->fetchColumn();
$rev = $pdo->query("SELECT SUM(total_amount) FROM orders WHERE status = 'served' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())")->fetchColumn();
$monthlyRevenue = $rev ? number_format((float)$rev, 2) : '0.00';
$completedToday = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'served' AND DATE(created_at) = CURDATE()")->fetchColumn();

// Fetch Employee Attendance
$attendanceStmt = $pdo->query("
    SELECT u.name, u.role, c.is_clocked_in, c.last_clock_in, c.last_clock_out 
    FROM users u JOIN chiefs c ON u.id = c.user_id 
    UNION 
    SELECT u.name, u.role, w.is_clocked_in, w.last_clock_in, w.last_clock_out 
    FROM users u JOIN waiters w ON u.id = w.user_id
    ORDER BY role, name
");
$attendances = $attendanceStmt->fetchAll() ?: [];
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feliciano — Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="../CSS/admin.css" />
  <link rel="stylesheet" href="../CSS/responsive.css">
</head>

<body>
  <div class="dashboard">
    <!-- Topbar -->
    <header class="topbar">
      <div class="brand">Feliciano</div>
      <div class="top-right">
        <div class="admin-title">Admin<br>Dashboard</div>
        <div class="logout" onclick="window.location.href='../Php/logout.php'">
          <img src="../Images/logout.png" alt="Logout" class="logout-icon">
        </div>
      </div>
    </header>

    <!-- Outer glass wrapper -->
    <div class="outer-wrapper">

      <!-- Hero -->
      <section class="panel hero">
        <div>
          <p class="eyebrow">Executive Control Center</p>
          <h1 class="page-title" id="globalPageTitle">Overview</h1>
          <p class="page-subtitle" id="globalPageSubtitle">Manage your restaurant performance, employees, and services
            from one central dashboard.</p>
        </div>
      </section>

      <!-- Navbar / Tabs -->
      <nav class="navbar">
        <div class="tab active" data-section="overview">
          <i class="fas fa-chart-pie"></i>
          <span>Overview</span>
        </div>
        <div class="tab" data-section="employees">
          <i class="fas fa-users"></i>
          <span>Employees</span>
        </div>
        <div class="tab" data-section="customer">
          <i class="fas fa-user-check"></i>
          <span>Customer</span>
        </div>
        <div class="tab" data-section="chat">
          <i class="fas fa-comments"></i>
          <span>Chat</span>
        </div>
        <div class="tab" data-section="tables">
          <i class="fas fa-chair"></i>
          <span>Tables</span>
        </div>
        <div class="tab" data-section="menu">
          <i class="fas fa-utensils"></i>
          <span>Menu Items</span>
        </div>
        <div class="tab" data-section="reports">
          <i class="fas fa-chart-bar"></i>
          <span>Reports</span>
        </div>
      </nav>

      <!-- Main Scrollable Content -->
      <main class="main-content">

        <!-- ===================== OVERVIEW ===================== -->
        <div class="section-content active" id="overview">

          <!-- Global hero handles the title now -->

          <div class="stats">
            <div class="card">
              <div class="icon-box blue">
                <i class="fas fa-users"></i>
              </div>
              <h3 class="blue"><?php echo $empCount; ?></h3>
              <p>Total Employees</p>
            </div>
            <div class="card">
              <div class="icon-box green">
                <i class="fas fa-chair"></i>
              </div>
              <h3 class="green"><?php echo $tableCount; ?></h3>
              <p>Available Tables</p>
            </div>
            <div class="card">
              <div class="icon-box orange">
                <i class="fas fa-utensils"></i>
              </div>
              <h3 class="orange"><?php echo $menuCount; ?></h3>
              <p>Menu Items</p>
            </div>
            <div class="card">
              <div class="icon-box gold">
                <i class="fas fa-dollar-sign"></i>
              </div>
              <h3 class="gold">$<?php echo $monthlyRevenue; ?></h3>
              <p>Monthly Revenue</p>
            </div>
          </div>

        </div>

        <!-- ===================== EMPLOYEES ===================== -->
        <div class="section-content" id="employees">

          <div class="employees-header">
            <div>
              <h2>Employee Management</h2>
              <p class="sub">Add and manage chefs and waiters</p>
            </div>
            <button class="add-employee-btn" type="button" id="openAddEmployee">
              <i class="fas fa-plus"></i> Add Employee
            </button>
          </div>

          <div class="employees-grid">
            <?php
            // Fetch employees (chiefs and waiters) from DB
            $stmt = $pdo->prepare(
              "SELECT u.id, u.name, u.email, u.role, COALESCE(u.created_at, NOW()) AS created_at,
                  c.certificate_path, w.shift,
                  COALESCE(c.is_clocked_in, w.is_clocked_in, 0) AS is_clocked_in,
                  COALESCE(c.last_clock_in, w.last_clock_in) AS last_clock_in,
                  COALESCE(c.last_clock_out, w.last_clock_out) AS last_clock_out
               FROM users u
               LEFT JOIN chiefs c ON c.user_id = u.id
               LEFT JOIN waiters w ON w.user_id = u.id
               WHERE u.role IN ('chief','waiter')
               ORDER BY u.created_at DESC"
            );
            $stmt->execute();
            $employees = $stmt->fetchAll();

            if (!$employees) {
              echo '<div class="employee-empty">No employees yet.</div>';
            } else {
              foreach ($employees as $emp) {
                $addedTs = $emp['created_at'] ? strtotime($emp['created_at']) : time();
                $added = htmlspecialchars(date('c', $addedTs));
                $name = htmlspecialchars($emp['name']);
                $email = htmlspecialchars($emp['email']);
                $role = htmlspecialchars($emp['role']);
                $roleLabel = $role === 'chief' ? 'Chef' : 'Waiter';
                $isClocked = 0;
                $lastClock = null;
                $lastClockOut = null;
                if (!empty($emp['is_clocked_in']))
                  $isClocked = (int) $emp['is_clocked_in'];
                if (!empty($emp['last_clock_in']))
                  $lastClock = htmlspecialchars(date('c', strtotime($emp['last_clock_in'])));
                if (!empty($emp['last_clock_out']))
                  $lastClockOut = htmlspecialchars(date('c', strtotime($emp['last_clock_out'])));

                $dataAttrs = "data-added=\"{$added}\"";
                if ($isClocked && $lastClock)
                  $dataAttrs .= " data-clock-in=\"{$lastClock}\" data-clocked=\"1\"";
                if (!$isClocked && $lastClockOut)
                  $dataAttrs .= " data-clock-out=\"{$lastClockOut}\" data-clocked=\"0\"";

                echo "<div class=\"employee-card\" {$dataAttrs}>";
                echo "  <div class=\"employee-info\">";
                echo "    <h4>{$name}</h4>";
                echo "    <p>{$email}</p>";
                echo "    <div class=\"status-badges\">";
                if ($isClocked) {
                  echo "      <span class=\"badge clocked-in\"><i class=\"fas fa-check-circle\"></i> Working</span>";
                } else {
                  echo "      <span class=\"badge clocked-out\"><i class=\"fas fa-clock\"></i> Clocked Out</span>";
                }
                echo "      <span class=\"badge approved\"><i class=\"fas fa-check\"></i> Approved</span>";
                echo "    </div>";
                echo "  </div>";
                echo "  <div class=\"employee-actions\">";
                echo "    <span class=\"role-badge {$role}\">{$roleLabel}</span>";
                echo "  </div>";
                echo "</div>";
              }
            }
            ?>
          </div>

          <!-- Employee Attendance Table -->
          <div class="attendance-container panel">
            <h3 style="margin-bottom: 15px; color: var(--gold); font-size: 1.2rem;">Clock-in History</h3>
            <div class="responsive-table-wrapper">
              <table class="table attendance-table">
                <thead>
                  <tr class="table-header-row">
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Clock In</th>
                    <th>Last Clock Out</th>
                  </tr>
                </thead>
              <tbody>
                <?php if (empty($attendances)) { ?>
                  <tr><td colspan="5" style="padding: 10px; text-align: center; opacity: 0.5;">No records</td></tr>
                <?php } else { ?>
                  <?php foreach ($attendances as $att) { 
                      $in = $att['last_clock_in'] ? date('M j, Y g:i A', strtotime($att['last_clock_in'])) : '-';
                      $out = $att['last_clock_out'] ? date('M j, Y g:i A', strtotime($att['last_clock_out'])) : '-';
                      $status = $att['is_clocked_in'] ? '<span style="color:var(--green);">Clocked In</span>' : '<span style="color:var(--orange);">Clocked Out</span>';
                  ?>
                  <tr class="table-body-row">
                    <td><?php echo htmlspecialchars($att['name']); ?></td>
                    <td class="text-capitalize"><?php echo htmlspecialchars($att['role']); ?></td>
                    <td><?php echo $status; ?></td>
                    <td><?php echo $in; ?></td>
                    <td><?php echo $out; ?></td>
                  </tr>
                  <?php } ?>
                <?php } ?>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <!-- ===================== CUSTOMER ===================== -->
        <div class="section-content" id="customer">
          <div class="customer-approval">
            <div class="customer-approval-header">
              <h2>Customer Approval</h2>
              <p class="sub">Approve or reject customer account requests</p>
            </div>

            <div class="customer-block panel">
              <h3>Pending Approvals (<span id="pendingCount">0</span>)</h3>
              <div class="customer-requests" id="pendingCustomers">
                <div class="customer-request empty-state">
                  <p>Loading pending customers...</p>
                </div>
              </div>
            </div>

            <div class="customer-block panel">
              <h3>Approved Customers (<span id="approvedCount">0</span>)</h3>
              <div class="approved-customers" id="approvedCustomers">
                <div class="customer-request approved empty-state">
                  <p>No approved customers yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===================== CHAT ===================== -->
        <div class="section-content" id="chat">
          <div class="chat-dashboard">
            <div class="chat-sidebar">
              <div class="chat-sidebar-header">
                <h2>Guest Conversations</h2>
                <small>Click a session to view and reply</small>
              </div>
              <div class="chat-conversation-list" id="conversationList">
                <div class="empty-state">
                  <p>Loading conversations...</p>
                </div>
              </div>
            </div>
            <div class="chat-panel">
              <div class="chat-panel-header">
                <div>
                  <h2 id="chatPanelTitle">Select a conversation</h2>
                  <small id="chatPanelSubtitle">Guest chat history will appear here</small>
                </div>
              </div>
              <div class="chat-thread" id="chatThread">
                <div class="empty-state">
                  <p>Select a conversation from the left to begin.</p>
                </div>
              </div>
              <form class="chat-reply-form" id="chatReplyForm">
                <input type="text" id="chatReplyInput" placeholder="Type your reply..." autocomplete="off" />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>
        </div>

        <!-- ===================== TABLES ===================== -->
        <div class="section-content" id="tables">
          <div class="tables-dashboard">
            <div class="tables-header-section">
              <div class="tables-header">
                <div>
                  <h2>Table Management</h2>
                  <p class="sub">Add and manage restaurant tables</p>
                </div>
                <button type="button" class="add-btn" id="openAddTable">
                  <i class="fas fa-plus"></i> Add Table
                </button>
              </div>

              <?php
              require_once __DIR__ . '/../api/reservation_helpers.php';
              ensureReservationsTable($pdo);

              $tablesStmt = $pdo->query(
                "SELECT rt.id, rt.table_number, rt.capacity, rt.position, rt.status, rt.image_path,
                        w.name AS waiter_name, c.name AS active_customer_name
                 FROM restaurant_tables rt
                 LEFT JOIN users w ON w.id = rt.assigned_waiter_id
                 LEFT JOIN users c ON c.id = rt.active_customer_id
                 ORDER BY rt.table_number"
              );
              $tables = $tablesStmt->fetchAll() ?: [];

              $stats = [
                'total' => count($tables),
                'available' => 0,
                'reserved' => 0,
                'occupied' => 0,
              ];

              foreach ($tables as $table) {
                $status = $table['status'] ?? 'available';
                if (isset($stats[$status])) {
                  $stats[$status]++;
                }
              }

              $reservationsStmt = $pdo->query(
                "SELECT r.table_id, r.guest_count, r.reserved_date, r.reserved_time, r.reserved_end_time, r.status,
                    u.name AS customer_name
                 FROM reservations r
                 LEFT JOIN users u ON u.id = r.customer_id
                 WHERE r.status IN ('pending', 'approved', 'confirmed', 'completed')
                 ORDER BY r.reserved_date DESC, r.reserved_time DESC"
              );
              $reservations = $reservationsStmt->fetchAll() ?: [];
              $latestByTable = [];
              foreach ($reservations as $reservation) {
                $tableId = $reservation['table_id'] ?? null;
                if ($tableId && !isset($latestByTable[$tableId])) {
                  $latestByTable[$tableId] = $reservation;
                }
              }

              $activeOrdersStmt = $pdo->query(
                "SELECT o.table_id, o.guest_name, o.created_at, u.name AS customer_name
                 FROM orders o
                 LEFT JOIN users u ON u.id = o.customer_id
                 WHERE o.status NOT IN ('served', 'cancelled', 'completed') AND o.table_id IS NOT NULL
                 ORDER BY o.created_at DESC"
              );
              $activeOrdersByTable = [];
              foreach ($activeOrdersStmt->fetchAll() ?: [] as $ord) {
                $tId = $ord['table_id'];
                if (!isset($activeOrdersByTable[$tId])) {
                  $activeOrdersByTable[$tId] = $ord;
                }
              }

              $positionLabels = [
                'window' => 'Window',
                'center' => 'Center',
                'corner' => 'Corner',
                'outdoor' => 'Outdoor',
                'entrance' => 'Near Entrance',
              ];

              $normalizeTableImagePath = function ($path) {
                if (!$path) {
                  return '../Images/Table/4_people table.jpg';
                }
                if (strpos($path, 'http') === 0 || strpos($path, '../') === 0) {
                  return $path;
                }
                return '../' . ltrim($path, '/');
              };
              ?>

              <!-- Stats Bar -->
              <div class="tables-stats">
                <div class="stat-item">
                  <div class="stat-label">Total Tables</div>
                  <div class="stat-value" id="statTotal"><?php echo (int) $stats['total']; ?></div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Available</div>
                  <div class="stat-value available" id="statAvailable"><?php echo (int) $stats['available']; ?></div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Occupied</div>
                  <div class="stat-value occupied" id="statOccupied"><?php echo (int) $stats['occupied']; ?></div>
                </div>
              </div>
            </div>

            <div class="reservation-approval-panel panel">
              <div class="reservation-approval-header">
                <h3><i class="fas fa-calendar-check"></i> Reservation Requests</h3>
                <p class="sub">Approve or reject customer table bookings</p>
              </div>
              <div class="reservation-requests" id="reservationRequests"></div>
            </div>

            <!-- Filter Bar -->
            <div class="filter-bar">
              <button type="button" class="filter-pill active" data-filter="all">
                <i class="fas fa-th"></i> All
              </button>
              <button type="button" class="filter-pill" data-filter="available">
                <i class="fas fa-check-circle"></i> Available
              </button>
              <button type="button" class="filter-pill" data-filter="occupied">
                <i class="fas fa-utensils"></i> Occupied
              </button>
            </div>

            <div class="tables-grid" id="tablesGrid">
              <?php if (!$tables) { ?>
                <div class="table-card">
                  <div class="reservation-info available">
                    <p>No tables available yet.</p>
                  </div>
                </div>
              <?php } else { ?>
                <?php foreach ($tables as $table) {
                  $tableId = (int) $table['id'];
                  $tableNumber = (int) $table['table_number'];
                  $capacity = (int) $table['capacity'];
                  $position = strtolower(trim($table['position'] ?? ''));
                  $status = strtolower(trim($table['status'] ?? 'available'));
                  $imageSrc = $normalizeTableImagePath($table['image_path'] ?? '');
                  $posLabel = $positionLabels[$position] ?? ($position ? ucwords($position) : 'Unknown');
                  $waiterName = $table['waiter_name'] ?? 'None';
                  $activeCustomer = $table['active_customer_name'] ?? '';
                  $reservation = $latestByTable[$tableId] ?? null;

                  $guestName = $activeCustomer;
                  $timeText = '';
                  $guestCount = $reservation['guest_count'] ?? '';

                  if ($status === 'occupied') {
                      $activeOrder = $activeOrdersByTable[$tableId] ?? null;
                      if ($activeOrder) {
                          if (!$guestName) {
                              $guestName = $activeOrder['customer_name'] ?: $activeOrder['guest_name'];
                          }
                          $timeText = date('g:i A', strtotime($activeOrder['created_at']));
                      }
                  }

                  if (!$guestName) {
                      $guestName = $reservation['customer_name'] ?? 'Walk-in';
                  }

                  if ($timeText === '' && !empty($reservation['reserved_time'])) {
                      $timeText = date('g:i A', strtotime($reservation['reserved_time']));
                      if (!empty($reservation['reserved_end_time'])) {
                          $timeText .= ' - ' . date('g:i A', strtotime($reservation['reserved_end_time']));
                      }
                  }

                  if (!$guestName) {
                      $guestName = 'Walk-in';
                  }
                  ?>
                  <div class="table-card" data-table-id="<?php echo $tableId; ?>"
                    data-table-number="<?php echo $tableNumber; ?>" data-capacity="<?php echo $capacity; ?>"
                    data-status="<?php echo htmlspecialchars($status); ?>"
                    data-position="<?php echo htmlspecialchars($position); ?>"
                    data-guest="<?php echo htmlspecialchars($guestName); ?>"
                    data-time="<?php echo htmlspecialchars($timeText); ?>"
                    data-guests="<?php echo htmlspecialchars((string) $guestCount); ?>">
                    <div class="table-header-row">
                      <span class="position-badge"><?php echo htmlspecialchars($posLabel); ?></span>
                      <div class="table-actions">
                        <button type="button" class="table-edit-btn" aria-label="Edit table" title="Edit">
                          <i class="fas fa-pencil"></i>
                        </button>
                      </div>
                    </div>
                    <div class="table-number">
                      <img class="table-icon" src="<?php echo htmlspecialchars($imageSrc); ?>" alt="Table" />
                    </div>
                    <h4>Table <?php echo $tableNumber; ?></h4>
                    <div class="table-meta">Capacity: <?php echo $capacity; ?></div>
                    <div class="table-status-display">
                      <span class="status-badge <?php echo htmlspecialchars($status); ?>">
                        <?php echo ucfirst(htmlspecialchars($status)); ?>
                      </span>
                    </div>
                      <div class="reservation-info <?php echo htmlspecialchars($status); ?>" style="padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 10px;">
                        <button type="button" class="view-bookings-btn" onclick="viewTableBookings(<?php echo $tableId; ?>, <?php echo $tableNumber; ?>)" style="width: 100%; padding: 8px; background: rgba(200, 169, 106, 0.15); border: 1px solid var(--gold); border-radius: 6px; color: var(--gold); font-weight: 600; cursor: pointer; transition: all 0.2s;">
                          <i class="fas fa-list"></i> View Bookings
                        </button>
                      </div>
                  </div>
                <?php } ?>
              <?php } ?>
            </div>

            <!-- Table Bookings Panel (Hidden by default) -->
            <div id="tableBookingsPanel" class="panel" style="margin-top: 3rem; margin-bottom: 3rem; padding: 25px; border-radius: 16px; background: rgba(30, 32, 28, 0.7); border: 1px solid rgba(200, 169, 106, 0.2); backdrop-filter: blur(10px); display: none;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: var(--gold); font-size: 1.2rem;">Bookings for Table <span id="bookingsTableNumber"></span></h3>
                <button type="button" onclick="document.getElementById('tableBookingsPanel').style.display='none'" style="background: transparent; border: none; color: #fff; font-size: 1.2rem; cursor: pointer;"><i class="fas fa-times"></i></button>
              </div>
              <div style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse; color: #fff; font-size: 0.95rem;">
                  <thead>
                    <tr style="border-bottom: 2px solid rgba(200, 169, 106, 0.3); text-align: left;">
                      <th style="padding: 12px 10px; font-weight: 600; color: rgba(255,255,255,0.8);">Guest Name</th>
                      <th style="padding: 12px 10px; font-weight: 600; color: rgba(255,255,255,0.8);">Date</th>
                      <th style="padding: 12px 10px; font-weight: 600; color: rgba(255,255,255,0.8);">Time</th>
                      <th style="padding: 12px 10px; font-weight: 600; color: rgba(255,255,255,0.8);">Guests</th>
                      <th style="padding: 12px 10px; font-weight: 600; color: rgba(255,255,255,0.8);">Status</th>
                    </tr>
                  </thead>
                  <tbody id="tableBookingsBody">
                    <!-- Rendered via JS -->
                  </tbody>
                </table>
              </div>
            </div>
            
            <script>
              const allTableReservations = <?php 
                $resByTable = [];
                foreach ($reservations as $r) {
                  $tId = $r['table_id'];
                  if (!isset($resByTable[$tId])) $resByTable[$tId] = [];
                  $resByTable[$tId][] = $r;
                }
                echo json_encode($resByTable);
              ?>;
              
              function viewTableBookings(tableId, tableNumber) {
                const panel = document.getElementById('tableBookingsPanel');
                const tbody = document.getElementById('tableBookingsBody');
                document.getElementById('bookingsTableNumber').innerText = tableNumber;
                
                const bookings = allTableReservations[tableId] || [];
                
                if (bookings.length === 0) {
                  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.6);">No active bookings found for this table.</td></tr>';
                } else {
                  tbody.innerHTML = bookings.map(b => {
                    const date = new Date(b.reserved_date).toLocaleDateString();
                    let timeText = b.reserved_time ? new Date('1970-01-01T' + b.reserved_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
                    if (b.reserved_end_time) {
                      timeText += ' - ' + new Date('1970-01-01T' + b.reserved_end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    }
                    const statusClass = b.status === 'confirmed' || b.status === 'approved' || b.status === 'completed' ? 'color: #81c784;' : 'color: #ffd54f;';
                    
                    return `
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 12px 10px;">${b.customer_name || 'Walk-in'}</td>
                        <td style="padding: 12px 10px;">${date}</td>
                        <td style="padding: 12px 10px;">${timeText}</td>
                        <td style="padding: 12px 10px;">${b.guest_count}</td>
                        <td style="padding: 12px 10px; ${statusClass} text-transform: capitalize;">${b.status}</td>
                      </tr>
                    `;
                  }).join('');
                }
                
                panel.style.display = 'block';
                panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            </script>
          </div>
        </div>

        <!-- ===================== MENU ===================== -->
        <div class="section-content" id="menu">
          <div class="menu-approval">
            <div class="menu-approval-header">
              <h2>Menu Item Approval</h2>
              <p class="sub">Approve new menu items from chefs</p>
            </div>

            <?php
            $pendingStmt = $pdo->query(
              "SELECT r.id, r.name, r.description, r.price, r.category, r.image_path, u.name AS chief_name
               FROM recipes r
               LEFT JOIN users u ON u.id = r.chef_id
               WHERE r.status = 'pending'
               ORDER BY r.created_at DESC"
            );
            $pendingMenu = $pendingStmt->fetchAll() ?: [];

            $approvedStmt = $pdo->query(
              "SELECT r.id, r.name, r.description, r.price, r.category, r.image_path, u.name AS chief_name
               FROM recipes r
               LEFT JOIN users u ON u.id = r.chef_id
               WHERE r.status = 'approved'
               ORDER BY r.created_at DESC"
            );
            $approvedMenu = $approvedStmt->fetchAll() ?: [];

            $normalizeMenuImagePath = function ($path) {
              if (!$path) {
                return '../Images/food/main%20cross/pexels-campbell-downie-3549547-5317239.jpg';
              }
              if (strpos($path, 'http') === 0 || strpos($path, '../') === 0) {
                return $path;
              }
              return '../' . ltrim($path, '/');
            };
            ?>

            <div class="menu-block">
              <h3>
                <span class="menu-dot" aria-hidden="true"></span>
                <span class="menu-heading-text">Pending Approval (<span
                    id="pendingMenuCount"><?php echo count($pendingMenu); ?></span>)</span>
              </h3>
              <div class="menu-grid" id="pendingMenuItems">
                <?php if (!$pendingMenu) { ?>
                  <div class="menu-card pending">
                    <div class="menu-card-body">
                      <div class="menu-desc">No pending menu items.</div>
                    </div>
                  </div>
                <?php } else { ?>
                  <?php foreach ($pendingMenu as $item) {
                    $menuId = (int) $item['id'];
                    $name = htmlspecialchars($item['name'] ?? '');
                    $desc = htmlspecialchars($item['description'] ?? '');
                    $price = number_format((float) ($item['price'] ?? 0), 2);
                    $category = htmlspecialchars($item['category'] ?? '');
                    $imageSrc = htmlspecialchars($normalizeMenuImagePath($item['image_path'] ?? ''));
                    ?>
                    <div class="menu-card pending" data-menu-id="<?php echo $menuId; ?>">
                      <div class="menu-thumb">
                        <img src="<?php echo $imageSrc; ?>" alt="<?php echo $name; ?>" />
                      </div>
                      <div class="menu-card-body">
                        <div class="menu-title-row">
                          <div class="menu-name"><?php echo $name; ?></div>
                          <div class="menu-price">$<?php echo $price; ?></div>
                        </div>
                        <div class="menu-desc"><?php echo $desc; ?></div>
                        <div class="menu-bottom-row">
                          <span class="menu-tag"><?php echo $category; ?></span>
                          <span class="menu-tag" style="background: rgba(0,0,0,0.2); color: var(--text-muted);"><i class="fas fa-user" style="margin-right:4px;"></i><?php echo htmlspecialchars($item['chief_name'] ?? 'Unknown'); ?></span>
                          <div class="menu-action-row">
                            <button type="button" class="menu-edit-btn" data-action="edit-menu">Edit</button>
                            <button type="button" class="menu-approve-btn" data-action="approve">Approve</button>
                            <button type="button" class="menu-reject-btn" data-action="reject">Reject</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  <?php } ?>
                <?php } ?>
              </div>
            </div>

            <div class="menu-block">
              <h3>
                <span class="menu-check-icon" aria-hidden="true"><i class="fas fa-check"></i></span>
                <span class="menu-heading-text">Approved Menu Items (<span
                    id="approvedMenuCount"><?php echo count($approvedMenu); ?></span>)</span>
              </h3>
              <div class="menu-grid approved" id="approvedMenuItems">
                <?php if (!$approvedMenu) { ?>
                  <div class="menu-card approved">
                    <div class="menu-card-body">
                      <div class="menu-desc">No approved menu items yet.</div>
                    </div>
                  </div>
                <?php } else { ?>
                  <?php foreach ($approvedMenu as $item) {
                    $menuId = (int) $item['id'];
                    $name = htmlspecialchars($item['name'] ?? '');
                    $desc = htmlspecialchars($item['description'] ?? '');
                    $price = number_format((float) ($item['price'] ?? 0), 2);
                    $category = htmlspecialchars($item['category'] ?? '');
                    $imageSrc = htmlspecialchars($normalizeMenuImagePath($item['image_path'] ?? ''));
                    ?>
                    <div class="menu-card approved" data-menu-id="<?php echo $menuId; ?>">
                      <div class="menu-thumb">
                        <img src="<?php echo $imageSrc; ?>" alt="<?php echo $name; ?>" />
                      </div>
                      <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                      <div class="menu-card-body">
                        <div class="menu-title-row">
                          <div class="menu-name"><?php echo $name; ?></div>
                          <div class="menu-price">$<?php echo $price; ?></div>
                        </div>
                        <div class="menu-desc"><?php echo $desc; ?></div>
                        <div class="menu-bottom-row">
                          <span class="menu-tag"><?php echo $category; ?></span>
                          <span class="menu-tag" style="background: rgba(0,0,0,0.2); color: var(--text-muted);"><i class="fas fa-user" style="margin-right:4px;"></i><?php echo htmlspecialchars($item['chief_name'] ?? 'Unknown'); ?></span>
                        </div>
                      </div>
                    </div>
                  <?php } ?>
                <?php } ?>
              </div>
            </div>
          </div>
        </div>

        <!-- ===================== REPORTS ===================== -->
        <div class="section-content" id="reports">
          <div class="reports-panel">
            <div class="reports-header">
              <div>
                <h2>Financial Reports</h2>
                <p class="sub">View Revenue And Sales Analytics</p>
              </div>
              <button type="button" class="download-report-btn" id="downloadReportBtn">
                <i class="fas fa-download"></i> Download Report
              </button>
            </div>

            <div class="reports-filter">
              <div class="date-field">
                <label for="reportStart">Start Date</label>
                <input type="date" id="reportStart" name="reportStart" value="<?php echo date('Y-m-01'); ?>">
              </div>
              <div class="date-field">
                <label for="reportEnd">End Date</label>
                <input type="date" id="reportEnd" name="reportEnd" value="<?php echo date('Y-m-d'); ?>">
              </div>
              <div class="date-field">
                <label for="reportFormat">Format</label>
                <select id="reportFormat" class="report-select">
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="xls">XLS (Excel)</option>
                </select>
              </div>
            </div>

            <div class="reports-cards">
              <div class="report-card">
                <div class="report-icon green"><i class="fas fa-dollar-sign"></i></div>
                <div>
                  <p>Total Revenue</p>
                  <h3 id="reportTotalRevenue">$0</h3>
                </div>
              </div>
              <div class="report-card">
                <div class="report-icon blue"><i class="fas fa-receipt"></i></div>
                <div>
                  <p>Total Orders</p>
                  <h3 id="reportTotalOrders">0</h3>
                </div>
              </div>
              <div class="report-card">
                <div class="report-icon purple"><i class="fas fa-chart-line"></i></div>
                <div>
                  <p>Avg Order Value</p>
                  <h3 id="reportAvgOrderValue">$0</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
    <!-- /outer-wrapper -->

  </div>
  <!-- Add Employee Modal -->
  <div class="modal" id="addEmployeeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add New Employee</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <form id="employeeForm" class="employee-form" action="../api/add_employee.php" method="post"
        enctype="multipart/form-data">
        <div class="form-row-flex">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" name="fullName" placeholder="Enter full name">
          </div>
          <div class="form-group">
            <label for="email">Email <span class="required-mark">*</span></label>
            <input type="email" id="email" name="email" placeholder="Enter email" required>
          </div>
        </div>
        <div class="form-row-flex">
          <div class="form-group">
            <label for="employeeRole">Role</label>
            <select id="employeeRole" name="role">
              <option value="">Select Role</option>
              <option value="waiter">Waiter</option>
              <option value="chief">Chef</option>
            </select>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter password">
          </div>
        </div>
        <div class="form-group full-width" id="certificateGroup">
          <label for="certificate">Certificate (PDF)</label>
          <input type="file" id="certificate" name="certificate" accept="application/pdf,.pdf">
        </div>
        <div class="btn-row">
          <button type="submit" class="btn-primary">Add Employee</button>
          <button type="button" class="btn-secondary modal-close-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Add Table Modal -->
  <div class="modal" id="addTableModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add New Table</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <form id="tableForm" class="employee-form">
        <div class="form-row-flex">
          <div class="form-group">
            <label for="tableNumber">Table Number</label>
            <input type="number" id="tableNumber" name="tableNumber" min="1" step="1" required>
          </div>
          <div class="form-group">
            <label for="tableCapacity">Capacity</label>
            <input type="number" id="tableCapacity" name="tableCapacity" min="1" step="1" required>
          </div>
        </div>
        <div class="form-row-flex">
          <div class="form-group">
            <label for="tablePosition">Position</label>
            <select id="tablePosition" name="tablePosition" required>
              <option value="">Select Position</option>
              <option value="window">Window</option>
              <option value="center">Center</option>
              <option value="corner">Corner</option>
              <option value="outdoor">Outdoor</option>
              <option value="entrance">Near Entrance</option>
            </select>
          </div>
        </div>
        <div class="form-group full-width">
          <label for="tableImageFile">Upload Table Image</label>
          <input type="file" id="tableImageFile" name="tableImageFile" accept="image/*">
        </div>
        <div class="btn-row">
          <button type="submit" class="btn-primary">Add Table</button>
          <button type="button" class="btn-secondary modal-close-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Table Modal -->
  <div class="modal" id="editTableModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Table</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <form id="editTableForm" class="employee-form">
        <div class="form-row-flex">
          <div class="form-group">
            <label for="editTableNumber">Table Number</label>
            <input type="text" id="editTableNumber" name="editTableNumber" disabled>
          </div>
          <div class="form-group">
            <label for="editTableCapacity">Capacity</label>
            <input type="number" id="editTableCapacity" name="editTableCapacity" min="1" step="1" required>
          </div>
        </div>
        <div class="form-row-flex">
          <div class="form-group">
            <label for="editTablePosition">Position</label>
            <select id="editTablePosition" name="editTablePosition" required>
              <option value="">Select Position</option>
              <option value="window">Window</option>
              <option value="center">Center</option>
              <option value="corner">Corner</option>
              <option value="outdoor">Outdoor</option>
              <option value="entrance">Near Entrance</option>
            </select>
          </div>
        </div>
        <div class="form-group full-width">
          <label for="editTableImageFile">Update Table Image</label>
          <input type="file" id="editTableImageFile" name="editTableImageFile" accept="image/*">
        </div>
        <div class="btn-row">
          <button type="submit" class="btn-primary">Save Changes</button>
          <button type="button" class="btn-secondary modal-close-btn">Cancel</button>
          <button type="button" class="btn-danger" id="deleteTableBtn">Delete Table</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Menu Modal -->
  <div class="modal" id="editMenuModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Menu Item</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <form id="editMenuForm" class="employee-form">
        <div class="form-row-flex">
          <div class="form-group">
            <label for="editMenuName">Item Name</label>
            <input type="text" id="editMenuName" name="editMenuName" required>
          </div>
          <div class="form-group">
            <label for="editMenuPrice">Price</label>
            <input type="text" id="editMenuPrice" name="editMenuPrice" placeholder="$12.99" required>
          </div>
        </div>
        <div class="form-row-flex">
          <div class="form-group">
            <label for="editMenuTag">Category</label>
            <input type="text" id="editMenuTag" name="editMenuTag" required>
          </div>
        </div>
        <div class="form-group full-width">
          <label for="editMenuDesc">Description</label>
          <textarea id="editMenuDesc" name="editMenuDesc" rows="3" required></textarea>
        </div>
        <div class="form-row-flex">
          <div class="form-group">
            <label for="editMenuImage">Menu Item Image</label>
            <input type="file" id="editMenuImage" name="editMenuImage" accept="image/*">
          </div>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn-primary">Save Changes</button>
          <button type="button" class="btn-secondary modal-close-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>


  <!-- Success Toast -->
  <div class="success-toast" id="adminToast">
    <div class="toast-icon"><i class="fas fa-check"></i></div>
    <div class="toast-msg">Action Completed!</div>
  </div>

  <script src="../JavaScript/admin.js"></script>
</body>

</html>
