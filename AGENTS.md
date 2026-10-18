# AGENTS.md — Strict Architecture, Single-Terminal Execution, Coding, Documentation & Git Standards

## 1. Clean Folder Initialization & Single-Terminal Execution Rule
- **Clean Folder Bootstrap:** When starting in an empty directory, manually create all foundational configuration files (`package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, and `.env.example`) before creating application source files.
- **Strictly Single-Terminal Execution (`npm run dev`):**
  - The developer MUST be able to run both the Backend Express API and Frontend Vite React UI in **1 single terminal** using a single `npm run dev` command.
  - Configure `package.json` with `concurrently` (e.g., `"dev": "concurrently -n API,WEB -c green,cyan \"tsx watch src/server/api_server.ts\" \"vite\""`) AND configure `vite.config.ts` with a `server.proxy` mapping `/api` to the local Express backend port so the frontend and backend work together seamlessly in one terminal window without CORS issues.

## 2. System Architecture & Design Paradigms
- **Macro Architecture:** **Database-Centric Modular Monolith**. Each project is a self-contained single deployment containing the React UI (`src/app/`), Thin Express Controller (`src/server/`), and Dual-Database Repository Layer (`src/db/`).
- **Application Pattern (Database-Centric MVC + Ports & Adapters + SQL CQRS):**
  - **Model (Database + OOP Repository):** Business logic, RBAC filtering, offline HMAC-SHA256 license checks, and JSON rendering happen inside **SQL Views (Queries/Reads)** and **Stored Procedures/RPCs (Commands/Writes)**, accessed via **OOP Repository Adapters**.
  - **Controller (Thin Express Router):** `src/server/api_server.ts` validates incoming HTTP requests and calls the active Repository class without doing heavy data manipulation in Node.js.
  - **View & ViewModel (Flat Functional React Pages + Zustand):** Co-located flat files in `src/app/*_page.tsx` render the pre-computed database payloads, using `src/app/app_store.ts` as the ViewModel.
- **Programming Paradigms by Layer:**
  1. **OOP (Object-Oriented Programming) in `/src/db/` and `/src/server/`:** Use TypeScript `interface` contracts (`IDatabaseRepository` / `ILicenseRepository`), `class` implementations (`class SupabaseRepository`, `class MySqlRepository`), Encapsulation (private connection clients/pools), and Factory Polymorphism (`DatabaseFactory.getRepository()`).
  2. **FP (Functional Programming) in `/src/app/`:** Use pure React Functional Components, custom hooks, and immutable state updates (Zustand). Never use legacy React Class Components.
  3. **Procedural & Declarative SQL in `*.sql`:** Write explicit SQL Views (`vw_*`) and Stored Procedures/Functions (`sp_*`, `fn_*`) in both PostgreSQL and MySQL.

## 3. Manual Code Craftsmanship Policy (NO Auto-Generated Code)
- **Strictly Manual Code:** Every line of TypeScript, React, Express, CSS, and SQL MUST be written manually with deliberate, clean, human-readable logic.
- **No Code Generators:** Do NOT use ORM code-generators, Prisma/Drizzle CLI scaffolds, or auto-generated API wrappers.
- **No Placeholders or Truncation:** Never write `// TODO`, `// rest of code here`, or incomplete functions. Every file must be 100% complete and production-ready.

## 4. Flat Folder Architecture (NO Nested `folder/page.tsx` Directories)
- **Flat Co-Located Files:** Do NOT create nested route directories like `dashboard/page.tsx` or `header/page.tsx`.
- **Single Flat App Directory (`src/app/`):** All pages, layout sections, and modals MUST live directly inside `src/app/` using descriptive `snake_case` filenames (e.g., `src/app/dashboard_page.tsx`, `src/app/header_page.tsx`, `src/app/login_page.tsx`).
- **Database Dual-Folder Structure (`src/db/`):**
  - `src/db/db_types.ts` (Shared TypeScript interfaces and OOP Repository contract)
  - `src/db/db_index.ts` (OOP Factory switcher based on `process.env.DB_PROVIDER = 'supabase' | 'mysql'`, defaulting to `'supabase'`)
  - `src/db/supabase/supabase_client.ts`
  - `src/db/supabase/supabase_repository.ts`
  - `src/db/supabase/supabase_schema_and_rpc.sql`
  - `src/db/mysql/mysql_client.ts`
  - `src/db/mysql/mysql_repository.ts`
  - `src/db/mysql/mysql_schema_and_sp.sql`

## 5. Modern Naming Conventions & Indentation Rules
- **Indentation:**
  - **TypeScript / TSX / CSS / JSON / Markdown:** Strictly **2 spaces** indentation (never tabs), single quotes `'...'`, and explicit semicolons `;`.
  - **SQL Scripts (PostgreSQL & MySQL):** Strictly **2 spaces** indentation, uppercase SQL keywords (`CREATE OR REPLACE FUNCTION`, `SELECT`, `FROM`, `WHERE`, `BEGIN`, `END`), and aligned clauses.
- **Naming Conventions:**
  - **File Names:** `snake_case` (e.g., `dashboard_page.tsx`, `header_page.tsx`, `supabase_repository.ts`).
  - **OOP Classes, React Components & TypeScript Interfaces:** `PascalCase` (e.g., `SupabaseRepository`, `DashboardPage`, `HeaderPage`, `IDatabaseRepository`).
  - **Variables, Functions & Methods:** `camelCase` (e.g., `guestTemporaryName`, `activateOfflineLicense`).
  - **Constants & Environment Keys:** `UPPER_SNAKE_CASE` (e.g., `DEFAULT_APP_CODE`, `DB_PROVIDER`).
  - **Database Tables, Columns, Views & Procedures:** `snake_case` with strict prefixes:
    - Tables: `tbl_<name>` (e.g., `tbl_categories`, `tbl_food_items`, `tbl_orders`)
    - Views: `vw_<name>` (e.g., `vw_rendered_home_menu`, `vw_role_module_matrix`)
    - Stored Procedures / Functions: `sp_<name>` or `fn_<name>` (e.g., `sp_activate_license`, `sp_render_home_page`)

## 6. Mandatory Developer Documentation in `/docs/`
- **Strict Rule:** Every time new code is created OR existing code is modified/fixed, you MUST create a comprehensive Markdown documentation file inside `/docs/` (e.g., `/docs/00_project_setup_and_architecture.md`, `/docs/01_database_and_offline_license.md`, `/docs/fix_<issue_name>.md`).
- **Required Structure for Every `/docs/*.md` File:**
  1. **Feature / Fix Summary:** Clear explanation of what was built or fixed and why.
  2. **Touched Files List:** Every flat file created or modified.
  3. **Architecture & Code Walkthrough:** Detailed explanation of the OOP Repository methods, SQL Stored Procedures, Controller endpoints, and Functional React state flow.
  4. **Data Flow (SQL Model -> Express Controller -> React View):** How the data is rendered inside PostgreSQL/MySQL and passed to the UI.
  5. **How to Test & Verify:** Exact steps to verify the feature or fix works locally in a single terminal.

## 7. Mandatory Git Branch & Commit Message Block (After Every Change)
- **Strict Rule:** At the end of EVERY response that creates new files, completes a phase, modifies existing code, or fixes a bug, you MUST provide a formatted **Git Delivery Block** containing:
  1. **Recommended Git Branch Name:** Following modern conventions (`feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`, or `docs/<short-slug>`).
  2. **Commit Title:** Conventional Commit format (`feat(scope): concise summary under 72 chars`).
  3. **Commit Comment / Body:** Detailed bulleted summary of all architectural additions, SQL stored procedures/views, OOP repository updates, UI changes, and `/docs/` files created.
  4. **Ready-to-Run Git Commands:** Copy-pasteable terminal block (`git checkout -b ...`, `git add .`, `git commit -m "..." -m "..."`).