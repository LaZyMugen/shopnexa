import supabase from "../config/supabaseClient.js";

// Admin-only gate (no-op unless ADMIN_EMAILS is configured)
// ADMIN_EMAILS: comma-separated list of allowed admin emails
export default async function adminOnly(req, res, next) {
  try {
    const allowlist = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // If no allowlist is configured, skip enforcement
    if (allowlist.length === 0) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Malformed Authorization header" });
    }
    const token = parts[1];

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      res.set("WWW-Authenticate", 'Bearer realm="Admins only"');
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const email = (data.user.email || "").toLowerCase();
    if (!allowlist.includes(email)) {
      return res.status(403).json({ error: "Forbidden: admin access required" });
    }

    req.user = data.user;
    return next();
  } catch (err) {
    console.error("adminOnly error:", err?.message || err);
    return res.status(500).json({ error: "Admin guard failed" });
  }
}
