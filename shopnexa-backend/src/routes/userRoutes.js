import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// GET /users - fetch all users from Supabase "users" table
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
