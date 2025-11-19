import supabase from "../config/supabaseClient.js";

// Create order with items (expects items: [{product_id, quantity}])
export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id || null; // may be null for guest if guest flow added later
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ success: false, error: "No items provided" });

    // Fetch products and validate stock
    const productIds = items.map(i => i.product_id);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, price, stock")
      .in("id", productIds);
    if (pErr) throw pErr;

    const byId = Object.fromEntries(products.map(p => [p.id, p]));
    let total = 0;
    for (const it of items) {
      const prod = byId[it.product_id];
      if (!prod) return res.status(400).json({ success: false, error: `Product ${it.product_id} not found` });
      const qty = Math.max(parseInt(it.quantity, 10) || 1, 1);
      if (prod.stock < qty) return res.status(400).json({ success: false, error: `Insufficient stock for product ${prod.id}` });
      total += Number(prod.price) * qty;
    }

    // Insert order
    const { data: orderData, error: oErr } = await supabase
      .from("orders")
      .insert({ user_id: userId, total_amount: total, status: "pending" })
      .select();
    if (oErr) throw oErr;
    const order = orderData[0];

    // Insert order_items and decrement stock
    for (const it of items) {
      const qty = Math.max(parseInt(it.quantity, 10) || 1, 1);
      await supabase.from("order_items").insert({ order_id: order.id, product_id: it.product_id, quantity: qty, price_each: byId[it.product_id].price });
      const newStock = byId[it.product_id].stock - qty;
      await supabase.from("products").update({ stock: newStock }).eq("id", it.product_id);
    }

    return res.status(201).json({ success: true, order });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
};

// List orders (basic pagination)
export const listOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;
    const { data, error, count } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res.json({ success: true, data, page: parseInt(page, 10) || 1, pageSize: limit, total: count });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
};

export const getOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("*, order_items(id, product_id, quantity, price_each)")
      .eq("id", id)
      .single();
    if (oErr) throw oErr;
    return res.json({ success: true, data: order });
  } catch (e) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const allowed = ["pending", "paid", "shipped", "completed", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, error: "Invalid status" });
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
};
