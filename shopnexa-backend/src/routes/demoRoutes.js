import express from "express";
import pool from "../../config/db.js";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// POST /api/demo/seed - create minimal tables and seed sample data for demo
router.post("/seed", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Schema: categories, products (minimal for demo)
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        region TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Ensure idempotency if the table already existed without the unique constraint
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'products_name_key'
        ) THEN
          BEGIN
            CREATE UNIQUE INDEX products_name_key ON products(name);
          EXCEPTION WHEN others THEN
            -- ignore if index creation races
            NULL;
          END;
        END IF;
      END$$;

      -- Backfill columns for existing products table (idempotent)
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS region TEXT,
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // Seed categories
    const catNames = ["Groceries", "Electronics", "Fashion", "Home & Kitchen", "Local Specialties"];
    for (const name of catNames) {
      await client.query(
        `INSERT INTO categories(name) VALUES($1) ON CONFLICT(name) DO NOTHING;`,
        [name]
      );
    }

    // Fetch category ids
    const { rows: cats } = await client.query(`SELECT id, name FROM categories`);
    const findCat = (n) => cats.find((c) => c.name === n)?.id || null;

    // Seed products (demo)
    const demoProducts = [
      {
        name: "Organic Basmati Rice",
        description: "Premium long-grain rice from local farms.",
        price: 699,
        stock: 42,
        category_id: findCat("Groceries"),
        region: "Delhi",
        image_url: "https://images.unsplash.com/photo-1604908177272-28eb8b9caea0?w=800"
      },
      {
        name: "Handcrafted Terracotta Pot",
        description: "Locally made terracotta for plants and decor.",
        price: 349,
        stock: 20,
        category_id: findCat("Local Specialties"),
        region: "Jaipur",
        image_url: "https://images.unsplash.com/photo-1560185008-b033106af10f?w=800"
      },
      {
        name: "Wireless Earbuds",
        description: "Noise-isolating, 24h battery life.",
        price: 1599,
        stock: 60,
        category_id: findCat("Electronics"),
        region: "Bengaluru",
        image_url: "https://images.unsplash.com/photo-1585386959984-a41552231658?w=800"
      },
      {
        name: "Cotton Kurta",
        description: "Breathable cotton kurta with classic fit.",
        price: 899,
        stock: 35,
        category_id: findCat("Fashion"),
        region: "Lucknow",
        image_url: "https://images.unsplash.com/photo-1520975922284-643cf29d4d85?w=800"
      }
    ];

    for (const p of demoProducts) {
      await client.query(
        `INSERT INTO products(name, description, price, stock, category_id, region, image_url)
         SELECT $1,$2,$3,$4,$5,$6,$7
         WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1);`,
        [p.name, p.description, p.price, p.stock, p.category_id, p.region, p.image_url]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Demo data seeded" });
  } catch (err) {
    await client.query("ROLLBACK");
    const msg = err?.message || String(err);
    console.error("/api/demo/seed error:", msg);
    res.status(500).json({ success: false, error: "Failed to seed demo data", detail: msg });
  } finally {
    client.release();
  }
});

export default router;

// Seed synthetic shipping orders (SSE-friendly) using Supabase orders table.
router.post('/seed-shipping', async (req, res) => {
  try {
    // Fetch existing orders first
    const { data: existing, error: existErr } = await supabase.from('orders').select('id');
    if (existErr) {
      // fall back: just return demo ack without inserting
      return res.json({ success:true, demo:true, note:'Could not access orders table; demo only.' });
    }
    if (existing && existing.length >= 8) {
      return res.json({ success:true, skipped:true, message:'Sufficient orders already present' });
    }
    const statuses = ['pending','shipped','out_for_delivery','completed','paid','shipped','out_for_delivery','completed'];
    const now = Date.now();
    const rows = [];
    for (let i=0;i<statuses.length;i++) {
      const ts = new Date(now - i*60*60*1000).toISOString();
      rows.push({ user_id: null, total_amount: (Math.round((i+2)*175.5)), status: statuses[i], created_at: ts });
    }
    // Insert rows
    const { data: inserted, error: insErr } = await supabase.from('orders').insert(rows).select();
    if (insErr) throw insErr;
    return res.json({ success:true, created: inserted.length });
  } catch (e) {
    return res.status(500).json({ success:false, error: e.message || String(e) });
  }
});

// Fallback list of shipping orders (returns real ones if present, else synthetic without inserting)
router.get('/shipping-orders', async (req, res) => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('id,total_amount,status,created_at');
    if (error) {
      // supply synthetic if error
      return res.json({ success:true, data: buildSynthetic() });
    }
    if (!orders || orders.length === 0) {
      return res.json({ success:true, data: buildSynthetic(), demo:true });
    }
    return res.json({ success:true, data: orders, demo:false });
  } catch (e) {
    return res.json({ success:true, data: buildSynthetic(), demo:true, note:'Crash fallback' });
  }
});

function buildSynthetic() {
  const statuses = ['pending','shipped','out_for_delivery','completed','paid','shipped','out_for_delivery','completed'];
  const now = Date.now();
  return statuses.map((s,i)=> ({
    id: 9000 + i,
    total_amount: (Math.round((i+2)*175.5)),
    status: s,
    created_at: new Date(now - i*60*60*1000).toISOString()
  }));
}
