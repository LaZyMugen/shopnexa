# ShopNexa Backend

Minimal Express backend for ShopNexa with Supabase integration.

## Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install deps:
   - npm install
3. Run:
   - npm run dev

## Environment

See `.env.example` for all variables. Typical:
- PORT (default 5000)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (preferred on server) or SUPABASE_ANON_KEY
- DATABASE_URL or SUPABASE_DB_URL (optional, for direct Postgres)
- ADMIN_EMAILS (optional allowlist to protect `/api/users`)

## Endpoints

- GET `/api/health` — liveness
- GET `/api/health/db` — direct Postgres connectivity
- GET `/api/health/supabase` — Supabase client check
- POST `/api/demo/seed` — seed categories/products for demo
- GET `/api/products` and CRUD
- GET `/api/orders` and POST `/api/orders` (protected) + `/api/orders/demo` (public demo)
- GET `/api/users` — uses admin list when service role is present; protected when `ADMIN_EMAILS` is set
- POST `/api/auth/signup`, `/api/auth/login`, GET `/api/auth/me`

## Notes

- When `ADMIN_EMAILS` is configured, only emails in the list can access `/api/users`.
- `config/db.js` enforces SSL and provides user-friendly error messages.
- Use `/api/demo/seed` to quickly populate demo data.
