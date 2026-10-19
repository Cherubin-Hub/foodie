# Step 04: End-to-End System Verification, Single-Terminal Execution & Testing Walkthrough

## 🎯 Objective
Provide the complete developer verification manual and operational guide for the **Foodie Single-Store Configurable Food Ordering Web Application**. With Phase 0 (Bootstrap), Phase 1 (Dual Database Schemas), Phase 2 (OOP Repositories & API Controller), and Phase 3 (Flat Functional React UI) fully built and compiled (`tsc && vite build` passing with exit code 0), this guide details the exact steps to configure credentials, execute the single-terminal runner, and verify all five core functional modules end-to-end.

---

## 🛠 Prerequisites & Initial Configuration

### 1. Configure Local Environment (`.env`)
Copy the sample environment file to `.env`:
```powershell
Copy-Item .env.example .env
```
Open [`.env`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/.env) and supply your Supabase or MySQL credentials:
```bash
# Server Port Configuration
PORT=4000

# Database Provider ('supabase' | 'mysql')
DB_PROVIDER=supabase

# Supabase Connection Parameters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cryptographic License Constants
APP_CODE=FOODIE_POS
APP_SECRET=foodie_master_secret_2026_x99_secure
```

---

### 2. Run Database Migrations in Supabase
In your Supabase Dashboard SQL Editor, run the modular scripts in this exact sequence:

1. **Tables:**
   - `src/db/supabase/tables/01_tbl_system_license.sql`
   - `src/db/supabase/tables/02_tbl_store_settings.sql`
   - `src/db/supabase/tables/03_tbl_roles_and_users.sql`
   - `src/db/supabase/tables/04_tbl_modules_and_role_modules.sql`
   - `src/db/supabase/tables/05_tbl_catalog_and_deals.sql`
   - `src/db/supabase/tables/06_tbl_orders_and_items.sql`
2. **Views:**
   - `src/db/supabase/views/01_vw_active_license.sql`
   - `src/db/supabase/views/02_vw_role_module_matrix.sql`
3. **Stored Procedures & Functions (RPCs):**
   - `src/db/supabase/functions_and_procedures/01_fn_verify_license_status.sql`
   - `src/db/supabase/functions_and_procedures/02_fn_generate_license_key.sql`
   - `src/db/supabase/functions_and_procedures/03_sp_activate_license.sql`
   - `src/db/supabase/functions_and_procedures/04_sp_create_guest_session.sql`
   - `src/db/supabase/functions_and_procedures/05_sp_render_home_page.sql`
   - `src/db/supabase/functions_and_procedures/06_sp_place_order.sql`
4. **Seed Data:**
   - `src/db/supabase/seed_data/01_seed_initial_data.sql`

---

## 🚀 Single-Terminal Execution

Launch both the Express API and Vite React frontend with **1 single command**:
```powershell
npm run dev
```

**Expected Terminal Output:**
```text
[API] Express Server listening on port 4000 (Provider: supabase)
[WEB]   VITE v6.4.4  ready in 180 ms
[WEB]   ➜  Local:   http://localhost:5173/
[WEB]   ➜  Network: use --host to expose
```

---

## 🧪 Module-by-Module Verification & Testing Walkthrough

### Module 1: 100% Offline Cryptographic License Lock & Activation
1. **Maintenance Screen Lock:**
   - Navigate to `http://localhost:5173/`.
   - Because the initial pre-seeded license is `is_active = FALSE`, you will immediately see the **"Store Offline / Maintenance"** lock screen.
2. **Access Admin License Page:**
   - Click **"Activate Store License (Admin)"** or go to `http://localhost:5173/admin/license`.
   - The page displays: `REQ-FOODIE_POS-A9F3K2`.
   - Click the **"Copy"** button.
3. **Generate a Signed License Key:**
   - In Supabase SQL Editor, run:
     ```sql
     SELECT fn_generate_license_key('30D', 'A9F3K2');
     ```
   - Copy the output: `LIC-FOODIE_POS-30D-A9F3K2-XXXXXXXXXXXX`.
