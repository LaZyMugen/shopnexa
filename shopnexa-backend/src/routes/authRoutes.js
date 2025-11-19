import express from "express";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
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
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
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

// Verify Google ID token server-side and return the token payload.
// Frontend should POST { id_token } to this endpoint after receiving a credential from Google Identity Services.
router.post('/google', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) return res.status(400).json({ error: 'missing id_token' });

  try {
    // Verify the token with Google's tokeninfo endpoint
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`;
    // Node 18+ has global fetch; if your runtime doesn't support it, install node-fetch and import it above.
    const resp = await fetch(googleVerifyUrl);
    if (!resp.ok) {
      const text = await resp.text();
      console.warn('google tokeninfo failed', resp.status, text);
      return res.status(401).json({ error: 'invalid id_token' });
    }
    const payload = await resp.json();

    // Optional: validate audience matches your configured client ID
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud && payload.aud !== expectedClientId) {
      console.warn('google token aud mismatch', payload.aud, '!=', expectedClientId);
      return res.status(401).json({ error: 'id_token audience mismatch' });
    }

    // Token is valid. Return the verified payload. Optionally upsert user/profile here.
    return res.json({ success: true, payload });
  } catch (err) {
    console.error('error verifying google token', err);
    return res.status(500).json({ error: 'server error' });
  }
});

export default router;

