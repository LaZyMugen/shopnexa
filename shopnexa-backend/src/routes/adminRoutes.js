import express from "express";
import supabase from "../config/supabaseClient.js";
import adminOnly from "../middleware/adminOnly.js";

const router = express.Router();

// Apply admin guard if ADMIN_EMAILS configured
router.use(adminOnly);

// GET /admin/metrics - basic analytics
router.get("/metrics", async (req, res) => {
  // Helper to build synthetic demo metrics when real data is missing or errors out
  const buildDemo = () => {
    const today = new Date();
    const salesByDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // deterministic pseudo counts
      const count = (d.getDate() % 5) + ((i % 3));
      salesByDay.push({ date: d.toISOString().slice(0,10), count });
    }
    const demoProducts = Array.from({ length: 24 }).map((_,i)=>({
      id: 1000 + i,
      name: `Demo Product ${i+1}`,
      stock: (i % 11) + 1,
      price: ((i % 7) + 1) * 99,
      category_id: ['electronics','fashion','home','beauty','sports'][i % 5]
    }));
    const lowStock = demoProducts.filter(p=>p.stock <= 5).map(p=>({ id:p.id, name:p.name, stock:p.stock }));
    const catMap = {};
    for (const p of demoProducts) catMap[p.category_id] = (catMap[p.category_id]||0)+1;
    const categoryDistribution = Object.entries(catMap).map(([category_id,count])=>({ category_id, count }));
    const revenue = salesByDay.reduce((a,b)=>a + b.count * 250, 0); // rough average order value
    const customerCount = 37; // fixed believable demo number
    return {
      salesByDay,
      revenue,
      lowStock,
      categoryDistribution,
      customerCount,
      totalOrders: salesByDay.reduce((a,b)=>a+b.count,0),
      totalProducts: demoProducts.length
    };
  };
  try {
    const { data: orders, error: oErr } = await supabase
      .from("orders")
      .select("id, total_amount, created_at, status, user_id");
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, stock, price, category_id");

    // If any error or obviously empty, fallback to demo metrics
    if (oErr || pErr || !orders?.length || !products?.length) {
      return res.json({ success: true, data: buildDemo(), demo: true });
    }

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
    const lowStock = products.filter(p => (p.stock ?? 0) <= 5).map(p => ({ id: p.id, name: p.name, stock: p.stock }));
    const catMap = {};
    for (const p of products) {
      const cat = p.category_id || "uncategorized";
      catMap[cat] = (catMap[cat] || 0) + 1;
    }
    const categoryDistribution = Object.entries(catMap).map(([category_id, count]) => ({ category_id, count }));
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
      },
      demo: false
    });
  } catch (e) {
    // Hard fallback to demo if unexpected crash
    return res.json({ success: true, data: buildDemo(), demo: true, note: 'Supabase metrics crashed; serving demo metrics.' });
  }
});

export default router;