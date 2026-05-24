<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../Html/signup.html');
    exit;
}

// Form data
$fullname = trim($_POST['fullname'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm-password'] ?? '';

// Fixed role for signup
$role = 'customer';

// Validation
if (!$fullname || !$email || !$password) {
    header('Location: ../Html/signup.html?error=missing');
    exit;
}

if ($password !== $confirmPassword) {
    header('Location: ../Html/signup.html?error=password_mismatch');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../Html/signup.html?error=invalid_email');
    exit;
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        header('Location: ../Html/signup.html?error=exists');
        exit;
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user (WITHOUT phone column)
    $insertUser = $pdo->prepare(
        'INSERT INTO users (name, email, password, role) 
         VALUES (?, ?, ?, ?)'
    );

    $insertUser->execute([
        $fullname,
        $email,
        $passwordHash,
        $role
    ]);

    // Success message on signup page
    header('Location: ../Html/signup.html?success=registered');
    exit;

} catch (Exception $e) {
    header('Location: ../Html/signup.html?error=server');
    exit;
}
?>
