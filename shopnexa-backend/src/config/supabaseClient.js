import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load .env (safe to call multiple times)
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail fast with a clear message so the developer knows what to set
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables. Add them to your .env file."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
