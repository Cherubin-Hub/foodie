CREATE TABLE IF NOT EXISTS tbl_orders (
  id SERIAL PRIMARY KEY,
  tracking_token VARCHAR(20) UNIQUE NOT NULL,
  user_id INT REFERENCES tbl_users(id) ON DELETE SET NULL,
  guest_session_token VARCHAR(64) REFERENCES tbl_guest_sessions(session_token) ON DELETE SET NULL,
  guest_temporary_name VARCHAR(100),
  order_type VARCHAR(20) NOT NULL DEFAULT 'DINE_IN',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  subtotal NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  promo_code VARCHAR(50),
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tbl_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES tbl_orders(id) ON DELETE CASCADE,
  food_item_id INT NOT NULL REFERENCES tbl_food_items(id) ON DELETE RESTRICT,
  item_name VARCHAR(150) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL
);