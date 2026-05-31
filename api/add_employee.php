<?php
// api/add_employee.php
// Called by admin.js — Add Employee form
// Method: POST multipart/form-data (certificate file upload)

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
requireLogin('admin');

$name = trim($_POST['fullName'] ?? $_POST['fullname'] ?? $_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = (string) ($_POST['password'] ?? '');
$role = strtolower(trim($_POST['role'] ?? $_POST['employeeRole'] ?? ''));

if ($role === 'chef') {
    $role = 'chief';
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['error' => 'Invalid email address'], 400);
}

$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    respond(['error' => 'Email already in use'], 409);
}

$name = $name !== '' ? $name : explode('@', $email)[0];
$role = in_array($role, ['waiter', 'chief'], true) ? $role : 'waiter';
$password = $password !== '' ? $password : '12345678';

$certPath = null;
if ($role === 'chief' && !empty($_FILES['certificate']['name'])) {
    $certificate = $_FILES['certificate'];
    $extension = strtolower(pathinfo($certificate['name'], PATHINFO_EXTENSION));
    if ($extension === 'pdf') {
        $uploadDir = __DIR__ . '/../uploads/certificates/';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            respond(['error' => 'Unable to create certificate upload folder'], 500);
        }

        $safeName = uniqid('cert_', true) . '.pdf';
        $targetPath = $uploadDir . $safeName;
        if (!move_uploaded_file($certificate['tmp_name'], $targetPath)) {
            respond(['error' => 'Certificate upload failed'], 500);
        }

        $certPath = 'uploads/certificates/' . $safeName;
    }
}

$hashed = password_hash($password, PASSWORD_DEFAULT);
$pdo->beginTransaction();
try {
    $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        ->execute([$name, $email, $hashed, $role]);
    $userId = $pdo->lastInsertId();

    if ($role === 'waiter') {
        $pdo->prepare('INSERT INTO waiters (user_id) VALUES (?)')->execute([$userId]);
    } elseif ($role === 'chief') {
        $pdo->prepare('INSERT INTO chiefs (user_id, certificate_path) VALUES (?, ?)')
            ->execute([$userId, $certPath]);
    }

    $pdo->commit();
    respond(['success' => true, 'user_id' => $userId, 'message' => 'Employee added!']);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['error' => 'Failed: ' . $e->getMessage()], 500);
}