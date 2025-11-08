import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  
  // Sign up user
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password
  });
  
  if (error) return res.status(400).json({ error: error.message });
  
  // If session exists, user is auto-confirmed (email confirmation disabled in Supabase)
  // If no session, email confirmation is required
  // Return the response as-is so frontend can handle both cases
  res.status(201).json(data);
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
});

// Protected route
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid or expired token" });

  res.status(200).json({ user: data.user });
});

export default router;

