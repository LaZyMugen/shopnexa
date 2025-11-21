import supabase from '../config/supabaseClient.js';
import bus from '../events/eventBus.js';

// In-memory fallback store if Supabase table missing
const memoryFeedback = [];

// Create feedback for a product
export const createFeedback = async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body || {};
    const r = Math.min(Math.max(parseInt(rating, 10) || 0, 0), 5);
    if (!productId) return res.status(400).json({ success: false, error: 'Missing product id' });
    if (r <= 0) return res.status(400).json({ success: false, error: 'Rating must be >=1' });
    const fb = { product_id: productId, rating: r, comment: comment || '', created_at: new Date().toISOString() };

    // Attempt Supabase insert
    const { data, error } = await supabase.from('product_feedback').insert(fb).select();
    if (error) {
      // Fallback to memory; acceptable for demo
      memoryFeedback.push(fb);
      bus.emit('feedback-new', fb);
      return res.status(201).json({ success: true, data: fb, fallback: true });
    }
    const saved = Array.isArray(data) ? data[0] : data;
    bus.emit('feedback-new', saved);
    return res.status(201).json({ success: true, data: saved });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
};

// List feedback for a product
export const listFeedbackForProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) return res.status(400).json({ success: false, error: 'Missing product id' });
    const { data, error } = await supabase
      .from('product_feedback')
      .select('product_id,rating,comment,created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(100);
    let combined = [];
    if (error) {
      // Fallback to memory filtered
      combined = memoryFeedback.filter(f => String(f.product_id) === String(productId)).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
    } else {
      combined = data;
      // Merge memory items not in DB yet (edge case)
      const mem = memoryFeedback.filter(f => String(f.product_id) === String(productId));
      if (mem.length) combined = [...mem, ...combined];
    }
    return res.json({ success: true, data: combined });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
};

// Recent feedback (last 20 across products)
export const listRecentFeedback = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_feedback')
      .select('product_id,rating,comment,created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    let arr = [];
    if (error) {
      arr = memoryFeedback.slice(-20).reverse();
    } else {
      arr = data;
      if (memoryFeedback.length) {
        const mem = memoryFeedback.slice(-20);
        arr = [...mem.reverse(), ...arr];
      }
    }
    return res.json({ success: true, data: arr });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message || String(e) });
  }
};
