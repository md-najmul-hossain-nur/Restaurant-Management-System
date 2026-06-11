<?php
session_start();
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../Html/login.html');
    exit;
}

$identifier = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$role = $_POST['role'] ?? '';

if (!$identifier || !$password) {
    header('Location: ../Html/login.html?error=missing');
    exit;
}

// Login by email only (since no phone column)
$stmt = $pdo->prepare('SELECT id, name, email, password, role, approval_status FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$identifier]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: ../Html/login.html?error=not_found');
    exit;
}

if (!password_verify($password, $user['password'])) {
    header('Location: ../Html/login.html?error=bad_password');
    exit;
}

if (($user['role'] ?? '') === 'customer' && ($user['approval_status'] ?? 'approved') !== 'approved') {
    $statusError = ($user['approval_status'] ?? 'pending') === 'rejected' ? 'rejected' : 'pending';
    header('Location: ../Html/login.html?error=' . $statusError);
    exit;
}

// Role check (optional)
if ($role && $role !== $user['role']) {
    header('Location: ../Html/login.html?error=role_mismatch');
    exit;
}

if (!empty($_SESSION['user_id']) && !empty($_SESSION['role'])) {
    rememberRoleSession([
        'id'    => $_SESSION['user_id'],
        'name'  => $_SESSION['name'] ?? null,
        'email' => $_SESSION['email'] ?? null,
        'role'  => $_SESSION['role'],
    ]);
}

// Set session variables
$_SESSION['user_id'] = $user['id'];
$_SESSION['name']   = $user['name'];
$_SESSION['email']  = $user['email'];
$_SESSION['role']   = $user['role'];
rememberRoleSession($user);

// Redirect based on role
switch ($user['role']) {
    case 'admin':
        $redirect = '../Html/Admin.php';
        break;
    case 'chief':
        $redirect = '../Html/Chief.php';
        break;
    case 'waiter':
        $redirect = '../Html/Waiter.php';
        break;
    default:
        $redirect = '../Html/Customer.html';
}

header('Location: ' . $redirect);
exit;
?>
