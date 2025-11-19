import express from "express";
import pool from "../../config/db.js";

const router = express.Router();

// POST /admin/migrate - idempotent schema creation/alteration
router.post("/migrate", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS retailers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS retailer INTEGER REFERENCES retailers(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2),
        ADD COLUMN IF NOT EXISTS tags TEXT[];

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price_each NUMERIC(12,2) NOT NULL DEFAULT 0
      );
    `);

    await client.query("COMMIT");
    return res.json({ success: true, message: "Migration applied" });
  } catch (e) {
    await client.query("ROLLBACK");
    return res.status(500).json({ success: false, error: e.message || String(e) });
  } finally {
    client.release();
  }
});

export default router;