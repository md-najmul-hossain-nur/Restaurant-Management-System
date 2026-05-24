<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
  header('Location: login.html');
  exit;
}

// Load DB for server-side rendering of employees
require_once __DIR__ . '/../Php/db.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Feliciano — Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <link rel="stylesheet" href="../CSS/admin.css" />
</head>
<body>
  <div class="dashboard">
    <!-- Topbar -->
    <header class="topbar">
      <div class="brand">Feliciano</div>
      <div class="top-right">
        <div class="admin-title">Admin<br>Dashboard</div>
        <div class="logout" onclick="window.location.href='login.html'">
          <img src="../Images/logout.png" alt="Logout" class="logout-icon">
         </div>
      </div>
    </header>

    <!-- Outer glass wrapper -->
    <div class="outer-wrapper">

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

          <h1 class="page-title">Overview</h1>
          <p class="page-subtitle">Restaurant performance at a glance</p>

          <div class="stats">
            <div class="card">
              <div class="icon-box blue">
                <i class="fas fa-users"></i>
              </div>
              <h3 class="blue">122</h3>
              <p>Total Employees</p>
            </div>
            <div class="card">
              <div class="icon-box green">
                <i class="fas fa-chair"></i>
              </div>
              <h3 class="green">8</h3>
              <p>Available Tables</p>
            </div>
            <div class="card">
              <div class="icon-box orange">
                <i class="fas fa-utensils"></i>
              </div>
              <h3 class="orange">45</h3>
              <p>Menu Items</p>
            </div>
            <div class="card">
              <div class="icon-box gold">
                <i class="fas fa-dollar-sign"></i>
              </div>
              <h3 class="gold">$12.5K</h3>
              <p>Monthly Revenue</p>
            </div>
          </div>

          <section class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="sub">Use the tabs above to manage different aspects of the restaurant</div>
            <div class="actions-grid">
              <div class="action-btn" onclick="switchTab('employees'); openModal('addEmployeeModal');">
                <i class="fas fa-user-plus"></i>
                <span>Add Employee</span>
              </div>
              <div class="action-btn" onclick="switchTab('customer')">
                <i class="fas fa-user-check"></i>
                <span>Approve Customer</span>
              </div>
              <div class="action-btn" onclick="switchTab('reports')">
                  <i class="fas fa-chart-bar"></i>
                <span>View Reports</span>
              </div>
              <div class="action-btn" onclick="switchTab('tables'); openModal('addTableModal');">
                <i class="fas fa-chair"></i>
                <span>Manage Tables</span>
              </div>
              <div class="action-btn" onclick="switchTab('menu')">
                <i class="fas fa-utensils"></i>
                <span>Approve Menu Items</span>
              </div>
            </div>
          </section>
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
                        c.certificate_path, w.shift
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
                  $name  = htmlspecialchars($emp['name']);
                  $email = htmlspecialchars($emp['email']);
                  $role  = htmlspecialchars($emp['role']);
                  $roleLabel = $role === 'chief' ? 'Chef' : 'Waiter';
                  $isClocked = 0;
                  $lastClock = null;
                  if (!empty($emp['is_clocked_in'])) $isClocked = (int)$emp['is_clocked_in'];
                  if (!empty($emp['last_clock_in'])) $lastClock = htmlspecialchars(date('c', strtotime($emp['last_clock_in'])));

                  $dataAttrs = "data-added=\"{$added}\"";
                  if ($isClocked && $lastClock) $dataAttrs .= " data-clock-in=\"{$lastClock}\" data-clocked=\"1\"";

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
                  echo "    <div class=\"employee-time\"><span class=\"time-label\"></span> <span class=\"time-value\"></span></div>";
                  echo "  </div>";
                  echo "  <div class=\"employee-actions\">";
                  echo "    <span class=\"role-badge {$role}\">{$roleLabel}</span>";
                  echo "  </div>";
                  echo "</div>";
                }
            }
            ?>
          </div>
        </div>

        <!-- ===================== CUSTOMER ===================== -->
        <div class="section-content" id="customer">
          <div class="customer-approval">
            <div class="customer-approval-header">
              <h2>Customer Approval</h2>
              <p class="sub">Approve or reject customer account requests</p>
            </div>

            <div class="customer-block">
              <h3>Pending Approvals (<span id="pendingCount">0</span>)</h3>
              <div class="customer-requests" id="pendingCustomers">
                <div class="customer-request empty-state">
                  <p>Loading pending customers...</p>
                </div>
              </div>
            </div>

            <div class="customer-block">
              <h3>Approved Customers (<span id="approvedCount">0</span>)</h3>
              <div class="approved-customers" id="approvedCustomers">
                <div class="customer-request approved empty-state">
                  <p>No approved customers yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===================== TABLES ===================== -->
        <div class="section-content" id="tables">
          <div class="tables-panel">
            <div class="tables-header">
              <div>
                <h2>Table Management</h2>
                <p class="sub">Add and manage restaurant tables</p>
              </div>
              <button type="button" class="add-table-btn" id="openAddTable">
                <i class="fas fa-plus"></i> Add Table
              </button>
            </div>

            <!-- Stats Bar -->
            <div class="tables-stats">
              <div class="stat-item">
                <div class="stat-label">Total Tables</div>
                <div class="stat-value" id="statTotal">3</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Available</div>
                <div class="stat-value available" id="statAvailable">1</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Reserved</div>
                <div class="stat-value reserved" id="statReserved">1</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Occupied</div>
                <div class="stat-value occupied" id="statOccupied">1</div>
              </div>
            </div>

            <div class="reservation-approval-panel">
              <div class="reservation-approval-header">
                <h3>Reservation Requests</h3>
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
              <button type="button" class="filter-pill" data-filter="reserved">
                <i class="fas fa-calendar-check"></i> Reserved
              </button>
              <button type="button" class="filter-pill" data-filter="occupied">
                <i class="fas fa-utensils"></i> Occupied
              </button>
            </div>

            <div class="tables-grid" id="tablesGrid">
              <div class="table-card" data-table-id="1" data-status="reserved" data-position="window" data-guest="John Smith" data-time="7:00 PM" data-guests="4">
                <div class="table-header-row">
                  <span class="position-badge">Window</span>
                  <div class="table-actions">
                    <button type="button" class="table-edit-btn" aria-label="Edit table" title="Edit">
                      <i class="fas fa-pencil"></i>
                    </button>
                  </div>
                </div>
                <div class="table-number">
                  <img class="table-icon" src="../Images/Table/4_people table.jpg" alt="Table" />
                </div>
                <h4>Table 1</h4>
                <div class="table-status-dropdown">
                  <select class="status-select" data-table-id="1">
                    <option value="available">Available</option>
                    <option value="reserved" selected>Reserved</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>
                <div class="reservation-info reserved">
                  <p><strong>Guest:</strong> John Smith</p>
                  <p><strong>Time:</strong> 7:00 PM</p>
                  <p><strong>Guests:</strong> 4</p>
                </div>
              </div>

              <div class="table-card" data-table-id="2" data-status="occupied" data-position="center" data-guest="Maria Garcia" data-time="7:30 PM" data-guests="5">
                <div class="table-header-row">
                  <span class="position-badge">Center</span>
                  <div class="table-actions">
                    <button type="button" class="table-edit-btn" aria-label="Edit table" title="Edit">
                      <i class="fas fa-pencil"></i>
                    </button>
                  </div>
                </div>
                <div class="table-number">
                  <img class="table-icon" src="../Images/Table/4_people table.jpg" alt="Table" />
                </div>
                <h4>Table 2</h4>
                <div class="table-status-dropdown">
                  <select class="status-select" data-table-id="2">
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied" selected>Occupied</option>
                  </select>
                </div>
                <div class="reservation-info occupied">
                  <p><strong>Guest:</strong> Maria Garcia</p>
                  <p><strong>Time:</strong> 7:30 PM</p>
                  <p><strong>Guests:</strong> 5</p>
                </div>
              </div>

              <div class="table-card" data-table-id="3" data-status="available" data-position="corner">
                <div class="table-header-row">
                  <span class="position-badge">Corner</span>
                  <div class="table-actions">
                    <button type="button" class="table-edit-btn" aria-label="Edit table" title="Edit">
                      <i class="fas fa-pencil"></i>
                    </button>
                  </div>
                </div>
                <div class="table-number">
                  <img class="table-icon" src="../Images/Table/4_people table.jpg" alt="Table" />
                </div>
                <h4>Table 3</h4>
                <div class="table-status-dropdown">
                  <select class="status-select" data-table-id="3">
                    <option value="available" selected>Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===================== MENU ===================== -->
        <div class="section-content" id="menu">
          <div class="menu-approval">
            <div class="menu-approval-header">
              <h2>Menu Item Approval</h2>
              <p class="sub">Approve new menu items from chefs</p>
            </div>

            <div class="menu-block">
              <h3>
                <span class="menu-dot" aria-hidden="true"></span>
                <span class="menu-heading-text">Pending Approval (<span id="pendingMenuCount">1</span>)</span>
              </h3>
              <div class="menu-grid" id="pendingMenuItems">
                <div class="menu-card pending" data-menu-id="pending-1">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-campbell-downie-3549547-5317239.jpg" alt="Margherita Pizza" />
                  </div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Margherita Pizza</div>
                      <div class="menu-price">$12.99</div>
                    </div>
                    <div class="menu-desc">Classic tomato sauce, mozzarella, and fresh basil</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Pizza</span>
                      <div class="menu-action-row">
                        <button type="button" class="menu-edit-btn" data-action="edit-menu">Edit</button>
                        <button type="button" class="menu-approve-btn" data-action="approve-menu">Approve</button>
                        <button type="button" class="menu-reject-btn" data-action="reject-menu">Reject</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="menu-block">
              <h3>
                <span class="menu-check-icon" aria-hidden="true"><i class="fas fa-check"></i></span>
                <span class="menu-heading-text">Approved Menu Items (<span id="approvedMenuCount">7</span>)</span>
              </h3>
              <div class="menu-grid approved" id="approvedMenuItems">
                <div class="menu-card approved" data-menu-id="approved-1">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-ionela-mat-268382825-19671341.jpg" alt="Margherita Pizza" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Margherita Pizza</div>
                      <div class="menu-price">$12.99</div>
                    </div>
                    <div class="menu-desc">Classic tomato sauce, mozzarella, and fresh basil</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Pizza</span>
                    </div>
                  </div>
                </div>

                <div class="menu-card approved" data-menu-id="approved-2">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-julia-chalova-10303257.jpg" alt="Pasta" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Pasta Carbonara</div>
                      <div class="menu-price">$14.99</div>
                    </div>
                    <div class="menu-desc">Creamy egg sauce, pancetta, and parmesan</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Pasta</span>
                    </div>
                  </div>
                </div>

                <div class="menu-card approved" data-menu-id="approved-3">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-lucas-porras-1937324539-35723478.jpg" alt="Bruschetta" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Bruschetta</div>
                      <div class="menu-price">$12.99</div>
                    </div>
                    <div class="menu-desc">Toasted bread with fresh tomatoes and basil</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Starter</span>
                    </div>
                  </div>
                </div>

                <div class="menu-card approved" data-menu-id="approved-4">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-campbell-downie-3549547-5317239.jpg" alt="Risotto" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Mushroom Risotto</div>
                      <div class="menu-price">$15.99</div>
                    </div>
                    <div class="menu-desc">Creamy arborio rice with wild mushrooms</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Main Course</span>
                    </div>
                  </div>
                </div>

                <div class="menu-card approved" data-menu-id="approved-5">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-ionela-mat-268382825-19671341.jpg" alt="Tiramisu" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Tiramisu</div>
                      <div class="menu-price">$8.99</div>
                    </div>
                    <div class="menu-desc">Classic Italian dessert with mascarpone cream</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Dessert</span>
                    </div>
                  </div>
                </div>

                <div class="menu-card approved" data-menu-id="approved-6">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-julia-chalova-10303257.jpg" alt="Seafood Linguine" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Seafood Linguine</div>
                      <div class="menu-price">$18.99</div>
                    </div>
                    <div class="menu-desc">Fresh clams, shrimp and mussels in white wine sauce</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Pasta</span>
                    </div>
                  </div>
                </div>

                <div class="menu-card approved" data-menu-id="approved-7">
                  <div class="menu-thumb">
                    <img src="../Images/food/main%20cross/pexels-lucas-porras-1937324539-35723478.jpg" alt="Caesar Salad" />
                  </div>
                  <div class="menu-check" aria-hidden="true"><i class="fas fa-check"></i></div>
                  <div class="menu-card-body">
                    <div class="menu-title-row">
                      <div class="menu-name">Caesar Salad</div>
                      <div class="menu-price">$11.99</div>
                    </div>
                    <div class="menu-desc">Crisp romaine, parmesan and house-made croutons</div>
                    <div class="menu-bottom-row">
                      <span class="menu-tag">Salad</span>
                    </div>
                  </div>
                </div>
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
          <form id="employeeForm" class="employee-form" action="../api/add_employee.php" method="post" enctype="multipart/form-data">
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

   
  <script src="../JavaScript/admin.js"></script>
  <script src="../JavaScript/chatbot.js"></script>
</body>
</html>
