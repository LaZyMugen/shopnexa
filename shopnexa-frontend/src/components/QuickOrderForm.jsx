import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNotifications } from '../context/notificationContext.jsx';

export default function QuickOrderForm() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]); // [{id, qty}]
  const [submitting, setSubmitting] = useState(false);
  const { push } = useNotifications();

  useEffect(() => {
    // local products fallback
    try { const arr = JSON.parse(localStorage.getItem('products')||'[]'); setProducts(Array.isArray(arr)?arr:[]); } catch { /* ignore parse error */ }
  }, []);

  const addLine = (pid) => {
    if (!pid) return;
    setSelected(prev => prev.find(l=>l.id===pid) ? prev : [...prev, { id: pid, qty:1 }]);
  };
  const updateQty = (pid, qty) => {
    setSelected(prev => prev.map(l=> l.id===pid? { ...l, qty: Math.max(1, qty) } : l));
  };
  const removeLine = (pid) => setSelected(prev => prev.filter(l=>l.id!==pid));

  const submit = async () => {
    if (selected.length===0) { push('No items selected', { type:'error' }); return; }
    setSubmitting(true);
    try {
      const items = selected.map(l => ({ product_id: l.id, quantity: l.qty }));
      const res = await api.post('/orders', { items });
      if (res.data?.success) {
        push('Order placed successfully', { type:'success' });
        // optimistic local stock decrement
        try {
          const map = new Map(products.map(p=> [p.id, p]));
          for (const it of selected) {
            const p = map.get(it.id); if (p) p.stock = Math.max(0, (p.stock||0) - it.qty);
          }
          const updated = Array.from(map.values());
          setProducts(updated);
          localStorage.setItem('products', JSON.stringify(updated));
        } catch { /* ignore optimistic stock decrement failure */ }
        setSelected([]);
      } else {
        push('Order failed', { type:'error' });
      }
    } catch (e) {
      push(e.response?.data?.error || 'Order error', { type:'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-white/70 backdrop-blur p-4 border border-white/30 space-y-3">
      <h2 className="text-sm font-semibold">Quick Online Order</h2>
      <div className="flex gap-2">
        <select className="px-2 py-1 rounded border text-sm" onChange={e=>addLine(e.target.value)} value="">
          <option value="">Select product...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
        </select>
        <button disabled={submitting} onClick={submit} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">{submitting? 'Placing...' : 'Place Order'}</button>
      </div>
      <ul className="text-xs divide-y">
        {selected.map(l => (
          <li key={l.id} className="py-2 flex items-center justify-between">
            <span className="truncate max-w-[55%]">{l.id}</span>
            <div className="flex items-center gap-2">
              <input type="number" min={1} value={l.qty} onChange={e=>updateQty(l.id, parseInt(e.target.value,10)||1)} className="w-16 px-2 py-1 rounded border" />
              <button onClick={()=>removeLine(l.id)} className="px-2 py-1 rounded bg-rose-600 text-white">✕</button>
            </div>
          </li>
        ))}
        {selected.length===0 && <li className="py-4 text-center text-slate-500">No items selected</li>}
      </ul>
    </div>
  );
}
