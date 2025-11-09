import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// Register user
export const register = async (req, res) => {
  const { email, password, name, role, location } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required" });
  }

  try {
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      "INSERT INTO users (email, name, role, location, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [email, name || null, role, location || null]
    );

    // Store password separately or in secure table later
    await pool.query(
      "INSERT INTO auth (user_id, password_hash) VALUES ($1, $2)",
      [result.rows[0].id, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const userId = user.rows[0].id;
    const passData = await pool.query("SELECT password_hash FROM auth WHERE user_id = $1", [userId]);
    if (passData.rows.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, passData.rows[0].password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};
