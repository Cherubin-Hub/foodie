# Step 03: Flat Functional React UI Pages, Zustand State Store & RBAC Router

## 🎯 Objective
Construct the complete user-facing and administrative interface for the **Foodie Single-Store Configurable Food Ordering Web Application**. Following [`AGENTS.md`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/AGENTS.md), the frontend adopts a **Flat Folder Architecture** in `src/app/` (zero nested `folder/page.tsx` directories), pure **Functional Programming (FP)** with React hooks and Zustand, and strict type safety.

The UI implements all five core business modules:
1. **Offline Cryptographic License Lock Guard ([`src/app/admin_license_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/admin_license_page.tsx)):** Displays the installation request code (`REQ-FOODIE_POS-<NONCE>`), provides a one-click copy button, validates HMAC license key entry (`LIC-FOODIE_POS-<DURATION>-<NONCE>-<SIG>`), and enforces a store maintenance lock on customer routes when the license is unactivated or expired.
2. **Branded Welcome & Guest Table Login Flow ([`src/app/splash_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/splash_page.tsx), [`src/app/login_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/login_page.tsx)):** Renders the branded hero scooter illustration, handles admin/customer email-password authentication, and features a modal prompting guests for their temporary name (e.g., `"Alex - Table 4"`).
3. **Dynamic RBAC Navigation ([`src/app/header_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/header_page.tsx), [`src/app/bottom_nav_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/bottom_nav_page.tsx)):** Evaluates pre-computed `vw_role_module_matrix` flags to conditionally render navigation items for `ADMIN`, `STAFF`, `CUSTOMER`, and `GUEST`.
4. **CQRS Database-Rendered Home Menu ([`src/app/home_menu_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/home_menu_page.tsx)):** Consumes the pre-bundled `/api/home` payload to render category tabs, promotional deal carousels, calorie/prep-time badges, and direct add-to-cart controls.
5. **Checkout & Live Order Tracking ([`src/app/cart_checkout_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/cart_checkout_page.tsx), [`src/app/order_tracker_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/order_tracker_page.tsx)):** Manages promo discounts (`FOODIE30`, `FREESHIP`), order type options (`DINE_IN`, `TAKEOUT`, `DELIVERY`), a 4-step live order status stepper, and a printable itemized digital receipt.
6. **Admin Suite ([`src/app/admin_dashboard_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/admin_dashboard_page.tsx), [`src/app/admin_catalog_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/admin_catalog_page.tsx), [`src/app/admin_branding_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/admin_branding_page.tsx), [`src/app/admin_rbac_page.tsx`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/app/admin_rbac_page.tsx)):** Provides live kitchen order status toggling, category/item CRUD, white-label branding customization, and a permissions toggle switchboard.

---

## 🛠 Step-by-Step Implementation

### 1. Global CSS Stylesheet (`src/index.css`)
Imports Tailwind CSS directives and custom styling utilities.

**File:** `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 font-sans antialiased;
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

### 2. Client Application Mount (`src/main.tsx`)
Initializes React 18 root mounting with `BrowserRouter`.

**File:** `src/main.tsx`
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/app_router.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </React.StrictMode>
);
```

---

### 3. Zustand Global ViewModel Store (`src/app/app_store.ts`)
Encapsulates global state: user session, cart items, store branding, license status, and RBAC matrix.

**File:** `src/app/app_store.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreBranding, ModulePermission, FoodItem } from '../db/db_types.js';

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
}

interface AppState {
  // License State
  licenseStatus: 'VALID' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'INACTIVE' | 'LOADING';
  isLicenseUsable: boolean;
  requestCode: string;
  setLicenseState: (status: 'VALID' | 'EXPIRED' | 'CLOCK_TAMPERED' | 'INACTIVE' | 'LOADING', isUsable: boolean, reqCode?: string) => void;

  // Store Branding State
  branding: StoreBranding;
  setBranding: (branding: StoreBranding) => void;

