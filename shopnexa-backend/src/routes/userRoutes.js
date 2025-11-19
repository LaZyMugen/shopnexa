import express from "express";
import supabase, { hasServiceRole } from "../config/supabaseClient.js";
import adminOnly from "../middleware/adminOnly.js";

const router = express.Router();

// Protect users listing when ADMIN_EMAILS is set (no-op otherwise)
router.use(adminOnly);

// GET /users - fetch users (add a safe default limit & simple error handling)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    // Prefer admin API when service role key is configured
    if (hasServiceRole && supabase?.auth?.admin?.listUsers) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: limit });
      if (error) {
        console.error("GET /users admin.listUsers error:", error.message || error);
      } else if (data?.users) {
        const shaped = data.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        }));
        return res.json({ success: true, data: shaped });
      }
      // if admin call failed, fall through to table attempt
    }

    // Fallback: try a public table named `users` (if project defines one)
    const { data: tableData, error: tableErr } = await supabase
      .from("users")
      .select("*")
      .limit(limit);

    if (tableErr) {
      console.error("GET /users table fallback error:", tableErr.message || tableErr);
      const hint = hasServiceRole
        ? "Ensure service role has access or create a public 'users' table."
        : "Set SUPABASE_SERVICE_ROLE_KEY in backend .env to list auth users, or create a public 'users' table.";
      return res.status(500).json({ success: false, error: `Failed to fetch users. ${hint}` });
    }
    return res.json({ success: true, data: tableData || [] });
  } catch (err) {
    console.error("GET /users error:", err);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
