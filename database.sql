CREATE DATABASE restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE restaurant_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  avatar_path VARCHAR(255),
  role ENUM('customer','chief','waiter','admin') NOT NULL DEFAULT 'customer',
  approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approval_decided_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE waiters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(20),
  shift ENUM('morning','afternoon','evening','night') DEFAULT 'morning',
  hired_at DATE,
  is_clocked_in TINYINT(1) NOT NULL DEFAULT 0,
  last_clock_in TIMESTAMP NULL DEFAULT NULL,
  last_clock_out TIMESTAMP NULL DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_waiter_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chiefs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(20),
  certificate_path VARCHAR(255),
  specialty VARCHAR(100),
  hired_at DATE,
  is_head TINYINT(1) NOT NULL DEFAULT 0,
  is_clocked_in TINYINT(1) NOT NULL DEFAULT 0,
  last_clock_in TIMESTAMP NULL DEFAULT NULL,
  last_clock_out TIMESTAMP NULL DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chief_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(20),
  is_super TINYINT(1) NOT NULL DEFAULT 0,
  can_manage_staff TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE restaurant_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number INT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 4,
  position VARCHAR(50),
  status ENUM('available','reserved','occupied') NOT NULL DEFAULT 'available',
  assigned_waiter_id INT DEFAULT NULL,
  reserved_customer_id INT DEFAULT NULL,
  active_customer_id INT DEFAULT NULL,
  image_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  customer_id INT DEFAULT NULL,
  reserved_date DATE NOT NULL,
  reserved_time TIME NOT NULL,
  reserved_end_time TIME NOT NULL DEFAULT '21:00:00',
  guest_count INT NOT NULL DEFAULT 1,
  special_requests TEXT,
  status ENUM('pending','approved','confirmed','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chef_id INT DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  prep_time VARCHAR(50),
  category VARCHAR(100),
  image_path VARCHAR(255),
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recipes_chef FOREIGN KEY (chef_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT DEFAULT NULL,
  table_id INT DEFAULT NULL,
  waiter_id INT DEFAULT NULL,
  chef_id INT DEFAULT NULL,
  status ENUM('queued','in_progress','ready','delivered','served','cancelled','paid') NOT NULL DEFAULT 'queued',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) DEFAULT 'Cash',
  guest_name VARCHAR(100),
  guest_phone VARCHAR(20),
  delivery_address VARCHAR(255) NULL,
  notes TEXT,
  scheduled_time DATETIME NULL,
  total_prep_time INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_waiter FOREIGN KEY (waiter_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_chef FOREIGN KEY (chef_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  recipe_id INT DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (name, email, password, role, approval_status, approval_decided_at)
VALUES (
  'Admin',
  'admin@gmail.com',
  '$2y$10$QNBABC7dn3LLwGqmL/WaRe3iNT3ectI5Buka96Q8TBZaih2i6l9.S',
  'admin',
  'approved',
  NOW()
);

INSERT INTO admins (user_id, is_super, can_manage_staff)
VALUES (
  LAST_INSERT_ID(),
  1,
  1
);
//

INSERT INTO recipes (chef_id, name, description, price, prep_time, category, image_path, status)
VALUES
  (NULL, 'Grilled Beef with Potatoes', 'Meat, potatoes, rice, tomato, and house sauce.', 29.00, '25', 'Dinner', 'Images/food/main cross/pexels-mohamed9380-36682995.jpg', 'approved'),
  (NULL, 'Herb Roasted Salmon', 'Salmon, garlic butter, lemon, and fresh herbs.', 29.00, '20', 'Lunch', 'Images/food/main cross/pexels-mohamed9380-36691316.jpg', 'approved'),
  (NULL, 'Chicken Alfredo Pasta', 'Creamy sauce, chicken, parmesan, and parsley.', 24.00, '18', 'Lunch', 'Images/food/chicken.jpg', 'approved'),
  (NULL, 'Steakhouse Special', 'Prime steak, garlic mash, pepper jus, and greens.', 34.00, '30', 'Dinner', 'Images/food/main cross/pexels-mohamed9380-36734935.jpg', 'approved'),
  (NULL, 'Garden Fresh Salad', 'Mixed greens, feta, cucumber, and citrus dressing.', 16.00, '10', 'Breakfast', 'Images/food/main cross/pexels-valeriya-19503815.jpg', 'approved'),
  (NULL, 'Berry Cheesecake', 'Creamy cheesecake with berry compote.', 12.00, '12', 'Desserts', 'Images/menu/berrychessecake.jpg', 'approved'),
  (NULL, 'Tropical Fizz', 'Fresh tropical fruit cooler with soda.', 8.00, '5', 'Drinks', 'Images/menu/tropicalfizz.jpg', 'approved'),
  (NULL, 'Chef Signature Seafood Trio', 'Seafood selection with seasonal vegetables.', 38.00, '28', 'Special', 'Images/menu/Seafoodtrio.jpg', 'approved');
