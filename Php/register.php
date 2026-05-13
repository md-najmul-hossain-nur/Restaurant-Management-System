<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../Html/signup.html');
    exit;
}

// accept either 'fullname' (used in signup.html) or 'name'
$name = trim($_POST['fullname'] ?? $_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';
$role = strtolower(trim($_POST['role'] ?? 'customer'));

// Normalize common variants so DB enum stays consistent
if ($role === 'chef') $role = 'chief';
if ($role === 'staff') $role = 'waiter';

if (!$name || !$email || !$password) {
    header('Location: ../Html/signup.html?error=missing');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../Html/signup.html?error=invalid_email');
    exit;
}

// check existing by email or phone
try {
    if ($phone) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1');
        $stmt->execute([$email, $phone]);
    } else {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
    }
    if ($stmt->fetch()) {
        header('Location: ../Html/signup.html?error=exists');
        exit;
    }
} catch (Exception $e) {
    header('Location: ../Html/signup.html?error=db');
    exit;
}

// If role requires certificate, validate and save upload
$certificate_path = null;
if (in_array($role, ['chief', 'chef'])) {
    if (empty($_FILES['certificate']) || $_FILES['certificate']['error'] !== UPLOAD_ERR_OK) {
        header('Location: ../Html/signup.html?error=certificate_required');
        exit;
    }

    // accept only PDF
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($_FILES['certificate']['tmp_name']);
    if ($mime !== 'application/pdf') {
        header('Location: ../Html/signup.html?error=invalid_certificate');
        exit;
    }

    $uploadDir = __DIR__ . '/../Images/certificates/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $orig = basename($_FILES['certificate']['name']);
    $ext = pathinfo($orig, PATHINFO_EXTENSION) ?: 'pdf';
    $filename = time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $target = $uploadDir . $filename;
    if (!move_uploaded_file($_FILES['certificate']['tmp_name'], $target)) {
        header('Location: ../Html/signup.html?error=upload_failed');
        exit;
    }
    $certificate_path = 'Images/certificates/' . $filename;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)');
    $phoneValue = $phone ?: null;
    $stmt->execute([$name, $email, $phoneValue, $hash, $role]);

    $user_id = $pdo->lastInsertId();

    if (in_array($role, ['chief', 'chef'])) {
        $stmt2 = $pdo->prepare('INSERT INTO chiefs (user_id, phone, certificate_path) VALUES (?, ?, ?)');
        $stmt2->execute([$user_id, $phoneValue, $certificate_path]);
    } elseif (in_array($role, ['waiter', 'staff'])) {
        $stmt3 = $pdo->prepare('INSERT INTO waiters (user_id, phone) VALUES (?, ?)');
        $stmt3->execute([$user_id, $phoneValue]);
    }

    $pdo->commit();

    header('Location: ../Html/login.html?registered=1');
    exit;
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    header('Location: ../Html/signup.html?error=server');
    exit;
}

?>
