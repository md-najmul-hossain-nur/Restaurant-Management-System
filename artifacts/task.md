# Implement 3 Distinct Order Workflows

- `[x]` **Database Updates**
  - `[x]` Add `delivery_address` column to `orders` table.
  - `[x]` Update `status` ENUM in `orders` table to include `delivered`.

- `[x]` **Order Placement (Guest & Customer)**
  - `[x]` Update `api/place_order.php` to accept and save `delivery_address`.
  - `[x]` Update Index page guest checkout modal to include "Delivery Address" input.
  - `[x]` Update Customer Orders page checkout modal to include "Delivery Address" input (when no table is selected).

- `[x]` **Admin Workflow (Guest Orders)**
  - `[x]` Add "Orders & Delivery" tab in `Admin.php`.
  - `[x]` Build Admin UI to view unassigned guest orders.
  - `[x]` Create API for Admin to assign a Waiter to an order (`api/assign_order_waiter.php`).

- `[x]` **Waiter Workflow (Delivery Pool & Fulfillment)**
  - `[x]` Update `Waiter.php` to include a "Ready Deliveries" section for unassigned customer delivery orders.
  - `[x]` Create API for Waiters to fetch ready deliveries (`api/get_ready_deliveries.php`).
  - `[x]` Create API for Waiters to claim a delivery (`api/claim_delivery.php` or adapt `update_order_status.php`).
  - `[x]` Update `api/update_order_status.php` to support marking as `delivered`.

- `[x]` **Customer Acceptance Workflow**
  - `[x]` Update `Customer_orders.html` and `customer_orders.js` to display an "Accept Delivery" button when an order is in `delivered` status.
  - `[x]` Update `api/customer_accept_order.php` to allow accepting `delivered` orders.
  - `[x]` For guest orders, Waiter can mark it `paid` directly from `delivered` status to complete the flow.

- `[x]` **Verification**
  - `[x]` Verify Guest Order flow (Admin assigns -> Chef -> Waiter delivers).
  - `[x]` Verify Customer Delivery flow (Chef -> Waiter claims -> Waiter delivers -> Customer accepts).
  - `[x]` Verify Table Order flow (Waiter -> Chef -> Waiter delivers -> Customer accepts).
