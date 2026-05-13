<?php
session_start();
require_once __DIR__ . '/db.php';

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

// allow login by email OR phone
$stmt = $pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ? OR phone = ? LIMIT 1');
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user) {
    header('Location: ../Html/login.html?error=not_found');
    exit;
}

if (!password_verify($password, $user['password'])) {
    header('Location: ../Html/login.html?error=bad_password');
    exit;
}

// Optional: check role matches selected role
if ($role && $role !== $user['role']) {
    header('Location: ../Html/login.html?error=role_mismatch');
    exit;
}

// Set session
$_SESSION['user_id'] = $user['id'];
$_SESSION['name'] = $user['name'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];

// Redirect based on role
switch ($user['role']) {
    case 'admin':
        $redirect = '../Html/Admin.html';
        break;
    case 'chief':
        $redirect = '../Html/Chief.html';
        break;
    case 'waiter':
        $redirect = '../Html/Waiter.html';
        break;
    default:
        $redirect = '../Html/Customer.html';
}

header('Location: ' . $redirect);
exit;

?>
