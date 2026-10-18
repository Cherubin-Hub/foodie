# Step 00: Clean Monorepo Bootstrap & Single-Terminal Toolchain Architecture

## 🎯 Objective
Establish the foundational infrastructure and developer toolchain for the **Foodie Single-Store Configurable Food Ordering Web Application** without relying on black-box CLI generators or bloated scaffolding. The architecture guarantees a seamless, single-terminal developer workflow (`npm run dev`) where both the **Thin Express API Backend (Port 4000)** and the **Vite React Frontend (Port 5173)** execute concurrently with transparent reverse-proxying (`/api` $\rightarrow$ `http://localhost:4000`) to completely eliminate Cross-Origin Resource Sharing (CORS) friction.

Following the strict standards defined in [`AGENTS.md`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/AGENTS.md), this step constructs:
1. **Unified Runtime Manifest ([`package.json`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/package.json)):** Configures concurrent orchestration (`concurrently`), hot-reloading TypeScript node execution (`tsx watch`), production client libraries, and build toolchains.
2. **Strict Compiler Engine ([`tsconfig.json`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/tsconfig.json), [`src/vite-env.d.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/src/vite-env.d.ts)):** Configures modern TypeScript with `Bundler` module resolution, DOM type definitions, strict checking, and ambient environment contracts.
3. **Zero-CORS Client Reverse-Proxy ([`vite.config.ts`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/vite.config.ts)):** Maps all `/api` requests from Vite directly to Express at port 4000.
4. **Design System & Styling Architecture ([`tailwind.config.js`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/tailwind.config.js), [`postcss.config.js`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/postcss.config.js)):** Sets up utility-first Tailwind CSS with custom brand palette `#2E7D32` and Autoprefixer vendor prefixing.
5. **Entry Shell & Configuration Secrets ([`index.html`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/index.html), [`.env.example`](file:///c:/Users/ADMIN/Documents/MyWork/foodie/.env.example)):** Declares root DOM mounting points, modern viewports, and database/license environment templates.

---

## 💻 Terminal Commands & Command Breakdown ("What Each Command Does & Why")

The following commands initialize the project workspace without interactive prompts:

### 1. Initialize Node.js Project Manifest
```powershell
npm init -y
```
- **What it does:** Creates a root `package.json` file populated with default package values (name, version, license, description) without prompting the developer interactively.

### 2. Install Runtime Production Dependencies
```powershell
npm install express cors dotenv @supabase/supabase-js mysql2 react react-dom react-router-dom zustand lucide-react
```
- **Package-by-Package Breakdown:**
  - `express`: Minimalist, high-speed Node.js web framework that acts as the thin API controller layer (`src/server/api_server.ts`).
  - `cors`: Express middleware providing Cross-Origin Resource Sharing headers for direct API consumers.
  - `dotenv`: Automatically loads environment variables from `.env` files into `process.env`.
  - `@supabase/supabase-js`: Official Supabase PostgreSQL client used by `SupabaseRepository` to invoke Stored Procedures (`.rpc()`) and database views.
  - `mysql2`: High-performance MySQL client supporting prepared statements and connection pooling for `MySqlRepository`.
  - `react` & `react-dom`: Declarative UI component library and virtual DOM reconciler powering the client application.
  - `react-router-dom`: Client-side routing engine handling dynamic route matching (`/`, `/login`, `/order/track/:token`, `/admin/*`).
  - `zustand`: Ultra-lightweight, boilerplate-free state management library powering the global ViewModel store (`src/app/app_store.ts`).
  - `lucide-react`: Modern, accessible SVG icon library providing clean visuals for food categories, cart counters, order status steps, and navigation bars.

### 3. Install Developer Tooling & Compilers
```powershell
npm install -D typescript @types/node @types/express @types/cors @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss@^3.4.17 postcss@^8.4.38 autoprefixer@^10.4.19 concurrently tsx
```
- **Tooling Breakdown:**
  - `typescript` & `@types/*`: Provides static typing, type inference, and compile-time error detection across frontend and backend files.
  - `vite` & `@vitejs/plugin-react`: Next-generation frontend bundler providing instant Hot Module Replacement (HMR) and optimized Rollup production builds.
  - `tailwindcss@^3.4.17`, `postcss`, `autoprefixer`: CSS styling engine that scans JSX/TSX files and compiles minimal utility CSS with automatic browser vendor prefixes.
  - `concurrently`: Multi-process runner allowing the developer to run both the API server and Vite frontend in a single terminal session.
  - `tsx`: TypeScript execution engine powered by esbuild, executing `src/server/api_server.ts` directly with live file watching (`watch`).

### 4. Create Granular Folder Architecture
```powershell
New-Item -ItemType Directory -Force -Path `
  "docs", `
  "src\server", `
  "src\app", `
  "src\db\supabase\tables", `
  "src\db\supabase\views", `
  "src\db\supabase\functions_and_procedures", `
  "src\db\supabase\seed_data", `
  "src\db\mysql\tables", `
  "src\db\mysql\views", `
  "src\db\mysql\functions_and_procedures", `
  "src\db\mysql\seed_data"
```
- **What it does:** Creates the modular folder structure separating API servers, React flat app pages, and dual-database SQL scripts (tables, views, procedures, and seed data).

---

## 🛠 Step-by-Step Implementation

### 1. Unified Project Manifest (`package.json`)
Configures project scripts for single-terminal development and lists all production and development dependencies.

**File:** `package.json`
```json
{
  "name": "foodie-ordering-system",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently -n API,WEB -c green,cyan \"tsx watch src/server/api_server.ts\" \"vite\"",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "lucide-react": "^0.475.0",
    "mysql2": "^3.12.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.29.0",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.19",
    "concurrently": "^9.1.2",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vite": "^6.1.0"
  }
}
```

**Key Architectural Features:**
- `"type": "module"`: Enforces native ES Modules (`import`/`export`) across both frontend and backend TypeScript files.
- `"dev"`: Runs `concurrently` with custom labels (`API` in green, `WEB` in cyan). `tsx watch src/server/api_server.ts` automatically restarts the backend when backend files change, while `vite` provides sub-millisecond frontend HMR.

---

### 2. TypeScript Compiler Configuration (`tsconfig.json`)
Configures compiler options tailored for modern bundlers, DOM APIs, and strict static checking.

**File:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Key Compiler Settings Explained:**
- `"moduleResolution": "bundler"`: Modern TypeScript resolution algorithm matching Vite's packaging rules, supporting package exports and sub-path imports.
- `"jsx": "react-jsx"`: Enables React 17+ automatic JSX runtime without needing `import React from 'react'` in every file.
- `"strict": true`: Activates `strictNullChecks`, `noImplicitAny`, and strict bind/call checks to eliminate runtime null pointer crashes.
- `"include": ["src"]`: Scans all files in `src/`. Resolving the `"No inputs were found"` error requires at least one `.ts` file (such as `src/vite-env.d.ts`) inside this directory.

---

### 3. TypeScript Ambient Environment Declaration (`src/vite-env.d.ts`)
Supplies Vite client type definitions for browser asset imports and environment variables.

**File:** `src/vite-env.d.ts`
```typescript
/// <reference types="vite/client" />
```

**Rationale:**
- Informs TypeScript about Vite-specific globals like `import.meta.env` and static asset imports (`.svg`, `.png`, `.css`).
- Satisfies TypeScript's `include` pattern immediately, preventing compiler warning states before application code is introduced.

---

### 4. Vite Bundler & Reverse-Proxy Configuration (`vite.config.ts`)
Connects React plugin support and configures dev-server proxying.

**File:** `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
```

**CORS Elimination Mechanics:**
- When client components call `fetch('/api/home')`, the browser sends an HTTP request to `http://localhost:5173/api/home`.
- Vite intercepts any request prefixed with `/api` and proxies it to `http://localhost:4000/api/home`.
- From the browser's perspective, both the UI and API share the exact same origin (`http://localhost:5173`), preventing CORS preflight failures entirely.

---

### 5. Tailwind CSS Design System Configuration (`tailwind.config.js`)
Declares content scanning paths and establishes the primary brand color system.

**File:** `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2E7D32',
          600: '#1B5E20',
          700: '#144617',
          800: '#0E3010',
          900: '#071808'
        }
      }
    }
  },
  plugins: []
};
```

**Key Rationale:**
- `content`: Explicitly tells Tailwind to scan `index.html` and any `.tsx` or `.ts` file within `src/` to purge unused CSS classes in production builds.
- `brand-500 (#2E7D32)`: Sets the primary brand emerald green required by the specification, with lighter tints for badges and hover states, and darker shades for active states.

---

### 6. PostCSS Compiler Pipeline (`postcss.config.js`)
Configures the CSS processing pipeline for Tailwind and Autoprefixer.

**File:** `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

**Key Rationale:**
- Ensures Tailwind CSS utility classes are processed during the Vite build pipeline.
- Integrates `autoprefixer` to automatically append vendor prefixes (`-webkit-`, `-moz-`) for CSS Grid, Flexbox, and transitions based on target browser versions.

---

### 7. HTML Entry Shell (`index.html`)
The single HTML page hosting the single-page application.

**File:** `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=64&q=80" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Foodie. — Hot meals, right at your door</title>
  </head>
  <body class="bg-gray-50 text-gray-900 antialiased selection:bg-brand-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Key Attributes:**
- `<div id="root"></div>`: The mounting container where React's `createRoot` attaches the component tree.
- `<script type="module" src="/src/main.tsx"></script>`: Native browser ES module entry point triggering React client hydration.

---

### 8. Environment Variable Contract (`.env.example`)
Template defining all required operational keys for both local development and deployment.

**File:** `.env.example`
```bash
# Server Port Configuration
PORT=4000

# Database Provider ('supabase' | 'mysql')
DB_PROVIDER=supabase

# Supabase Connection Parameters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# MySQL Connection Parameters (Ready for switch)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=foodie_db

# Cryptographic License Constants
APP_CODE=FOODIE_POS
APP_SECRET=foodie_master_secret_2026_x99_secure
```

---

## 🧪 Verification & Testing

Verify the setup step-by-step:

1. **Verify Dependency Tree Integrity:**
   Run the following command to ensure all packages resolved cleanly:
   ```powershell
   npm ls --depth=0
   ```
   *Expected Result:* Zero missing peer dependencies.

2. **Verify TypeScript Compilation Status:**
   Run the TypeScript compiler in no-emit validation mode:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result:* Returns exit code `0` with zero diagnostic errors now that `src/vite-env.d.ts` is present.

3. **Verify Configuration Files Presence:**
   Check that all root configuration files exist:
   ```powershell
   Get-ChildItem -Path @("package.json", "tsconfig.json", "vite.config.ts", "tailwind.config.js", "postcss.config.js", "index.html", ".env.example", "src/vite-env.d.ts")
   ```
   *Expected Result:* All 8 files listed with valid byte lengths.