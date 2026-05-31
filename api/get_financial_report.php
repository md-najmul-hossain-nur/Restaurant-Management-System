<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../Php/db.php';
require_once __DIR__ . '/../Php/bootstrap.php';
requireLogin('admin');

$start = $_GET['start'] ?? date('Y-m-01');
$end   = $_GET['end']   ?? date('Y-m-d');
$format = strtolower($_GET['format'] ?? 'json');

$startDate = DateTime::createFromFormat('Y-m-d', $start) ?: new DateTime('first day of this month');
$endDate   = DateTime::createFromFormat('Y-m-d', $end)   ?: new DateTime('today');
$start = $startDate->format('Y-m-d');
$end   = $endDate->format('Y-m-d');

$summaryStmt = $pdo->prepare(
    "SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
     FROM orders
     WHERE DATE(created_at) BETWEEN ? AND ?"
);
$summaryStmt->execute([$start, $end]);
$summary = $summaryStmt->fetch() ?: [
    'total_orders' => 0,
    'total_revenue' => 0,
    'avg_order_value' => 0,
];

$ordersStmt = $pdo->prepare(
    "SELECT
        o.id,
        o.created_at,
        o.status,
        o.total_amount,
        COALESCE(o.guest_name, u.name) AS customer_name,
        COALESCE(o.guest_phone, u.phone, '') AS customer_contact,
        GROUP_CONCAT(DISTINCT oi.name ORDER BY oi.id SEPARATOR ', ') AS item_names
     FROM orders o
     LEFT JOIN users u ON u.id = o.customer_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE DATE(o.created_at) BETWEEN ? AND ?
     GROUP BY o.id
     ORDER BY o.created_at DESC"
);
$ordersStmt->execute([$start, $end]);
$orders = $ordersStmt->fetchAll() ?: [];

if (in_array($format, ['csv', 'xls'], true)) {
    $isExcel = $format === 'xls';
    $filename = sprintf('financial-report-%s-to-%s.%s', $start, $end, $isExcel ? 'xls' : 'csv');
    header('Content-Type: ' . ($isExcel ? 'application/vnd.ms-excel' : 'text/csv') . '; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $out = fopen('php://output', 'w');
    $delimiter = $isExcel ? "\t" : ',';
    fputcsv($out, ['Order ID', 'Created At', 'Customer', 'Contact', 'Status', 'Total Amount', 'Items'], $delimiter);

    foreach ($orders as $order) {
        fputcsv($out, [
            $order['id'],
            $order['created_at'],
            $order['customer_name'] ?: 'Guest',
            $order['customer_contact'] ?: '',
            $order['status'],
            number_format((float)$order['total_amount'], 2, '.', ''),
            $order['item_names'] ?: '',
        ], $delimiter);
    }

    fclose($out);
    exit;
}

respond([
    'summary' => [
        'start' => $start,
        'end' => $end,
        'total_orders' => (int) $summary['total_orders'],
        'total_revenue' => (float) $summary['total_revenue'],
        'avg_order_value' => (float) $summary['avg_order_value'],
    ],
    'orders' => $orders,
]);
