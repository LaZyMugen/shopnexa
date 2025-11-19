# Database Setup Guide

## Supabase Database Connection

This project supports two ways to talk to your Supabase database:

### Option A: Supabase JS Client (recommended)
- Library: `@supabase/supabase-js`
- Config: `src/config/supabaseClient.js`
- Required env vars in backend `.env`:
  ```
  SUPABASE_URL=your-project-url
  # Prefer on server:
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  # Fallback if you don't have service role:
  # SUPABASE_ANON_KEY=your-anon-key
  ```
- Health endpoint: `GET /api/health/supabase`

### Option B: Direct PostgreSQL connection (optional)
- Library: `pg`
- Config: `config/db.js`
- Required env vars in backend `.env` (use one):
  ```
  DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
  # OR
  SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
  ```
  Notes:
  - SSL is required and already enabled in `config/db.js`.
  - If you prefer connection pooling (pgbouncer), use the pooling port from Supabase (often 6543) and append `?pgbouncer=true`.
- Health endpoint: `GET /api/health/db`

## Getting your connection string

1. Open your Supabase project
2. Go to Settings → Database
3. Copy the connection string (direct 5432, or pooling 6543)
4. Replace `[PASSWORD]` with the database password shown in the dashboard
5. Put it into `.env` as `DATABASE_URL` or `SUPABASE_DB_URL`

## Health checks and demo seeding

```bash
# Liveness
GET http://localhost:5000/api/health

# Direct Postgres connectivity
GET http://localhost:5000/api/health/db

# Supabase client check (safe)
GET http://localhost:5000/api/health/supabase

# Seed minimal demo data (categories/products)
POST http://localhost:5000/api/demo/seed
```

## Notes

- Supabase JS Client is recommended for auth-aware access and RLS.
- Direct PostgreSQL is useful for raw SQL and seeding scripts.
- `config/db.js` enables SSL and provides user-friendly error messages.
- If `SUPABASE_SERVICE_ROLE_KEY` is set, the `/api/users` route can list auth users via admin API; otherwise it will look for a public `users` table.