4. **Activate & Rotate Nonce:**
   - Paste the key into the input field on `http://localhost:5173/admin/license` and click **"Activate License"**.
   - Notice the green confirmation banner: *"License activated successfully!"*.
   - The Request Code automatically rotates to a new nonce (e.g. `REQ-FOODIE_POS-K9X2B1`), rendering the old key permanently un-reusable.

---

### Module 2: Configurable Branding & Guest Temporary Name Order Flow
1. **Welcome Screen:**
   - Navigate to `http://localhost:5173/login`.
   - Note the branded logo, tagline, and prominent **"Continue as Guest (Instant Table Order)"** button.
2. **Guest Session Modal:**
   - Click **"Continue as Guest"**.
   - A modal opens asking for a temporary name. Enter:
     ```text
     Alex - Table 4
     ```
   - Click **"Start Ordering"**.
   - You are redirected to the Home Menu with a header badge showing: `Alex - Table 4`.

---

### Module 3: Dynamic RBAC Matrix Switchboard
1. **Login as Administrator:**
   - Go to `/login` and sign in with:
     - **Email:** `admin@foodie.com`
     - **Password:** `admin123`
   - You are routed to the Admin Suite.
2. **Toggle Module Permissions:**
   - Go to `/admin/rbac`.
   - Locate the `GUEST` row. Notice `SAVED_FAVORITES` is disabled by default for unregistered guests.
   - Check `can_view` for `SAVED_FAVORITES` on the `GUEST` row.
   - Open an incognito browser window as a guest. Notice the **"Saved"** tab appears immediately in the bottom navigation.

---

### Module 4: Database-Rendered Home Menu & Catalog Builder
1. **Home Menu Page (`/`):**
   - Verify category pills (`All Items`, `Burger`, `Pizza`, `Sushi`, `Chicken`, `Meat`, `Noodles`, `Pasta`).
   - Click **"Pizza"** $\rightarrow$ verifies instant client-side filtering displaying *Pepperoni Feast* and *Cheesy Garlic Bread*.
   - Note calorie badges (`540 Cal`) and prep times (`20 min`).
2. **Admin Catalog Builder (`/admin/catalog`):**
   - Add a custom meal (e.g., `Truffle Fries`, Price: `7.50`, Calories: `320`, Prep Time: `10`, Category: `Burger`).
   - Click **"Save Food Item"**.
   - Refresh `/` and verify your new item appears instantly in the catalog.

---

### Module 5: Cart Checkout, Live 4-Step Tracker & Shareable Digital Receipt
1. **Add Items to Cart:**
   - Add *Pepperoni Feast* ($11.99) and *Cheesy Garlic Bread* ($5.99).
   - Click the cart icon in the top header.
2. **Checkout Page (`/cart`):**
   - Notice the guest identifier: `Ordering as Guest: Alex - Table 4`.
   - Select dining preference: **"Dine In"**, **"Takeout"**, or **"Delivery"**.
   - In the promo code box, enter `FOODIE30` and click **"Apply"**.
   - Verify 30% discount is calculated: Subtotal `$17.98` $\rightarrow$ Discount `-$5.39` $\rightarrow$ Total `$12.59`.
   - Click **"Confirm & Place Order"**.
3. **Live Order Tracker (`/order/track/:token`):**
   - You are redirected to `/order/track/TRK-XXXXXX`.
   - Observe the live 4-step stepper:
     `Order Placed` $\rightarrow$ `In Kitchen` $\rightarrow$ `Ready / Delivery` $\rightarrow$ `Completed`.
   - The Itemized Digital Receipt displays `Alex - Table 4`, items, promo discount, and total.
   - Click **"Print Receipt"** to verify printable layout.
   - Click **"Share"** to copy the shareable tracking link to clipboard.
4. **Kitchen Order Fulfillment (`/admin/dashboard`):**
   - In your Admin window, navigate to `/admin/dashboard`.
   - Notice the incoming ticket `TRK-XXXXXX` from `Alex - Table 4`.
   - Click **"PREPARING"** $\rightarrow$ switch back to the tracker window $\rightarrow$ within 5 seconds the tracker advances to **"In Kitchen"** automatically.
   - Click **"COMPLETED"** $\rightarrow$ tracker advances to **"Completed"**.
