import pool from "../config/db.js";

// Create new user
export const createUser = async ({ email, role, name, location }) => {
  const query = `
    INSERT INTO users (email, role, name, location)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [email, role, name, location];
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("createUser DB error:", err.message || err);
    throw new Error("Failed to create user");
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`;
  try {
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  } catch (err) {
    console.error("getUserByEmail DB error:", err.message || err);
    throw new Error("Failed to get user by email");
  }
};

// Get user by ID
export const getUserById = async (id) => {
  const query = `SELECT * FROM users WHERE id = $1`;
  try {
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  } catch (err) {
    console.error("getUserById DB error:", err.message || err);
    throw new Error("Failed to get user by id");
  }
};

// List all users (admin/debug)
export const listUsers = async () => {
  try {
    const { rows } = await pool.query(`SELECT id, email, role, created_at FROM users ORDER BY created_at DESC`);
    return rows;
  } catch (err) {
    console.error("listUsers DB error:", err.message || err);
    throw new Error("Failed to list users");
  }
};
