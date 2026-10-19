# Fix: Light/Dark Mode Contrast, Text Visibility & Food Imagery

## 1. Feature / Fix Summary
- **Issue 1 (Permanent Dark Mode & Ambiguous Toggle):** The previous theme toggle was an ambiguous 19px floating sun/moon icon with no text label or binary confirmation. During rehydration from localStorage, `<html class="dark">` synchronization could lag or confuse users about whether the sun represented current state or target state. We implemented a dedicated segmented toggle pill `[ ☀️ Light | 🌙 Dark ]` with explicit `setTheme('light')` and `setTheme('dark')` triggers, pre-hydration script in `index.html`, and `onRehydrateStorage` sync in `app_store.ts`.
- **Issue 2 (Invisible Text & Unbalanced Contrast):** In `home_menu_page.tsx`, section titles ("Categories", "Popular Delicacies", item counts) used hardcoded `text-gray-900` without `dark:text-white`, rendering pitch-black typography on `#030712` dark backgrounds. Concurrently, cards, search inputs, and category pills were solid white (`bg-white`), creating extreme glare against the dark canvas. We introduced balanced dark surfaces (`dark:bg-gray-900`, `dark:border-gray-800`, `dark:text-white`, `dark:text-gray-400`) across all customer, admin, cart, and authentication pages.
- **Issue 3 (Creepy / Mismatched Food Photo):** Item 2 in seed data ("Cheesy Garlic Bread") inadvertently referenced an Unsplash portrait of a human face (`photo-1573140247632-f8fd74997d5c`). This was replaced in seed SQL scripts (`01_seed_initial_data.sql` for PostgreSQL and MySQL) with an appetizing, high-resolution cheesy garlic bread photo (`photo-1619895092538-128341789043`). Furthermore, an automatic frontend image sanitizer `sanitizeFoodImage` was added to `home_menu_page.tsx`, `saved_items_page.tsx`, and `cart_checkout_page.tsx` so existing databases immediately display real food without requiring database resets.

---

## 2. Touched Files List
- `index.html`: Added pre-hydration theme synchronization script in `<head>` and dark mode utility classes on `<body>`.
- `src/app/app_store.ts`: Added `onRehydrateStorage` callback to ensure immediate synchronization with DOM classes upon Zustand hydration; hardened binary `setTheme`.
- `src/app/header_page.tsx`: Replaced ambiguous floating icon with an accessible segmented control `[ ☀️ Light | 🌙 Dark ]` with active highlight styling.
- `src/app/home_menu_page.tsx`: Fixed invisible text, soft dark surfaces for search bar and delicacy cards, and added `sanitizeFoodImage` for Cheesy Garlic Bread.
- `src/app/saved_items_page.tsx`: Added dark mode contrast, dark surface cards, and garlic bread photo sanitizer.
- `src/app/offers_page.tsx`: Applied dark mode classes to coupon cards, promo tags, and copy buttons.
- `src/app/cart_checkout_page.tsx`: Applied dark surfaces, clear borders, order preference buttons, and sanitized item thumbnail previews.
- `src/app/order_tracker_page.tsx`: Added dark mode support to stepper, receipt cards, and action buttons.
- `src/app/login_page.tsx`: Added dark mode card, inputs, modal, and text contrast.
- `src/app/profile_page.tsx`: Added dark surfaces to avatar badge, profile card, and button styles.
- `src/app/admin_dashboard_page.tsx`: Added dark surfaces to kitchen order tickets, top sub-nav links, and status pills.
- `src/app/admin_catalog_page.tsx`: Added dark styling to catalog form inputs, item list, and action buttons.
- `src/app/admin_branding_page.tsx`: Added dark inputs, borders, and color picker container styling.
- `src/app/admin_rbac_page.tsx`: Added dark table headers, borders, and rows for permission checkboxes.
- `src/db/supabase/seed_data/01_seed_initial_data.sql`: Replaced item 2 image URL with genuine garlic bread photo.
- `src/db/mysql/seed_data/01_seed_initial_data.sql`: Replaced item 2 image URL with genuine garlic bread photo.

---

## 3. Architecture & Code Walkthrough

### 3.1 Pre-Hydration & Segmented Theme Architecture
```html
<!-- index.html -->
<script>
  (function() {
    try {
      var stored = localStorage.getItem('foodie_app_storage');
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.state && parsed.state.theme === 'dark') {
          document.documentElement.classList.add('dark');
          return;
        }
      }
      document.documentElement.classList.remove('dark');
    } catch (e) {}
  })();
</script>
```
This guarantees `<html class="dark">` is present before the first pixel renders, eliminating visual flicker.

```tsx
// src/app/header_page.tsx
<div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-200 dark:border-gray-700">
  <button
    type="button"
    onClick={() => setTheme('light')}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
      theme === 'light'
        ? 'bg-white text-amber-600 shadow-sm'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
    }`}
  >
    <Sun size={14} className={theme === 'light' ? 'text-amber-500' : ''} />
    <span className="hidden sm:inline">Light</span>
  </button>
  <button
    type="button"
    onClick={() => setTheme('dark')}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
      theme === 'dark'
        ? 'bg-gray-900 text-indigo-300 shadow-sm border border-gray-700'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
    }`}
  >
    <Moon size={14} className={theme === 'dark' ? 'text-indigo-400' : ''} />
    <span className="hidden sm:inline">Dark</span>
  </button>
</div>
```

### 3.2 Automated Image Sanitization
```tsx
const sanitizeFoodImage = (url: string, name: string): string => {
  if (
    !url ||
    url.includes('1573140247632') ||
    (name.toLowerCase().includes('garlic bread') && (url.includes('1573140247632') || !url.includes('unsplash')))
  ) {
    return 'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&q=80';
  }
  return url;
};
```

---

## 4. Data Flow (SQL Model -> Express Controller -> React View)
1. **Model:** Database returns food item payload via stored procedure `sp_render_home_page` / SQL view `vw_rendered_home_menu`.
2. **Controller:** Express endpoint `GET /api/home` serializes items, deals, and categories as JSON.
3. **React View:** `HomeMenuPage` executes `sanitizeFoodImage` on every item, dynamically rendering the verified cheesy garlic bread photo and applying soft dark themes with Tailwind's `dark:` classes (`dark:bg-gray-900 dark:border-gray-800 dark:text-white`).

---

## 5. How to Test & Verify
1. **Single-Terminal Startup:** Run `npm run dev` in your terminal.
2. **Toggle Theme Test:**
   - In the top header bar, click **Light**. Observe immediate transition to light theme: white header, soft gray-50 background, dark typography.
   - Click **Dark**. Observe transition to dark theme: dark header (`dark:bg-gray-900`), deep canvas background (`dark:bg-gray-950`), and crisp white titles.
   - Refresh the browser (`F5`). Verify the selected mode persists without flicker.
3. **Typography & Contrast Verification:**
   - Observe "Categories", "Popular Delicacies", and item count labels in both Light and Dark modes. Verify full legibility.
   - Verify food delicacy cards transition from soft white (`bg-white`) in light mode to sleek dark slate (`dark:bg-gray-900 dark:border-gray-800`) in dark mode without stark glare.
4. **Food Image Verification:**
   - Locate "Cheesy Garlic Bread" (ID 2). Verify that it displays golden, delicious oven-baked cheesy garlic bread rather than the woman portrait.
5. **Automated Verification:**
   - Run `npm test` to verify all 7 HMAC, license, and promo calculation tests pass.
   - Run `npm run build` to verify clean TypeScript compilation and Vite bundling with zero errors.
