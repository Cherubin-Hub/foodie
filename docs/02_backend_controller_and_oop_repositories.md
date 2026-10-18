# Step 02: OOP Repository Layer & Thin Express API Controller

## 🎯 Objective
Construct the backend service layer and controller bridge for the **Foodie Single-Store Configurable Food Ordering Web Application**. Following the Database-Centric MVC + Ports & Adapters architecture outlined in [`AGENTS.md`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/AGENTS.md), business logic, RBAC matrix filtering, offline cryptographic HMAC validations, and home page payload bundling are executed in the database layer. 

This phase establishes:
1. **Repository Interface Contract ([`src/db/db_types.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/db_types.ts)):** Defines the strict `IDatabaseRepository` interface and TypeScript domain models.
2. **Supabase PostgreSQL Repository ([`src/db/supabase/supabase_repository.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/supabase/supabase_repository.ts)):** Implements `IDatabaseRepository` via Supabase RPC procedures (`.rpc()`) and relational queries.
3. **MySQL 8.0 Repository ([`src/db/mysql/mysql_repository.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/mysql/mysql_repository.ts)):** Implements `IDatabaseRepository` via `mysql2/promise` connection pooling, prepared statements, and transactional procedures.
4. **Polymorphic Database Factory ([`src/db/db_index.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/db/db_index.ts)):** Reads `process.env.DB_PROVIDER` to supply the active repository implementation singleton.
5. **Thin Express Controller Bridge ([`src/server/api_server.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/server/api_server.ts)):** Mounts clean REST routes on port 4000 without data-manipulation bloat.

---

## 🛠 Step-by-Step Implementation

### 1. Database Contract & Shared Types (`src/db/db_types.ts`)
Defines the boundary between the storage layer and the API server.

**File:** `src/db/db_types.ts`
```typescript
export interface LicenseStatusResponse {
  success: boolean;
  status: 'VALID' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'INACTIVE' | 'NO_RECORD';
  is_usable: boolean;
  app_code?: string;
  installation_request_code?: string;
  expires_at?: string;
  message?: string;
}

export interface LicenseActivationResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  new_request_code?: string;
}

export interface GuestSessionResponse {
  success: boolean;
  session_token: string;
  guest_temporary_name: string;
  role: 'GUEST';
}

export interface StoreBranding {
  id?: number;
  store_name: string;
  tagline: string;
  hero_image_url: string;
  default_address: string;
  primary_color: string;
}

export interface ModulePermission {
  id?: number;
  role_code: string;
  role_name?: string;
  module_code: string;
  module_name?: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Category {
  id: number;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface FoodItem {
  id: number;
  category_id: number;
  name: string;
  image_url: string;
  price: number;
  calories: number;
  prep_time_minutes: number;
  is_available: boolean;
}

export interface Deal {
  id: number;
  title: string;
  description: string;
  promo_code: string;
  discount_percentage: number;
  free_delivery: boolean;
  is_active: boolean;
}

export interface RenderedHomePayload {
  success: boolean;
  license_locked: boolean;
  license_status?: string;
  branding?: StoreBranding;
  guest_temporary_name?: string | null;
  permitted_modules?: ModulePermission[];
  categories?: Category[];
  deals?: Deal[];
  food_items?: FoodItem[];
}

export interface OrderItemInput {
  food_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
}

export interface PlaceOrderInput {
  user_id?: number | null;
  guest_session_token?: string | null;
  guest_temporary_name?: string | null;
  order_type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  promo_code?: string | null;
  delivery_address?: string | null;
  items: OrderItemInput[];
}

export interface PlaceOrderResponse {
  success: boolean;
  tracking_token?: string;
  order_id?: number;
  total_amount?: number;
  message?: string;
}

export interface OrderRecord {
  id: number;
  tracking_token: string;
  user_id?: number | null;
  guest_session_token?: string | null;
  guest_temporary_name?: string | null;
  order_type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  promo_code?: string | null;
  delivery_address?: string | null;
  created_at: string;
  items?: {
    id: number;
    food_item_id: number;
    item_name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
  }[];
}

export interface IDatabaseRepository {
  getLicenseStatus(): Promise<LicenseStatusResponse>;
  activateLicense(licenseKey: string): Promise<LicenseActivationResponse>;
  createGuestSession(tempName: string): Promise<GuestSessionResponse>;
  renderHomePage(role: string, guestToken?: string): Promise<RenderedHomePayload>;
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse>;
  getOrderByToken(token: string): Promise<OrderRecord | null>;
  getAllOrders(): Promise<OrderRecord[]>;
  updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }>;
  getRoleModuleMatrix(): Promise<ModulePermission[]>;
  toggleRoleModulePermission(
    roleCode: string,
    moduleCode: string,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ): Promise<{ success: boolean }>;
  updateStoreBranding(branding: Partial<StoreBranding>): Promise<{ success: boolean }>;
  createOrUpdateFoodItem(item: Partial<FoodItem>): Promise<{ success: boolean; id?: number }>;
}
```

---

### 2. Supabase Client & Repository Adapter (`src/db/supabase/`)
Encapsulates Supabase communication.

**File:** `src/db/supabase/supabase_client.ts`
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseInstance;
}
```

---

### 3. Database Factory (`src/db/db_index.ts`)
Decouples the Express controller from database implementations.

**File:** `src/db/db_index.ts`
```typescript
import { IDatabaseRepository } from './db_types.js';
import { SupabaseRepository } from './supabase/supabase_repository.js';
import { MySqlRepository } from './mysql/mysql_repository.js';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseFactory {
  private static instance: IDatabaseRepository | null = null;

  public static getRepository(): IDatabaseRepository {
    if (!this.instance) {
      const provider = (process.env.DB_PROVIDER || 'supabase').toLowerCase().trim();

      if (provider === 'mysql') {
        console.log('[DatabaseFactory] Initializing MySQL Database Repository Adapter...');
        this.instance = new MySqlRepository();
      } else {
        console.log('[DatabaseFactory] Initializing Supabase PostgreSQL Database Repository Adapter...');
        this.instance = new SupabaseRepository();
      }
    }

    return this.instance;
  }
}
```

---

### 4. Express API Controller Server (`src/server/api_server.ts`)
Mounts REST endpoints and delegates requests directly to the active repository. Uses strict unused parameter naming conventions (`_req`, `_res`) to conform to `noUnusedParameters: true` and normalizes `@types/express` v5 route parameter arrays.

**File:** `src/server/api_server.ts`
```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseFactory } from '../db/db_index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// License Endpoints
app.get('/api/license/status', async (_req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const status = await repo.getLicenseStatus();
  res.json(status);
});

app.post('/api/license/activate', async (req: Request, res: Response) => {
  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ success: false, message: 'License key is required.' });
  }
  const repo = DatabaseFactory.getRepository();
  const result = await repo.activateLicense(licenseKey);
  res.json(result);
});

// Guest Session Endpoint
app.post('/api/auth/guest', async (req: Request, res: Response) => {
  const { temporaryName } = req.body;
  if (!temporaryName || !temporaryName.trim()) {
    return res.status(400).json({ success: false, message: 'Temporary name is required.' });
  }
  const repo = DatabaseFactory.getRepository();
  const session = await repo.createGuestSession(temporaryName);
  res.json(session);
});

// Home Page Payload Endpoint (CQRS Bundled)
app.get('/api/home', async (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'GUEST';
  const guestToken = (req.query.guestToken as string) || undefined;
  const repo = DatabaseFactory.getRepository();
  const payload = await repo.renderHomePage(role, guestToken);
  res.json(payload);
});

// Order Endpoints
app.post('/api/orders', async (req: Request, res: Response) => {
  const { userId, guestSessionToken, guestTemporaryName, orderType, promoCode, deliveryAddress, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }
  const repo = DatabaseFactory.getRepository();
  const result = await repo.placeOrder({
    user_id: userId,
    guest_session_token: guestSessionToken,
    guest_temporary_name: guestTemporaryName,
    order_type: orderType || 'DINE_IN',
    promo_code: promoCode,
    delivery_address: deliveryAddress,
    items
  });
  res.json(result);
});

app.get('/api/orders/track/:token', async (req: Request, res: Response) => {
  const token = (Array.isArray(req.params.token) ? req.params.token[0] : req.params.token) as string;
  const repo = DatabaseFactory.getRepository();
  const order = await repo.getOrderByToken(token);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order tracking token not found.' });
  }
  res.json({ success: true, order });
});

app.get('/api/admin/orders', async (_req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const orders = await repo.getAllOrders();
  res.json({ success: true, orders });
});

app.put('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const repo = DatabaseFactory.getRepository();
  const result = await repo.updateOrderStatus(orderId, status);
  res.json(result);
});

// Admin RBAC & Store Settings Endpoints
app.get('/api/admin/rbac', async (_req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const matrix = await repo.getRoleModuleMatrix();
  res.json({ success: true, matrix });
});

app.post('/api/admin/rbac/toggle', async (req: Request, res: Response) => {
  const { roleCode, moduleCode, field, value } = req.body;
  const repo = DatabaseFactory.getRepository();
  const result = await repo.toggleRoleModulePermission(roleCode, moduleCode, field, value);
  res.json(result);
});

app.put('/api/admin/branding', async (req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const result = await repo.updateStoreBranding(req.body);
  res.json(result);
});

app.post('/api/admin/catalog/item', async (req: Request, res: Response) => {
  const repo = DatabaseFactory.getRepository();
  const result = await repo.createOrUpdateFoodItem(req.body);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`[API] Express Server listening on port ${PORT} (Provider: ${process.env.DB_PROVIDER || 'supabase'})`);
});
```

---

## 🧪 Verification & Testing

1. **Verify Backend TypeScript Compilation:**
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result:* Zero compiler errors across `src/db/` and `src/server/`.

2. **Test Backend Execution:**
   ```powershell
   npx tsx src/server/api_server.ts
   ```
   *Expected Output:*
   ```text
   [API] Express Server listening on port 4000 (Provider: supabase)
   ```

3. **Verify License Status Endpoint:**
   In another terminal or browser:
   ```powershell
   Invoke-RestMethod -Uri http://localhost:4000/api/license/status -Method GET
   ```
   *Expected Output:*
   ```json
   {
     "success": true,
     "status": "INACTIVE",
     "is_usable": false,
     "installation_request_code": "REQ-FOODIE_POS-A9F3K2"
   }
   ```
