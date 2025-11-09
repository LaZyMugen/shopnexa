import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// Test Supabase JS client connection - lightweight check
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("/api/test Supabase error:", error.message);
      return res.status(500).json({ success: false, message: "Supabase connection test failed" });
    }
    return res.json({ success: true, message: "Supabase client connected", data });
  } catch (err) {
    console.error("/api/test unexpected error:", err);
    return res.status(500).json({ success: false, message: "Supabase test error" });
  }
});

// Ping endpoint — simple lightweight server reachability test
router.get("/ping", async (req, res) => {
  try {
    // Try a minimal query instead of relying on optional RPCs
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      // If Supabase auth/public API is reachable but table doesn't exist, still return reachable
      console.warn("/api/test/ping warning (table query failed):", error.message);
      return res.json({ success: true, message: "Supabase reachable (query failed)", hint: error.message });
    }
    return res.json({ success: true, message: "Supabase reachable", data });
  } catch (err) {
    console.error("/api/test/ping error:", err);
    return res.status(500).json({ success: false, message: "Supabase connection test failed" });
  }
});

export default router;
