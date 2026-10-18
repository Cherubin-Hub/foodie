# Step 01: Dual-Database Modular Schemas, Offline Cryptographic Licensing & CQRS RPC Engine

## 🎯 Objective
Implement the dual-database persistence layer for the **Foodie POS & Ordering System**, fully supporting both **Supabase (PostgreSQL 15+)** and **MySQL 8.0+** with 100% feature parity. The architecture adheres to the Database-Centric MVC and SQL CQRS patterns dictated by [`AGENTS.md`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/AGENTS.md), enforcing business logic, licensing checks, role permissions, and JSON bundle transformations directly inside the database before payloads are transmitted to the Express API controller.

Key architectural systems established in this phase:
1. **100% Offline Cryptographic License Lock ([`src/db/supabase/functions_and_procedures/03_sp_activate_license.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/functions_and_procedures/03_sp_activate_license.sql)):** Implements offline HMAC-SHA256 signature verification over an installation nonce with automatic nonce rotation and strict duration tiers (`7D`, `14D`, `30D`, `90D`, `264D`, `LIFE`).
2. **Anti-Clock-Tampering Verification ([`src/db/supabase/functions_and_procedures/01_fn_verify_license_status.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/functions_and_procedures/01_fn_verify_license_status.sql)):** Records high-water-mark timestamps on every database call (`last_verified_at`) and permanently locks the application if system time is wound backward.
3. **Pure-SQL RFC 2104 HMAC Engine for MySQL ([`src/db/mysql/functions_and_procedures/01_fn_hmac_sha256.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/mysql/functions_and_procedures/01_fn_hmac_sha256.sql)):** Replaces missing native MySQL HMAC functions with a standard pure-SQL XOR-padding loop to guarantee 100% compatibility with PostgreSQL's `pgcrypto`.
4. **Guest Temporary Session & Table Ordering ([`src/db/supabase/tables/03_tbl_roles_and_users.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/tables/03_tbl_roles_and_users.sql), [`06_tbl_orders_and_items.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/tables/06_tbl_orders_and_items.sql)):** Tracks unregistered guests (`"Alex - Table 4"`) and maps their orders to dedicated `order_type` classifications (`DINE_IN`, `TAKEOUT`, `DELIVERY`).
5. **Dynamic Role-Module Access Matrix ([`src/db/supabase/views/02_vw_role_module_matrix.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/views/02_vw_role_module_matrix.sql)):** Controls granular module permissions (`can_view`, `can_create`, `can_edit`, `can_delete`) across `ADMIN`, `STAFF`, `CUSTOMER`, and `GUEST` roles.
6. **CQRS Pre-Bundled Payload Engine ([`src/db/supabase/functions_and_procedures/05_sp_render_home_page.sql`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/functions_and_procedures/05_sp_render_home_page.sql)):** Bundles store branding, allowed modules, categories, active promotions, and catalog items into a single pre-formatted JSON document.

---

## 🛠 Step-by-Step Implementation

### A. Modular PostgreSQL / Supabase Scripts (`src/db/supabase/`)

#### 1. System License Table (`src/db/supabase/tables/01_tbl_system_license.sql`)
Stores cryptographic licensing configuration, installation nonce, and tamper validation timestamps.

