<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../Html/signup.html');
    exit;
}

// Form data
$fullname = trim($_POST['fullname'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';

// Fixed role
$role = 'customer';

// Validation
if (!$fullname || !$email || !$password) {
    header('Location: ../Html/signup.html?error=missing');
    exit;
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../Html/signup.html?error=invalid_email');
    exit;
}

try {

    // Check existing user
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        header('Location: ../Html/signup.html?error=exists');
        exit;
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $insertUser = $pdo->prepare(
        'INSERT INTO users (name, email, phone, password, role)
         VALUES (?, ?, ?, ?, ?)'
    );

    $insertUser->execute([
        $fullname,
        $phone ?: null,
        $email,
        $passwordHash,
        $role
    ]);

    // Redirect to login
    header('Location: ../Html/login.html?registered=1');
    exit;

} catch (Exception $e) {

    header('Location: ../Html/signup.html?error=server');
    exit;
}
?>