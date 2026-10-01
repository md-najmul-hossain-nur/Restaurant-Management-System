# Restaurant Management System

A full-stack restaurant management web application built with PHP, MySQL, HTML, CSS, and JavaScript. It supports role-based access for customers, chefs, waiters, and administrators to manage reservations, orders, tables, menu items, and business reporting.

## Overview

This project is designed for a modern restaurant workflow where multiple departments operate from a single platform:

- Customers can register, log in, book tables, and place food orders.
- Chefs can review and process kitchen orders and recipes.
- Waiters can manage assigned tables and assist with delivery/service workflows.
- Admins can manage staff, menu approvals, table availability, reservations, and reports.

The system is built as a PHP application and uses a MySQL database for persistent storage.

## Features

### Customer features
- User registration and login
- Email-based authentication
- Account approval workflow for new customers
- Table reservation booking
- Menu browsing and order placement
- Order tracking and service status updates

### Admin features
- Dashboard overview with live restaurant statistics
- Employee management for chefs and waiters
- Customer approvals and account monitoring
- Reservation and table management
- Menu item approval and updates
- Financial / reporting information
- Order management and monitoring

### Chef features
- Recipe creation and management
- Menu item status approval handling
- Kitchen order visibility and processing
- Food preparation updates

### Waiter features
- Table assignment and service management
- Order handling and delivery coordination
- Attendance / clock-in and clock-out tracking

### Additional features
- Reservation expiration logic
- Chat-related API scaffolding for support/conversation handling
- Role-based access protection
- Image upload support for menu items, tables, and chefs

## Tech Stack

- PHP 8+
- MySQL / MariaDB
- HTML5
- CSS3
- JavaScript
- Apache / XAMPP / WAMP server

## Project Structure

```text
Restaurant-Management-System/
├── api/                     # API endpoints for orders, reservations, menu, etc.
├── CSS/                     # Stylesheets
├── Html/                    # Frontend web pages
├── Images/                  # Restaurant images and uploads
├── JavaScript/              # Client-side scripts
├── Php/                     # PHP backend logic and database config
├── uploads/                 # Uploaded files and assets
├── .htaccess                # URL/rewrite settings
├── database.sql             # Database schema and seed data
├── test_mark_ready.php      # Order readiness testing helper
├── README.md                # Project documentation
└── ...
```

## Database Setup

1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or terminal).
2. Create a database named `restaurant_db`.
3. Import the SQL file:

```bash
mysql -u root -p restaurant_db < database.sql
```

The SQL script creates:
- `users`
- `admins`
- `waiters`
- `chiefs`
- `restaurant_tables`
- `reservations`
- `recipes`
- `orders`
- `order_items`

It also seeds a default admin account and sample menu items.

## Configuration

Edit the database credentials in:

- `Php/db.php`

Default configuration in the project is:

```php
$DB_HOST = 'localhost';
$DB_NAME = 'restaurant_db';
$DB_USER = 'root';
$DB_PASS = '';
```

If your local setup uses a different MySQL username or password, update those values before running the project.

## Run the Project

### With XAMPP / WAMP

1. Copy the project folder into your local server root:
   - XAMPP: `C:/xampp/htdocs/`
   - WAMP: `C:/wamp64/www/`
2. Start Apache and MySQL.
3. Open the browser and go to:

```text
http://localhost/Restaurant-Management-System/Html/login.html
```

Or, if the folder name is different, use the correct local path.

## Default Access

The app includes a seeded admin account in `database.sql`.

- Email: `admin@gmail.com`
- Role: `admin`

New customer accounts are created through the signup page and must be approved by the admin before they can log in.

## Main User Flow

### Admin
- Log in to the admin dashboard
- Manage employees and approvals
- Review restaurant metrics and reports
- Control table and reservation status
- Approve or reject menu items

### Customer
- Sign up
- Wait for admin approval
- Book a table or place an order
- Track order/booking progress

### Chef
- View assigned recipes and kitchen orders
- Update order readiness states

### Waiter
- View assigned tables and active orders
- Coordinate delivery and table service

## Notes

- The project uses basic PHP server-side session handling and role checks.
- Some features depend on the MySQL schema and the database being correctly imported.
- Ensure uploaded images and folders have proper write permissions if you plan to add image files via the UI.

## Recommended Improvements

- Add proper production-grade authentication and session security
- Improve validation and sanitization in all API files
- Add automated tests for CRUD flows
- Add Docker support for easier deployment
- Refactor repeated logic into a shared service layer

## License

This project is provided for educational and learning purposes. If you are using it in a production environment, review the codebase and make the necessary security improvements first.

## Contribution

You can extend the project by:
- adding more menu categories
- improving UI/UX
- creating REST API documentation
- cleaning up the database models and logic

---

If you want, I can also generate a more advanced README in Bangla or add a project screenshot section and installation guide for Windows + XAMPP specifically.