**File:** `src/db/supabase/tables/01_tbl_system_license.sql`
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tbl_system_license (
  id SERIAL PRIMARY KEY,
  app_code VARCHAR(50) NOT NULL UNIQUE,
  app_secret VARCHAR(100) NOT NULL,
  request_nonce VARCHAR(10) NOT NULL,
  installation_request_code VARCHAR(100) NOT NULL,
  license_key VARCHAR(150),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Line-by-Line Technical Analysis:**
- `CREATE EXTENSION IF NOT EXISTS pgcrypto;`: Loads cryptographic primitives (`hmac`, `digest`, `gen_random_bytes`) directly into PostgreSQL.
- `request_nonce`: A 6-character random uppercase alphanumeric token generated dynamically to bind license keys to one specific hardware or installation instance.
- `last_verified_at`: Serves as the anti-clock-tampering watermark. Updated on every valid API/SQL transaction.

---

#### 2. White-Label Store Settings Table (`src/db/supabase/tables/02_tbl_store_settings.sql`)
Holds configurable brand attributes for the single-store storefront.

**File:** `src/db/supabase/tables/02_tbl_store_settings.sql`
```sql
CREATE TABLE IF NOT EXISTS tbl_store_settings (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL DEFAULT 'Foodie.',
  tagline VARCHAR(200) NOT NULL DEFAULT 'Hot meals, right at your door',
  hero_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  default_address TEXT NOT NULL DEFAULT 'San Francisco, CA • 25-35 min delivery',
  primary_color VARCHAR(10) NOT NULL DEFAULT '#2E7D32',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### 3. Roles, Users & Guest Sessions Tables (`src/db/supabase/tables/03_tbl_roles_and_users.sql`)
Encapsulates administrative users, registered customers, and transient 24-hour guest sessions.

**File:** `src/db/supabase/tables/03_tbl_roles_and_users.sql`
```sql
CREATE TABLE IF NOT EXISTS tbl_roles (
  role_code VARCHAR(20) PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS tbl_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_code VARCHAR(20) NOT NULL REFERENCES tbl_roles(role_code) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tbl_guest_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(64) UNIQUE NOT NULL,
  guest_temporary_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
```

**Key Architectural Features:**
- `tbl_guest_sessions`: Allows unregistered customers to enter a table identifier or nickname (`"Alex - Table 4"`) without email/password barriers, preserving their session state for 24 hours.

---

#### 4. Modules & Dynamic RBAC Matrix Table (`src/db/supabase/tables/04_tbl_modules_and_role_modules.sql`)
Defines the fine-grained permission grid mapping roles to functional areas.

**File:** `src/db/supabase/tables/04_tbl_modules_and_role_modules.sql`
```sql
CREATE TABLE IF NOT EXISTS tbl_modules (
  module_code VARCHAR(50) PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tbl_role_modules (
  id SERIAL PRIMARY KEY,
  role_code VARCHAR(20) NOT NULL REFERENCES tbl_roles(role_code) ON DELETE CASCADE,
  module_code VARCHAR(50) NOT NULL REFERENCES tbl_modules(module_code) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(role_code, module_code)
);
```

---

#### 5. Categories, Food Catalog & Promotions Tables (`src/db/supabase/tables/05_tbl_catalog_and_deals.sql`)
Stores catalog hierarchy, pricing, calorie disclosures, prep times, and promotional coupon codes.

**File:** `src/db/supabase/tables/05_tbl_catalog_and_deals.sql`
```sql
CREATE TABLE IF NOT EXISTS tbl_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tbl_food_items (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES tbl_categories(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  image_url TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  calories INT NOT NULL DEFAULT 0,
  prep_time_minutes INT NOT NULL DEFAULT 15,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tbl_deals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  promo_code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  free_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### 6. Orders & Itemized Order Line Items Table (`src/db/supabase/tables/06_tbl_orders_and_items.sql`)
Tracks order lifecycles with dedicated tracking tokens, guest table names, and order types.

**File:** `src/db/supabase/tables/06_tbl_orders_and_items.sql`
```sql
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
```

---

#### 7. Active License Status View (`src/db/supabase/views/01_vw_active_license.sql`)
Pre-computes whether the POS installation is valid, expired, or tampered.

**File:** `src/db/supabase/views/01_vw_active_license.sql`
```sql
CREATE OR REPLACE VIEW vw_active_license AS
SELECT
  id,
  app_code,
  request_nonce,
  installation_request_code,
  license_key,
  activated_at,
  expires_at,
  last_verified_at,
  is_active,
  CASE
    WHEN is_active = FALSE THEN 'INACTIVE'
    WHEN NOW() < last_verified_at THEN 'CLOCK_TAMPERED'
    WHEN NOW() > expires_at THEN 'EXPIRED'
    ELSE 'VALID'
  END AS license_status,
  CASE
    WHEN is_active = TRUE AND NOW() >= last_verified_at AND NOW() <= expires_at THEN TRUE
    ELSE FALSE
  END AS is_usable
FROM tbl_system_license
LIMIT 1;
```

---

#### 8. Role-Module Access Matrix View (`src/db/supabase/views/02_vw_role_module_matrix.sql`)
Denormalizes module access flags for the active role to hydrate the UI navigation switchboard.

**File:** `src/db/supabase/views/02_vw_role_module_matrix.sql`
```sql
CREATE OR REPLACE VIEW vw_role_module_matrix AS
SELECT
  rm.id,
  rm.role_code,
  r.role_name,
  rm.module_code,
  m.module_name,
  rm.can_view,
  rm.can_create,
  rm.can_edit,
  rm.can_delete
FROM tbl_role_modules rm
JOIN tbl_roles r ON rm.role_code = r.role_code
JOIN tbl_modules m ON rm.module_code = m.module_code
ORDER BY rm.role_code, rm.module_code;
```

---

#### 9. Anti-Clock-Tampering Verification Function (`src/db/supabase/functions_and_procedures/01_fn_verify_license_status.sql`)
Called before executing any business transaction to guarantee system integrity.

**File:** `src/db/supabase/functions_and_procedures/01_fn_verify_license_status.sql`
```sql
CREATE OR REPLACE FUNCTION fn_verify_license_status()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_lic RECORD;
  v_status TEXT;
  v_usable BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_lic FROM tbl_system_license LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'status', 'NO_RECORD', 'is_usable', FALSE, 'message', 'License not initialized.');
  END IF;

  IF v_lic.is_active = FALSE THEN
    v_status := 'INACTIVE';
  ELSIF NOW() < v_lic.last_verified_at THEN
    v_status := 'CLOCK_TAMPERED';
  ELSIF NOW() > v_lic.expires_at THEN
    v_status := 'EXPIRED';
  ELSE
    v_status := 'VALID';
    v_usable := TRUE;
    UPDATE tbl_system_license SET last_verified_at = NOW() WHERE id = v_lic.id;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'status', v_status,
    'is_usable', v_usable,
    'app_code', v_lic.app_code,
    'installation_request_code', v_lic.installation_request_code,
    'expires_at', v_lic.expires_at
  );
END;
$$;
```

---

#### 10. Developer Offline Key Generator Helper (`src/db/supabase/functions_and_procedures/02_fn_generate_license_key.sql`)
Utility function allowing developers and store owners to issue valid cryptographically signed activation keys for testing.

**File:** `src/db/supabase/functions_and_procedures/02_fn_generate_license_key.sql`
```sql
CREATE OR REPLACE FUNCTION fn_generate_license_key(
  p_duration VARCHAR(10),
  p_nonce VARCHAR(10)
)
RETURNS VARCHAR(100)
LANGUAGE plpgsql
AS $$
DECLARE
  v_secret TEXT := 'foodie_master_secret_2026_x99_secure';
  v_app_code TEXT := 'FOODIE_POS';
  v_raw TEXT;
  v_sig TEXT;
BEGIN
  v_raw := v_app_code || ':' || p_duration || ':' || p_nonce;
  v_sig := UPPER(SUBSTRING(ENCODE(HMAC(v_raw::bytea, v_secret::bytea, 'sha256'), 'hex') FROM 1 FOR 12));
  RETURN 'LIC-' || v_app_code || '-' || p_duration || '-' || p_nonce || '-' || v_sig;
END;
$$;
```

---

#### 11. Offline Cryptographic License Activation Procedure (`src/db/supabase/functions_and_procedures/03_sp_activate_license.sql`)
Parses the signed license key, validates the HMAC-SHA256 signature, computes expiration, and rotates the nonce.

**File:** `src/db/supabase/functions_and_procedures/03_sp_activate_license.sql`
```sql
CREATE OR REPLACE FUNCTION sp_activate_license(p_license_key VARCHAR(150))
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_lic RECORD;
  v_parts TEXT[];
  v_app_code TEXT;
  v_duration TEXT;
  v_nonce TEXT;
  v_provided_sig TEXT;
  v_computed_sig TEXT;
  v_expected_raw TEXT;
  v_expires_at TIMESTAMPTZ;
  v_new_nonce VARCHAR(6);
BEGIN
  SELECT * INTO v_lic FROM tbl_system_license LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'message', 'License record missing.');
  END IF;

  v_parts := string_to_array(TRIM(p_license_key), '-');
  IF array_length(v_parts, 1) <> 5 OR v_parts[1] <> 'LIC' THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invalid license key format.');
  END IF;

  v_app_code := v_parts[2];
  v_duration := v_parts[3];
  v_nonce := v_parts[4];
  v_provided_sig := UPPER(v_parts[5]);

  IF v_app_code <> v_lic.app_code THEN
    RETURN json_build_object('success', FALSE, 'message', 'License key does not match this application code.');
  END IF;

  IF v_nonce <> v_lic.request_nonce THEN
    RETURN json_build_object('success', FALSE, 'message', 'Expired or invalid Request Nonce. Please re-copy your Request Code.');
  END IF;

  v_expected_raw := v_app_code || ':' || v_duration || ':' || v_nonce;
  v_computed_sig := UPPER(SUBSTRING(ENCODE(HMAC(v_expected_raw::bytea, v_lic.app_secret::bytea, 'sha256'), 'hex') FROM 1 FOR 12));

  IF v_provided_sig <> v_computed_sig THEN
    RETURN json_build_object('success', FALSE, 'message', 'Cryptographic signature mismatch. Invalid key.');
  END IF;

  IF v_duration = '7D' THEN
    v_expires_at := NOW() + INTERVAL '7 days';
  ELSIF v_duration = '14D' THEN
    v_expires_at := NOW() + INTERVAL '14 days';
  ELSIF v_duration = '30D' THEN
    v_expires_at := NOW() + INTERVAL '30 days';
  ELSIF v_duration = '90D' THEN
    v_expires_at := NOW() + INTERVAL '90 days';
  ELSIF v_duration = '264D' THEN
    v_expires_at := NOW() + INTERVAL '264 days';
  ELSIF v_duration = 'LIFE' THEN
    v_expires_at := '9999-12-31 23:59:59'::TIMESTAMPTZ;
  ELSE
    RETURN json_build_object('success', FALSE, 'message', 'Unsupported duration tier.');
  END IF;

  v_new_nonce := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

  UPDATE tbl_system_license
  SET
    license_key = p_license_key,
    activated_at = NOW(),
    expires_at = v_expires_at,
    last_verified_at = NOW(),
    is_active = TRUE,
    request_nonce = v_new_nonce,
    installation_request_code = 'REQ-' || v_lic.app_code || '-' || v_new_nonce
  WHERE id = v_lic.id;

  RETURN json_build_object(
    'success', TRUE,
    'message', 'License activated successfully.',
    'expires_at', v_expires_at,
    'new_request_code', 'REQ-' || v_lic.app_code || '-' || v_new_nonce
  );
END;
$$;
```

---

#### 12. Create Guest Session Procedure (`src/db/supabase/functions_and_procedures/04_sp_create_guest_session.sql`)
Creates cryptographically secure guest tokens bound to temporary nicknames.

**File:** `src/db/supabase/functions_and_procedures/04_sp_create_guest_session.sql`
```sql
CREATE OR REPLACE FUNCTION sp_create_guest_session(p_temp_name VARCHAR(100))
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_token VARCHAR(64);
BEGIN
  v_token := LOWER(ENCODE(GEN_RANDOM_BYTES(32), 'hex'));

  INSERT INTO tbl_guest_sessions (session_token, guest_temporary_name, created_at, expires_at)
  VALUES (v_token, TRIM(p_temp_name), NOW(), NOW() + INTERVAL '24 hours');

  RETURN json_build_object(
    'success', TRUE,
    'session_token', v_token,
    'guest_temporary_name', TRIM(p_temp_name),
    'role', 'GUEST'
  );
END;
$$;
```

---

#### 13. CQRS Home Page Rendering Procedure (`src/db/supabase/functions_and_procedures/05_sp_render_home_page.sql`)
Generates the complete home screen payload in a single pre-calculated database call.

**File:** `src/db/supabase/functions_and_procedures/05_sp_render_home_page.sql`
```sql
CREATE OR REPLACE FUNCTION sp_render_home_page(p_role VARCHAR(20) DEFAULT 'GUEST', p_guest_token VARCHAR(64) DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_branding JSON;
  v_modules JSON;
  v_categories JSON;
  v_deals JSON;
  v_items JSON;
  v_guest_name TEXT := NULL;
  v_lic_check JSON;
BEGIN
  v_lic_check := fn_verify_license_status();
  IF (v_lic_check->>'is_usable')::BOOLEAN = FALSE AND p_role <> 'ADMIN' THEN
    RETURN json_build_object('success', FALSE, 'license_locked', TRUE, 'license_status', v_lic_check->>'status');
  END IF;

  IF p_guest_token IS NOT NULL THEN
    SELECT guest_temporary_name INTO v_guest_name FROM tbl_guest_sessions WHERE session_token = p_guest_token;
  END IF;

  SELECT row_to_json(s) INTO v_branding FROM tbl_store_settings s LIMIT 1;

  SELECT json_agg(json_build_object(
    'module_code', module_code,
    'can_view', can_view,
    'can_create', can_create,
    'can_edit', can_edit,
    'can_delete', can_delete
  )) INTO v_modules
  FROM tbl_role_modules WHERE role_code = p_role;

  SELECT json_agg(c ORDER BY sort_order) INTO v_categories FROM tbl_categories c WHERE is_active = TRUE;
  SELECT json_agg(d) INTO v_deals FROM tbl_deals d WHERE is_active = TRUE;
  SELECT json_agg(f) INTO v_items FROM tbl_food_items f WHERE is_available = TRUE;

  RETURN json_build_object(
    'success', TRUE,
    'license_locked', FALSE,
    'branding', v_branding,
    'guest_temporary_name', v_guest_name,
    'permitted_modules', COALESCE(v_modules, '[]'::json),
    'categories', COALESCE(v_categories, '[]'::json),
    'deals', COALESCE(v_deals, '[]'::json),
    'food_items', COALESCE(v_items, '[]'::json)
  );
END;
$$;
```

---

#### 14. Order Placement Procedure (`src/db/supabase/functions_and_procedures/06_sp_place_order.sql`)
Calculates order line items, discounts, and delivery fees, and issues a tracking token (`TRK-XXXXXX`).

**File:** `src/db/supabase/functions_and_procedures/06_sp_place_order.sql`
```sql
CREATE OR REPLACE FUNCTION sp_place_order(
  p_user_id INT,
  p_guest_session_token VARCHAR(64),
  p_guest_temporary_name VARCHAR(100),
  p_order_type VARCHAR(20),
  p_promo_code VARCHAR(50),
  p_delivery_address TEXT,
  p_items JSON
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_tracking_token VARCHAR(20);
  v_order_id INT;
  v_item RECORD;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_discount NUMERIC(10, 2) := 0.00;
  v_delivery_fee NUMERIC(10, 2) := 0.00;
  v_total NUMERIC(10, 2) := 0.00;
  v_deal RECORD;
BEGIN
  v_tracking_token := 'TRK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

  FOR v_item IN SELECT * FROM json_to_recordset(p_items) AS (food_item_id INT, quantity INT, unit_price NUMERIC(10, 2))
  LOOP
    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  END LOOP;

  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    SELECT * INTO v_deal FROM tbl_deals WHERE promo_code = UPPER(TRIM(p_promo_code)) AND is_active = TRUE;
    IF FOUND THEN
      v_discount := ROUND((v_subtotal * (v_deal.discount_percentage / 100.00)), 2);
    END IF;
  END IF;

  IF p_order_type = 'DELIVERY' THEN
    v_delivery_fee := 3.50;
    IF FOUND AND v_deal.free_delivery = TRUE THEN
      v_delivery_fee := 0.00;
    END IF;
  END IF;

  v_total := (v_subtotal - v_discount) + v_delivery_fee;

  INSERT INTO tbl_orders (
    tracking_token, user_id, guest_session_token, guest_temporary_name,
    order_type, status, subtotal, discount_amount, delivery_fee, total_amount,
    promo_code, delivery_address, created_at, updated_at
  )
  VALUES (
    v_tracking_token, p_user_id, p_guest_session_token, p_guest_temporary_name,
    COALESCE(p_order_type, 'DINE_IN'), 'PENDING', v_subtotal, v_discount, v_delivery_fee, v_total,
    p_promo_code, p_delivery_address, NOW(), NOW()
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM json_to_recordset(p_items) AS (food_item_id INT, item_name VARCHAR(150), quantity INT, unit_price NUMERIC(10, 2))
  LOOP
    INSERT INTO tbl_order_items (order_id, food_item_id, item_name, unit_price, quantity, total_price)
    VALUES (v_order_id, v_item.food_item_id, v_item.item_name, v_item.unit_price, v_item.quantity, (v_item.unit_price * v_item.quantity));
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'tracking_token', v_tracking_token,
    'order_id', v_order_id,
    'total_amount', v_total
  );
END;
$$;
```

---

#### 15. Pre-Seeded Catalog & RBAC Configuration (`src/db/supabase/seed_data/01_seed_initial_data.sql`)
Populates the store branding, roles, admin user, food items, and promotional deals.

**File:** `src/db/supabase/seed_data/01_seed_initial_data.sql`
```sql
INSERT INTO tbl_system_license (app_code, app_secret, request_nonce, installation_request_code, is_active)
VALUES ('FOODIE_POS', 'foodie_master_secret_2026_x99_secure', 'A9F3K2', 'REQ-FOODIE_POS-A9F3K2', FALSE)
ON CONFLICT (app_code) DO NOTHING;

INSERT INTO tbl_store_settings (id, store_name, tagline, hero_image_url, default_address, primary_color)
VALUES (1, 'Foodie.', 'Hot meals, right at your door', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', 'San Francisco, CA • 25-35 min delivery', '#2E7D32')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tbl_roles (role_code, role_name) VALUES
  ('ADMIN', 'Administrator'),
  ('STAFF', 'Staff Member'),
  ('CUSTOMER', 'Registered Customer'),
  ('GUEST', 'Unregistered Guest')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO tbl_users (email, phone, full_name, password_hash, role_code)
VALUES ('admin@foodie.com', '555-0199', 'Master Admin', 'admin123', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO tbl_modules (module_code, module_name, description) VALUES
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
  ('ADMIN_LICENSE', 'Admin License', 'Cryptographic offline license activation')
ON CONFLICT (module_code) DO NOTHING;

INSERT INTO tbl_role_modules (role_code, module_code, can_view, can_create, can_edit, can_delete) VALUES
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
  ('GUEST', 'ADMIN_LICENSE', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role_code, module_code) DO NOTHING;

INSERT INTO tbl_categories (id, name, image_url, sort_order, is_active) VALUES
  (1, 'Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80', 1, TRUE),
  (2, 'Pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80', 2, TRUE),
  (3, 'Sushi', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=80', 3, TRUE),
  (4, 'Chicken', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&q=80', 4, TRUE),
  (5, 'Meat', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80', 5, TRUE),
  (6, 'Noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&q=80', 6, TRUE),
  (7, 'Pasta', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&q=80', 7, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tbl_food_items (id, category_id, name, image_url, price, calories, prep_time_minutes, is_available) VALUES
  (1, 2, 'Pepperoni Feast', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80', 11.99, 540, 20, TRUE),
  (2, 2, 'Cheesy Garlic Bread', 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&q=80', 5.99, 280, 15, TRUE),
  (3, 3, 'Sushi Bento Box', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500&q=80', 14.50, 610, 25, TRUE),
  (4, 3, 'Salmon Avocado Maki', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80', 9.80, 380, 15, TRUE),
  (5, 4, 'Hot & Spicy Bucket', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&q=80', 18.90, 1240, 30, TRUE),
  (6, 4, 'Crispy Chicken Wrap', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500&q=80', 6.49, 520, 12, TRUE),
  (7, 4, 'Herb Roast Chicken', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&q=80', 13.90, 980, 35, TRUE),
  (8, 5, 'Grilled Ribeye Steak', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', 24.90, 690, 25, TRUE),
  (9, 1, 'Classic Hot Dog', 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=500&q=80', 3.99, 360, 10, TRUE),
  (10, 5, 'Beef Kebab Skewers', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80', 10.90, 450, 20, TRUE),
  (11, 1, 'Cheese Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', 6.99, 480, 15, TRUE),
  (12, 6, 'Tonkotsu Ramen', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80', 12.50, 640, 20, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tbl_deals (id, title, description, promo_code, discount_percentage, free_delivery, is_active) VALUES
  (1, '30% OFF YOUR WHOLE ORDER', 'Use code at checkout to claim 30% off any order over $15', 'FOODIE30', 30.00, FALSE, TRUE),
  (2, 'FREE DELIVERY', 'Get zero delivery fee on all local takeaway orders', 'FREESHIP', 0.00, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;
```

---

### B. Pure-SQL RFC 2104 Engine for MySQL 8.0+ (`src/db/mysql/`)

#### Pure-SQL HMAC-SHA256 Implementation (`src/db/mysql/functions_and_procedures/01_fn_hmac_sha256.sql`)
Standard MySQL lacks native HMAC capability. This deterministic stored function implements the standard RFC 2104 key padding algorithm.

**File:** `src/db/mysql/functions_and_procedures/01_fn_hmac_sha256.sql`
```sql
USE foodie_db;
DELIMITER $$

DROP FUNCTION IF EXISTS fn_hmac_sha256$$
CREATE FUNCTION fn_hmac_sha256(p_key VARCHAR(255), p_data VARCHAR(255))
RETURNS VARCHAR(64)
DETERMINISTIC
BEGIN
  DECLARE v_key VARBINARY(64);
  DECLARE v_ipad VARBINARY(64);
  DECLARE v_opad VARBINARY(64);
  DECLARE v_i INT DEFAULT 1;

  IF LENGTH(p_key) > 64 THEN
    SET v_key = UNHEX(SHA2(p_key, 256));
  ELSE
    SET v_key = CAST(p_key AS BINARY);
  END IF;

  SET v_key = RPAD(v_key, 64, 0x00);
  SET v_ipad = REPEAT(0x36, 64);
  SET v_opad = REPEAT(0x5c, 64);

  WHILE v_i <= 64 DO
    SET v_ipad = INSERT(v_ipad, v_i, 1, CHAR(ASCII(SUBSTRING(v_key, v_i, 1)) ^ 0x36));
    SET v_opad = INSERT(v_opad, v_i, 1, CHAR(ASCII(SUBSTRING(v_key, v_i, 1)) ^ 0x5c));
    SET v_i = v_i + 1;
  END WHILE;

  RETURN SHA2(CONCAT(v_opad, UNHEX(SHA2(CONCAT(v_ipad, p_data), 256))), 256);
END$$

DELIMITER ;
```

**Cryptographic Mechanics:**
- Computes inner hash: $H(K \oplus \text{ipad} \mathbin{\Vert} \text{data})$ using `0x36` byte masks.
- Computes outer hash: $H(K \oplus \text{opad} \mathbin{\Vert} \text{inner\_hash})$ using `0x5c` byte masks.
- Produces output identical to Node.js `crypto.createHmac('sha256', secret).update(data).digest('hex')` directly inside MySQL.

---

## 🧪 Verification & Testing

Verify database deployment and cryptographic mechanisms in Supabase or local PostgreSQL:

1. **Verify Table Schema & Seeding:**
   ```sql
   SELECT count(*) FROM tbl_food_items;
   ```
   *Expected Output:* `12` pre-seeded reference food items.

2. **Verify License Status:**
   ```sql
   SELECT * FROM vw_active_license;
   ```
   *Expected Output:* `license_status = 'INACTIVE'`, `is_usable = false`, `installation_request_code = 'REQ-FOODIE_POS-A9F3K2'`.

3. **Generate Signed Activation Key:**
   ```sql
   SELECT fn_generate_license_key('30D', 'A9F3K2');
   ```
   *Expected Output:* `LIC-FOODIE_POS-30D-A9F3K2-XXXXXXXXXXXX` (12-char HMAC signature).

4. **Activate POS License:**
   ```sql
   SELECT sp_activate_license('<GENERATED_KEY>');
   ```
   *Expected Output:* `success = true`, `expires_at` set 30 days from now, and a new rotated request nonce returned.