  // User & Guest Session State
  currentUser: { email: string; fullName: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' } | null;
  guestSession: { token: string; temporaryName: string } | null;
  setUser: (user: { email: string; fullName: string; role: 'ADMIN' | 'STAFF' | 'CUSTOMER' } | null) => void;
  setGuestSession: (session: { token: string; temporaryName: string } | null) => void;
  logout: () => void;

  // Cart State
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  clearCart: () => void;

  // Saved Favorites State
  savedItemIds: number[];
  toggleSavedItem: (itemId: number) => void;

  // RBAC Matrix
  permittedModules: ModulePermission[];
  setPermittedModules: (modules: ModulePermission[]) => void;
  canViewModule: (moduleCode: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      licenseStatus: 'LOADING',
      isLicenseUsable: false,
      requestCode: '',
      setLicenseState: (licenseStatus, isLicenseUsable, reqCode) =>
        set(state => ({ licenseStatus, isLicenseUsable, requestCode: reqCode || state.requestCode })),

      branding: {
        store_name: 'Foodie.',
        tagline: 'Hot meals, right at your door',
        hero_image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        default_address: 'San Francisco, CA • 25-35 min delivery',
        primary_color: '#2E7D32'
      },
      setBranding: branding => set({ branding }),

      currentUser: null,
      guestSession: null,
      setUser: user => set({ currentUser: user }),
      setGuestSession: session => set({ guestSession: session }),
      logout: () => set({ currentUser: null, guestSession: null, cart: [] }),

      cart: [],
      addToCart: item =>
        set(state => {
          const existing = state.cart.find(c => c.foodItem.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map(c =>
                c.foodItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
              )
            };
          }
          return { cart: [...state.cart, { foodItem: item, quantity: 1 }] };
        }),
      removeFromCart: itemId =>
        set(state => ({ cart: state.cart.filter(c => c.foodItem.id !== itemId) })),
      updateQuantity: (itemId, delta) =>
        set(state => ({
          cart: state.cart
            .map(c => {
              if (c.foodItem.id === itemId) {
                const newQty = c.quantity + delta;
                return newQty > 0 ? { ...c, quantity: newQty } : null;
              }
              return c;
            })
            .filter(Boolean) as CartItem[]
        })),
      clearCart: () => set({ cart: [] }),

      savedItemIds: [],
      toggleSavedItem: itemId =>
        set(state => ({
          savedItemIds: state.savedItemIds.includes(itemId)
            ? state.savedItemIds.filter(id => id !== itemId)
            : [...state.savedItemIds, itemId]
        })),

      permittedModules: [],
      setPermittedModules: modules => set({ permittedModules: modules }),
      canViewModule: moduleCode => {
        const { currentUser, permittedModules } = get();
        if (currentUser?.role === 'ADMIN') return true;
        const mod = permittedModules.find(m => m.module_code === moduleCode);
        return Boolean(mod?.can_view);
      }
    }),
    {
      name: 'foodie_app_storage',
      partialize: state => ({
        currentUser: state.currentUser,
        guestSession: state.guestSession,
        cart: state.cart,
        savedItemIds: state.savedItemIds
      })
    }
  )
);
```

---

## 🧪 Verification & Testing

1. **Verify Full TypeScript Compilation:**
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result:* Zero diagnostic errors across the entire codebase.

2. **Verify Single-Terminal Concurrent Execution:**
   ```powershell
   npm run dev
   ```
   *Expected Output in 1 Terminal:*
   ```text
   [API] [API] Express Server listening on port 4000 (Provider: supabase)
   [WEB]   VITE v6.1.0  ready in 240 ms
   [WEB]   ➜  Local:   http://localhost:5173/
   ```

3. **Verify License Guard Flow:**
   - Open `http://localhost:5173/`.
   - If license is inactive, verify customer views show the maintenance screen with a direct link to Admin License Activation (`/admin/license`).
   - Copy the displayed installation request code (`REQ-FOODIE_POS-A9F3K2`).
   - Paste a valid signed license key (generated via `SELECT fn_generate_license_key('30D', 'A9F3K2');`).
   - Verify instantaneous unlock and automatic nonce rotation.

4. **Verify Guest Ordering Flow:**
   - On the login screen (`/login`), click **"Continue as Guest"**.
   - Enter temporary name `"Alex - Table 4"`.
   - Add items to cart and proceed to checkout (`/cart`).
   - Verify guest temporary name displays on the checkout screen and passes into `tbl_orders`.
   - Complete checkout and verify immediate redirection to the live 4-step order tracker (`/order/track/:token`).

