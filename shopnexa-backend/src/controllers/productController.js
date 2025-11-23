import supabase from "../config/supabaseClient.js";

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;

    const { data, error } = await supabase
      .from("products")
      .insert([{ name, description, price, stock, category_id }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Product created", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      retailer, // future field
      minPrice,
      maxPrice,
      sort = "created_at",
      order = "desc",
      page = 1,
      pageSize = 20,
    } = req.query;

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

    // Base query
    let query = supabase
      .from("products")
      .select("*, categories(name)", { count: "exact" })
      .range(offset, offset + limit - 1);

    // Filters
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (category) {
      query = query.eq("category_id", category);
    }
    if (minPrice) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice) {
      query = query.lte("price", maxPrice);
    }
    // Retailer filter placeholder (retailer column may be added later)
    if (retailer) {
      query = query.eq("retailer", retailer); // safe even if column absent (Supabase will error) => catch below
    }

    // Sorting (whitelist allowed columns)
    const allowedSort = ["price", "created_at", "stock", "name"];
    const sortCol = allowedSort.includes(sort) ? sort : "created_at";
    const asc = String(order).toLowerCase() === "asc";
    query = query.order(sortCol, { ascending: asc });

    const { data, error, count } = await query;
    if (error) throw error;
    return res.status(200).json({ data, page: parseInt(page, 10) || 1, pageSize: limit, total: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    res.status(200).json({ data });
  } catch (err) {
    res.status(404).json({ error: "Product not found" });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.status(200).json({ message: "Product updated", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk decrement stock (demo/public endpoint)
// Expects body: { items: [ { id|product_id, qty|quantity } ] }
// For each item we validate availability and then decrement.
// Returns: { success:true, updated:[{id, oldStock, newStock}], skipped:[{id, reason}] }
export const bulkDecrementStock = async (req, res) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rawItems.length) return res.status(400).json({ success:false, error:'No items provided' });
    // Normalise shape
    const norm = rawItems.map(it => ({
      id: Number(it.product_id != null ? it.product_id : it.id),
      qty: Math.max(parseInt(it.quantity != null ? it.quantity : it.qty, 10) || 1, 1)
    })).filter(i => Number.isFinite(i.id));
    if (!norm.length) return res.status(400).json({ success:false, error:'No valid items' });
    const ids = norm.map(i => i.id);
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id, stock')
      .in('id', ids);
    if (pErr) throw pErr;
    const byId = Object.fromEntries(products.map(p => [p.id, p]));
    const updated = []; const skipped = [];
    for (const it of norm) {
      const prod = byId[it.id];
      if (!prod) { skipped.push({ id: it.id, reason:'Not found' }); continue; }
      if (prod.stock < it.qty) { skipped.push({ id: it.id, reason:'Insufficient stock' }); continue; }
      const newStock = prod.stock - it.qty;
      const { error: uErr } = await supabase.from('products').update({ stock: newStock }).eq('id', it.id);
      if (uErr) { skipped.push({ id: it.id, reason: uErr.message || 'Update failed' }); continue; }
      updated.push({ id: it.id, oldStock: prod.stock, newStock });
    }
    return res.status(200).json({ success:true, updated, skipped });
  } catch (e) {
    return res.status(500).json({ success:false, error: e.message || String(e) });
  }
};
