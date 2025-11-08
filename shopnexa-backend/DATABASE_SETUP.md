# Database Setup Guide

## Supabase Database Connection

This project supports two methods to connect to Supabase:

### Method 1: Supabase JS Client (Recommended - Already Configured)
- Uses: `@supabase/supabase-js`
- Configuration: `src/config/supabaseClient.js`
- Environment variables needed:
  ```
  SUPABASE_URL=your-project-url
  SUPABASE_ANON_KEY=your-anon-key
  ```
- Test endpoint: `GET /api/test` or `GET /api/test/ping`

### Method 2: Direct PostgreSQL Connection (Optional)
- Uses: `pg` (PostgreSQL client)
- Configuration: `config/db.js`
- Environment variables needed:
  ```
  DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
  # OR
  SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
  ```
- Test endpoint: `GET /api/test/db`

## Getting Connection String

1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection Pooling**, copy the **Connection string** (use port 6543)
4. Replace `[PASSWORD]` with your database password
5. Add it to your `.env` file as `DATABASE_URL` or `SUPABASE_DB_URL`

## Testing Connection

### Test Supabase JS Client:
```bash
curl http://localhost:5000/api/test
# or
curl http://localhost:5000/api/test/ping
```

### Test Direct PostgreSQL Connection:
```bash
curl http://localhost:5000/api/test/db
```

### Health Check:
```bash
curl http://localhost:5000/health
```

## Notes

- **Supabase JS Client** is recommended for most use cases as it handles authentication and RLS (Row Level Security)
- **Direct PostgreSQL** connection is useful for complex queries or when you need raw SQL
- The server will automatically test the database connection on startup
- Connection pooling is enabled by default (max 20 connections)

