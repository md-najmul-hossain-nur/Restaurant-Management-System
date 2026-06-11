<?php
require_once __DIR__ . '/../PHP/db.php';

// The new password requested by the user
$newPassword = '12345678';
$email = 'admin@gmail.com';

// Generate safe hash
$hash = password_hash($newPassword, PASSWORD_DEFAULT);

try {
    // Update the admin user's password
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ? AND role = 'admin'");
    $stmt->execute([$hash, $email]);

    if ($stmt->rowCount() > 0) {
        echo "<h1>Success!</h1>";
        echo "<p>Admin password has been updated to: <strong>$newPassword</strong></p>";
        echo "<p>You can now <a href='../Html/login.html'>Log In</a> with <strong>$email</strong> and your new password.</p>";
    } else {
        echo "<h1>Notice</h1>";
        echo "<p>Admin user with email '$email' was not found or the password was already set to this value.</p>";
        echo "<p><a href='../Html/login.html'>Back to Login</a></p>";
    }
} catch (PDOException $e) {
    echo "<h1>Error</h1>";
    echo "<p>Database update failed: " . $e->getMessage() . "</p>";
}

// Self-destruct recommendation: 
// unlink(__FILE__); 
?>
