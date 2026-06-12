<?php
session_start();
$_SESSION['user_id'] = 2;
$_SESSION['role'] = 'chief';
require_once __DIR__ . '/api/chef_pick_order.php';
