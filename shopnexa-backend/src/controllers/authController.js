import supabase from "../config/supabaseClient.js";

// Signup (server-side)
export const signupUser = async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ message: "Signed up", data });
};

// Login (server-side)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ message: "Logged in", data });
};
