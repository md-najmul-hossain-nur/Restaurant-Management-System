<?php
// api/add_employee.php
// Called by admin.js — Add Employee form
// Method: POST multipart/form-data (certificate file upload)

if (session_status() === PHP_SESSION_NONE) session_start();
require_once '../PHP/db.php';
requireLogin('admin');

$name     = trim($_POST['fullName']  ?? '');
$email    = trim($_POST['email']     ?? '');
$password =      $_POST['password']  ?? '';
$role     =      $_POST['role']      ?? '';

if (!$name || !$email || !$password || !$role)
    respond(['error' => 'All fields are required'], 400);
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
    respond(['error' => 'Invalid email address'], 400);
if (!in_array($role, ['waiter', 'chief']))
    respond(['error' => 'Invalid role'], 400);
if (strlen($password) < 8)
    respond(['error' => 'Password must be at least 8 characters'], 400);

$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) respond(['error' => 'Email already in use'], 409);

// Certificate upload (required for chief)
$certPath = null;
if ($role === 'chief') {
    if (empty($_FILES['certificate']['name']))
        respond(['error' => 'Certificate is required for chef role'], 400);
    $uploadDir = '../uploads/certificates/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $ext      = pathinfo($_FILES['certificate']['name'], PATHINFO_EXTENSION);
    $safeName = uniqid('cert_') . '.' . $ext;
    if (!move_uploaded_file($_FILES['certificate']['tmp_name'], $uploadDir . $safeName))
        respond(['error' => 'Certificate upload failed'], 500);
    $certPath = $uploadDir . $safeName;
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$pdo->beginTransaction();
try {
    $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        ->execute([$name, $email, $hashed, $role]);
    $userId = $pdo->lastInsertId();

    if ($role === 'waiter')
        $pdo->prepare('INSERT INTO waiters (user_id) VALUES (?)')->execute([$userId]);
    elseif ($role === 'chief')
        $pdo->prepare('INSERT INTO chiefs (user_id, certificate_path) VALUES (?, ?)')->execute([$userId, $certPath]);

    $pdo->commit();
    respond(['success' => true, 'user_id' => $userId, 'message' => 'Employee added!']);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => 'Failed: ' . $e->getMessage()], 500);
}