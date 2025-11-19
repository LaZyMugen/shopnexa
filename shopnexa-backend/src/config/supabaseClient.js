import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load .env (safe to call multiple times)
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
// Prefer service role on the server if provided; falls back to anon
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
  // Fail fast with a clear message so the developer knows what to set
  throw new Error(
    "Missing SUPABASE_URL and a Supabase key. Set SUPABASE_SERVICE_ROLE_KEY (preferred on server) or SUPABASE_ANON_KEY in your .env."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

// Expose a small helper to know if admin features are available
export const hasServiceRole = Boolean(SUPABASE_SERVICE_ROLE_KEY);

export default supabase;
