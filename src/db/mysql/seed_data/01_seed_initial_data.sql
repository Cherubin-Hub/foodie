USE foodie_db;

INSERT INTO tbl_system_license (app_code, app_secret, request_nonce, installation_request_code, is_active)
VALUES ('FOODIE_POS', 'foodie_master_secret_2026_x99_secure', 'A9F3K2', 'REQ-FOODIE_POS-A9F3K2', FALSE)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO tbl_store_settings (id, store_name, tagline, hero_image_url, default_address, primary_color)
VALUES (1, 'Foodie.', 'Hot meals, right at your door', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', 'San Francisco, CA • 25-35 min delivery', '#2E7D32')
ON DUPLICATE KEY UPDATE id=id;

INSERT IGNORE INTO tbl_roles (role_code, role_name) VALUES
  ('ADMIN', 'Administrator'),
  ('STAFF', 'Staff Member'),
  ('CUSTOMER', 'Registered Customer'),
  ('GUEST', 'Unregistered Guest');

INSERT IGNORE INTO tbl_users (email, phone, full_name, password_hash, role_code)
VALUES ('admin@foodie.com', '555-0199', 'Master Admin', 'admin123', 'ADMIN');

INSERT IGNORE INTO tbl_modules (module_code, module_name, description) VALUES
  ('HOME_MENU', 'Home & Menu Catalog', 'Browse categories, deals and food items'),
  ('ORDER_AGAIN', 'Order Again', 'Quick re-order from previous purchases'),
  ('DEALS_OFFERS', 'Deals & Offers', 'View active promotions and discounts'),
  ('SAVED_FAVORITES', 'Saved Favorites', 'Saved customer food items'),
  ('CART_CHECKOUT', 'Cart & Checkout', 'Cart review and order placement'),
  ('ORDER_TRACKER', 'Order Tracker', 'Real-time order status and digital receipt'),
  ('PROFILE_SETTINGS', 'Profile Settings', 'User account settings'),
  ('ADMIN_DASHBOARD', 'Admin Dashboard', 'Kitchen and store live order dashboard'),
  ('ADMIN_CATALOG', 'Admin Catalog Builder', 'Manage categories and food items'),
  ('ADMIN_BRANDING', 'Admin Branding', 'Store name, colors and hero image'),
  ('ADMIN_RBAC', 'Admin RBAC Matrix', 'Access rights toggle switchboard'),
  ('ADMIN_LICENSE', 'Admin License', 'Cryptographic offline license activation');

INSERT IGNORE INTO tbl_role_modules (role_code, module_code, can_view, can_create, can_edit, can_delete) VALUES
  ('ADMIN', 'HOME_MENU', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ORDER_AGAIN', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'DEALS_OFFERS', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'SAVED_FAVORITES', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'CART_CHECKOUT', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ORDER_TRACKER', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'PROFILE_SETTINGS', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ADMIN_DASHBOARD', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ADMIN_CATALOG', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ADMIN_BRANDING', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ADMIN_RBAC', TRUE, TRUE, TRUE, TRUE),
  ('ADMIN', 'ADMIN_LICENSE', TRUE, TRUE, TRUE, TRUE),
  ('CUSTOMER', 'HOME_MENU', TRUE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'ORDER_AGAIN', TRUE, TRUE, FALSE, FALSE),
  ('CUSTOMER', 'DEALS_OFFERS', TRUE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'SAVED_FAVORITES', TRUE, TRUE, TRUE, TRUE),
  ('CUSTOMER', 'CART_CHECKOUT', TRUE, TRUE, TRUE, FALSE),
  ('CUSTOMER', 'ORDER_TRACKER', TRUE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'PROFILE_SETTINGS', TRUE, FALSE, TRUE, FALSE),
  ('CUSTOMER', 'ADMIN_DASHBOARD', FALSE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'ADMIN_CATALOG', FALSE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'ADMIN_BRANDING', FALSE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'ADMIN_RBAC', FALSE, FALSE, FALSE, FALSE),
  ('CUSTOMER', 'ADMIN_LICENSE', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'HOME_MENU', TRUE, FALSE, FALSE, FALSE),
  ('GUEST', 'ORDER_AGAIN', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'DEALS_OFFERS', TRUE, FALSE, FALSE, FALSE),
  ('GUEST', 'SAVED_FAVORITES', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'CART_CHECKOUT', TRUE, TRUE, TRUE, FALSE),
  ('GUEST', 'ORDER_TRACKER', TRUE, FALSE, FALSE, FALSE),
  ('GUEST', 'PROFILE_SETTINGS', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'ADMIN_DASHBOARD', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'ADMIN_CATALOG', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'ADMIN_BRANDING', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'ADMIN_RBAC', FALSE, FALSE, FALSE, FALSE),
  ('GUEST', 'ADMIN_LICENSE', FALSE, FALSE, FALSE, FALSE);

INSERT IGNORE INTO tbl_categories (id, name, image_url, sort_order, is_active) VALUES
  (1, 'Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', 1, TRUE),
  (2, 'Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80', 2, TRUE),
  (3, 'Sushi', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=80', 3, TRUE),
  (4, 'Chicken', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&q=80', 4, TRUE),
  (5, 'Meat', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80', 5, TRUE),
  (6, 'Noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80', 6, TRUE),
  (7, 'Pasta', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80', 7, TRUE);

INSERT IGNORE INTO tbl_food_items (id, category_id, name, image_url, price, calories, prep_time_minutes, is_available) VALUES
  (1, 2, 'Pepperoni Feast', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80', 11.99, 540, 20, TRUE),
  (2, 2, 'Cheesy Garlic Bread', 'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&q=80', 5.99, 280, 15, TRUE),
  (3, 3, 'Sushi Bento Box', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500&q=80', 14.50, 610, 25, TRUE),
  (4, 3, 'Salmon Avocado Maki', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80', 9.80, 380, 15, TRUE),
  (5, 4, 'Hot & Spicy Bucket', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&q=80', 18.90, 1240, 30, TRUE),
  (6, 4, 'Crispy Chicken Wrap', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500&q=80', 6.49, 520, 12, TRUE),
  (7, 4, 'Herb Roast Chicken', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&q=80', 13.90, 980, 35, TRUE),
  (8, 5, 'Grilled Ribeye Steak', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', 24.90, 690, 25, TRUE),
  (9, 1, 'Classic Hot Dog', 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&q=80', 3.99, 360, 10, TRUE),
  (10, 5, 'Beef Kebab Skewers', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80', 10.90, 450, 20, TRUE),
  (11, 1, 'Cheese Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', 6.99, 480, 15, TRUE),
  (12, 6, 'Tonkotsu Ramen', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', 12.50, 640, 20, TRUE);

INSERT IGNORE INTO tbl_deals (id, title, description, promo_code, discount_percentage, free_delivery, is_active) VALUES
  (1, '30% OFF YOUR WHOLE ORDER', 'Use code at checkout to claim 30% off any order over $15', 'FOODIE30', 30.00, FALSE, TRUE),
  (2, 'FREE DELIVERY', 'Get zero delivery fee on all local takeaway orders', 'FREESHIP', 0.00, TRUE, TRUE);