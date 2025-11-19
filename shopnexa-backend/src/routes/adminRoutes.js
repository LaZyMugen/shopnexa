import express from "express";
import supabase from "../config/supabaseClient.js";
import adminOnly from "../middleware/adminOnly.js";

const router = express.Router();

// Apply admin guard if ADMIN_EMAILS configured
router.use(adminOnly);

// GET /admin/metrics - basic analytics
router.get("/metrics", async (req, res) => {
  try {
    // Sales by day (orders table)
    const { data: orders, error: oErr } = await supabase
      .from("orders")
      .select("id, total_amount, created_at, status");
    if (oErr) throw oErr;

    const salesByDayMap = {};
    let revenue = 0;
    for (const o of orders) {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      salesByDayMap[day] = (salesByDayMap[day] || 0) + 1;
      if (["paid", "shipped", "completed"].includes(o.status)) {
        revenue += Number(o.total_amount || 0);
      }
    }
    const salesByDay = Object.entries(salesByDayMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,count])=>({date,count}));

    // Low stock
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, stock, price, category_id");
    if (pErr) throw pErr;
    const lowStock = products.filter(p => (p.stock ?? 0) <= 5).map(p => ({ id: p.id, name: p.name, stock: p.stock }));

    // Category distribution (by count of products) - simple placeholder
    const catMap = {};
    for (const p of products) {
      const cat = p.category_id || "uncategorized";
      catMap[cat] = (catMap[cat] || 0) + 1;
    }
    const categoryDistribution = Object.entries(catMap).map(([category_id, count]) => ({ category_id, count }));

    // Customer count (unique user_id in orders)
    const uniqueCustomers = new Set(orders.filter(o => o.user_id).map(o => o.user_id));

    return res.json({
      success: true,
      data: {
        salesByDay,
        revenue,
        lowStock,
        categoryDistribution,
        customerCount: uniqueCustomers.size,
        totalOrders: orders.length,
        totalProducts: products.length
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
});

export default router;