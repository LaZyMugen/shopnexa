import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// GET /users - fetch users (add a safe default limit & simple error handling)
router.get("/", async (req, res) => {
  try {
    // Simple pagination params (optional)
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const { data, error } = await supabase.from("users").select("*").limit(limit);
    if (error) {
      console.error("GET /users Supabase error:", error.message);
      return res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error("GET /users error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
