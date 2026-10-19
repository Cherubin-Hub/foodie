# Foodie. — Single-Store Configurable Food Ordering System & POS

A production-ready **Database-Centric Modular Monolith** designed for single-store food enterprises, dining establishments, and quick-service takeaway operations. Built with Vite, React 18, TypeScript, Express, and a dual-database repository layer supporting PostgreSQL (Supabase) and MySQL 8.0+.

---

## 🌟 Key Architecture & Highlights

- **Single-Terminal Developer Execution:** Start both the Express API and Vite React UI simultaneously in **1 single terminal** via `npm run dev` with zero CORS friction (automated `/api` reverse proxy).
- **Database-Centric MVC & SQL CQRS:** Heavy data crunching, RBAC permission matrices, offline HMAC licensing checks, and home page payload bundling are executed directly inside SQL Views and Stored Procedures before reaching the UI.
- **100% Offline Cryptographic Licensing:** Protects the software from unauthorized deployment using HMAC-SHA256 signatures, dynamic nonce rotation, and anti-clock-tampering enforcement without requiring any external licensing server.
- **Dynamic Guest & Table Ordering:** Allows walk-in customers and table patrons to start ordering instantly by specifying a temporary identifier (`"Alex - Table 4"`) without mandatory sign-up.
- **Live 4-Step Order Tracker & Digital Receipts:** Real-time polling status tracker (`Order Placed` $\rightarrow$ `In Kitchen` $\rightarrow$ `Ready / Delivery` $\rightarrow$ `Completed`) with shareable links and printable itemized receipts.

```text
┌─────────────────────────────────────────────────────────────┐
│                      REACT 18 UI                            │
│  (Vite + TypeScript + Zustand + Tailwind CSS + Lucide)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Fetch (/api/*)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  THIN EXPRESS CONTROLLER                    │
│   (Port 4000 • Input Validation • DatabaseFactory Switcher)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ IDatabaseRepository Interface
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│     SUPABASE ADAPTER         │    │       MYSQL ADAPTER          │
│   (PostgreSQL 15+ • pgcrypto │    │    (MySQL 8.0+ • RFC 2104    │
│    PL/pgSQL Functions & RPC) │    │      Pure-SQL HMAC Engine)   │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **Package Manager:** npm v9+

### 2. Installation
Clone the repository and install dependencies:
```powershell
git clone https://github.com/Cherubin-Hub/foodie.git
cd foodie
npm install
```

### 3. Environment Setup
Copy the sample environment file to `.env`:
```powershell
Copy-Item .env.example .env
```
Configure your database credentials in `.env`:
```bash
PORT=4000
DB_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

APP_CODE=FOODIE_POS
APP_SECRET=foodie_master_secret_2026_x99_secure
```

### 4. Database Setup
Run the modular scripts in `src/db/supabase/` (or `src/db/mysql/`) in your database editor:
1. `tables/*.sql`
2. `views/*.sql`
3. `functions_and_procedures/*.sql`
4. `seed_data/*.sql`

### 5. Launch Application (1 Single Terminal)
```powershell
npm run dev
```
- **Web Storefront:** `http://localhost:5173/`
- **Backend API:** `http://localhost:4000/`

---

## 🔑 Offline License Key Generation

To issue or test license keys for any hardware installation nonce:
```powershell
# View all duration tiers for a given nonce
npx tsx scripts/generate_license_key.ts --all A9F3K2

# Generate a specific tier
npx tsx scripts/generate_license_key.ts 30D A9F3K2
npx tsx scripts/generate_license_key.ts LIFE A9F3K2
```

### Supported License Tiers:
| Tier Code | Duration | Expiration |
| :--- | :--- | :--- |
| `7D` | 7 Days | `NOW() + 7 days` |
| `14D` | 14 Days | `NOW() + 14 days` |
| `30D` | 30 Days | `NOW() + 30 days` |
| `90D` | 90 Days | `NOW() + 90 days` |
| `264D` | 264 Days | `NOW() + 264 days` |
| `LIFE` | Lifetime | `9999-12-31 23:59:59` |

---

## 📚 Technical Documentation

Comprehensive architectural and engineering walkthroughs are available in `/docs/`:
- [`docs/00_clean_bootstrap_and_single_terminal_setup.md`](./docs/00_clean_bootstrap_and_single_terminal_setup.md): Single-terminal tooling and dev-proxy architecture.
- [`docs/01_database_schema_and_offline_license.md`](./docs/01_database_schema_and_offline_license.md): Dual-database modular schemas, anti-tampering logic, and pure-SQL RFC 2104 HMAC engine.
- [`docs/02_backend_controller_and_oop_repositories.md`](./docs/02_backend_controller_and_oop_repositories.md): OOP Repository interfaces, concrete adapters, and Express router.
- [`docs/03_frontend_pages_and_rbac_flows.md`](./docs/03_frontend_pages_and_rbac_flows.md): Flat React pages, Zustand store, and dynamic RBAC switchboard.
- [`docs/04_end_to_end_verification_and_walkthrough.md`](./docs/04_end_to_end_verification_and_walkthrough.md): End-to-end testing and verification walkthrough.

---

## 📄 License
MIT License. Authored for single-store retail and food service deployments.
