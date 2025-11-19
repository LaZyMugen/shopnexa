import express from "express";
import { testConnection } from "../../config/db.js";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// Simple liveness probe
router.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend up" });
});

// Database connectivity (direct Postgres via Pool)
router.get("/db", async (req, res) => {
  const result = await testConnection();
  if (result.success) return res.json(result);
  return res.status(500).json(result);
});

// Supabase client check (lightweight read)
router.get("/supabase", async (req, res) => {
  try {
    // Attempt a minimal query; table may not exist in fresh setups so we handle that
    const { data, error } = await supabase.from("products").select("id").limit(1);
    if (error && !String(error.message || "").toLowerCase().includes("does not exist")) {
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
    return res.json({ success: true, message: "Supabase reachable", sample: (data || []).length });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
});

export default router;
