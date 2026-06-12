<?php
session_start();
require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';
restoreRoleSession('admin');

if (($_SESSION['role'] ?? '') !== 'admin') {
    header('Location: ../Html/login.html');
    exit;
}

// Parameters
$page = max(1, intval($_GET['page'] ?? 1));
$perPage = 20;
$source = ($_GET['source'] ?? 'all'); // 'all' | 'user' | 'bot'
$roleFilter = trim($_GET['role'] ?? ''); // empty or role name
$q = trim($_GET['q'] ?? ''); // search in message text

$where = [];
$params = [];
if ($source === 'user' || $source === 'bot') {
    $where[] = 'source = ?';
    $params[] = $source;
}
if ($roleFilter !== '' && $roleFilter !== 'all') {
    $where[] = 'role = ?';
    $params[] = $roleFilter;
}
if ($q !== '') {
    $where[] = 'message LIKE ?';
    $params[] = "%{$q}%";
}

$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM chat_messages $whereSql");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($total / $perPage));
if ($page > $totalPages) $page = $totalPages;
$offset = ($page - 1) * $perPage;

$sql = "SELECT * FROM chat_messages $whereSql ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
$stmt = $pdo->prepare($sql);
foreach ($params as $i => $p) {
    $stmt->bindValue($i+1, $p);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch available roles from users table for the role filter
$roles = [];
try {
    $rStmt = $pdo->query("SELECT DISTINCT role FROM users WHERE role IS NOT NULL ORDER BY role");
    $roles = $rStmt->fetchAll(PDO::FETCH_COLUMN);
} catch (Exception $e) { /* ignore */ }
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Chat Messages</title>
  <link rel="stylesheet" href="../CSS/admin.css">
  <style>table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}pre{white-space:pre-wrap}.filters{display:flex;gap:12px;align-items:center;margin-bottom:12px}</style>
  <link rel="stylesheet" href="../CSS/responsive.css">
</head>
<body>
  <h1>Chat Messages</h1>
  <p><a href="Admin.php">Back to Admin Dashboard</a></p>

  <form method="get" class="filters" id="filterForm">
    <label>Search:
      <input type="search" name="q" placeholder="Search message text" value="<?=htmlspecialchars($q)?>" onkeypress="if(event.key==='Enter') document.getElementById('filterForm').submit()">
    </label>

    <label>Source:
      <select name="source" onchange="document.getElementById('filterForm').submit()">
        <option value="all"<?php if ($source==='all') echo ' selected'; ?>>All</option>
        <option value="user"<?php if ($source==='user') echo ' selected'; ?>>User</option>
        <option value="bot"<?php if ($source==='bot') echo ' selected'; ?>>Bot</option>
      </select>
    </label>

    <label>Role:
      <select name="role" onchange="document.getElementById('filterForm').submit()">
        <option value="all"<?php if ($roleFilter==='' || $roleFilter==='all') echo ' selected'; ?>>All</option>
        <?php foreach ($roles as $r): $rv = htmlspecialchars($r); $sel = ($roleFilter === $r) ? ' selected' : ''; ?>
          <option value="<?= $rv ?>"<?= $sel ?>><?= $rv ?></option>
        <?php endforeach; ?>
      </select>
    </label>

    <div style="margin-left:auto">Showing <strong><?php echo (int)$total; ?></strong> messages</div>
  </form>

  <table>
    <thead>
      <tr><th>ID</th><th>When</th><th>From</th><th>Role</th><th>Source</th><th>Message</th><th>Action</th></tr>
    </thead>
    <tbody id="msgs">
    <?php if (!$messages) { ?>
      <tr><td colspan="7">No messages found.</td></tr>
    <?php } else {
        foreach ($messages as $m): ?>
      <tr data-id="<?=htmlspecialchars($m['id'])?>">
        <td><?=htmlspecialchars($m['id'])?></td>
        <td><?=htmlspecialchars($m['created_at'])?></td>
        <td><?=htmlspecialchars($m['name'] ?? $m['email'] ?? 'Guest')?></td>
        <td><?=htmlspecialchars($m['role'] ?? '')?></td>
        <td><?=htmlspecialchars($m['source'])?></td>
        <td><pre><?=htmlspecialchars($m['message'])?></pre></td>
        <td><button class="del">Delete</button></td>
      </tr>
    <?php endforeach; } ?>
    </tbody>
  </table>

  <div class="pagination" style="margin-top:12px;display:flex;gap:8px;align-items:center">
    <?php if ($page>1): ?>
      <a href="?page=<?php echo $page-1; ?>&source=<?php echo urlencode($source); ?>&role=<?php echo urlencode($roleFilter); ?>&q=<?php echo urlencode($q); ?>">&laquo; Prev</a>
    <?php endif; ?>

    <?php
    $start = max(1, $page - 3);
    $end = min($totalPages, $page + 3);
    for ($p = $start; $p <= $end; $p++):
    ?>
      <?php if ($p === $page): ?>
        <strong><?php echo $p; ?></strong>
      <?php else: ?>
        <a href="?page=<?php echo $p; ?>&source=<?php echo urlencode($source); ?>&role=<?php echo urlencode($roleFilter); ?>&q=<?php echo urlencode($q); ?>"><?php echo $p; ?></a>
      <?php endif; ?>
    <?php endfor; ?>

    <?php if ($page < $totalPages): ?>
      <a href="?page=<?php echo $page+1; ?>&source=<?php echo urlencode($source); ?>&role=<?php echo urlencode($roleFilter); ?>&q=<?php echo urlencode($q); ?>">Next &raquo;</a>
    <?php endif; ?>
  </div>

  <script>
    document.addEventListener('click', async (e) => {
      if (!e.target.classList.contains('del')) return;
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;
      if (!confirm('Delete message #' + id + '?')) return;
      try {
        const fd = new FormData(); fd.append('id', id);
        const res = await fetch('../api/delete_chat.php', { method: 'POST', credentials: 'same-origin', body: fd });
        const j = await res.json();
        if (j.success) tr.remove(); else alert('Delete failed');
      } catch (err) { alert('Error'); }
    });
  </script>
</body>
</html>
