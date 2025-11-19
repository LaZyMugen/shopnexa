import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cartContext";
import { estimateDays } from "../data/retailers";
import api from "../api/axios";

export default function Checkout() {
  const { items, totals, groups, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Derive demo shipping costs with cap <= 1/10 items subtotal
  const computed = useMemo(() => {
    const itemsSubtotal = items.reduce((s, it) => s + (Number(it.price || 0) * (it.qty || 0)), 0);
    // Build initial per-item shipping using retailer shipping or fallback 5% of price
    let perItem = items.map(it => {
      const base = Number(it.retailer?.shipping);
      let ship = isFinite(base) && base > 0 ? base : Number(it.price || 0) * 0.05; // 5% fallback
      ship = Math.round(ship * 100) / 100; // round
      return { id: it.id, shipPerUnit: ship, qty: it.qty || 0 };
    });
    let rawTotal = perItem.reduce((s, r) => s + r.shipPerUnit * r.qty, 0);
    const cap = itemsSubtotal / 10; // 10% cap
    let scale = 1;
    if (rawTotal > cap && cap > 0) {
      scale = cap / rawTotal;
    }
    const perItemScaled = new Map();
    perItem.forEach(r => {
      const scaled = Math.round((r.shipPerUnit * scale) * 100) / 100;
      perItemScaled.set(r.id, scaled);
    });
    const shippingTotal = perItem.reduce((s, r) => s + (perItemScaled.get(r.id) * r.qty), 0);
    const total = Math.round((itemsSubtotal + shippingTotal) * 100) / 100;
    const estimates = items.map((it) => {
      const d = Number(it.retailer?.distance_km);
      return isFinite(d) ? estimateDays(d) : 5;
    });
    const estimatedDays = estimates.length ? Math.max(...estimates) : 5;
    return { itemsSubtotal, shippingTotal, total, estimatedDays, perItemScaled };
  }, [items]);

  const placeOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    // Include shipping breakdown using scaled shipping costs
    const payload = { items, totals: { items: computed.itemsSubtotal, shipping: computed.shippingTotal, total: computed.total }, estimatedDays: computed.estimatedDays };
    try {
      const res = await api.post('/orders/demo', payload);
      // Attempt to derive order id from response; fallback to timestamp
      const orderId = res?.data?.orderId || `demo-${Date.now()}`;
      // Persist summary for order summary page
      try {
        const all = JSON.parse(localStorage.getItem('order_summaries') || '[]');
        all.push({ id: orderId, items, totals: payload.totals, estimatedDays: payload.estimatedDays, created: new Date().toISOString() });
        localStorage.setItem('order_summaries', JSON.stringify(all));
      } catch {}
  // Navigate immediately to avoid empty-cart flash; clear cart after navigation (microtask)
  navigate(`/order-summary/${orderId}`);
  setTimeout(() => { clearCart(); }, 0);
    } catch (err) {
      console.warn('place order demo failed', err);
      // fallback: save to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('demo_orders') || '[]');
        saved.push({ id: `demo-${Date.now()}`, items, totals: payload.totals, estimatedDays: computed.estimatedDays, created: new Date().toISOString() });
        localStorage.setItem('demo_orders', JSON.stringify(saved));
        const fallbackId = saved[saved.length - 1].id;
        // Also mirror into order_summaries for summary page
        try {
          const all = JSON.parse(localStorage.getItem('order_summaries') || '[]');
          all.push({ id: fallbackId, items, totals: payload.totals, estimatedDays: computed.estimatedDays, created: new Date().toISOString() });
          localStorage.setItem('order_summaries', JSON.stringify(all));
        } catch {}
  navigate(`/order-summary/${fallbackId}`);
  setTimeout(() => { clearCart(); }, 0);
      } catch (e) {
        setMessage('Failed to place order.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-4">Looks like you haven't added anything to your cart yet.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/store')} className="px-4 py-2 rounded bg-indigo-600 text-white">Continue shopping</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items list (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Cart</h2>
            <div className="text-sm text-slate-600">{items.length} item(s)</div>
          </div>

          {groups.map((g) => (
            <div key={g.key} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-slate-800">{g.retailer?.name || 'Unassigned'}</div>
                <div className="text-sm text-slate-600">{g.items.length} item(s)</div>
              </div>
              <div className="space-y-3">
                {g.items.map((it) => (
                  <div key={it.id} className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {it.image_url || it.image ? (
                        <img src={it.image_url || it.image} alt={it.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-[10px] text-slate-400">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{it.name}</div>
                          <div className="text-xs text-slate-500">{it.region ? `Origin: ${it.region}` : (it.retailer?.name ? `Ships from ${it.retailer.name}` : 'Origin: N/A')}</div>
                          {it.selectedLocation?.address && <div className="text-[11px] text-slate-500 mt-1">Deliver to: {it.selectedLocation.address}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{(Number(it.price||0) * (it.qty||0)).toFixed(2)}</div>
                          <div className="text-xs text-slate-500">Ship ₹{(computed.perItemScaled.get(it.id) * (it.qty||0)).toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(it.id, Math.max(1, (it.qty||1) - 1))} className="px-3 py-1 bg-slate-100 rounded">-</button>
                          <div className="px-3 py-1 border rounded">{it.qty}</div>
                          <button onClick={() => updateQty(it.id, (it.qty||1) + 1)} className="px-3 py-1 bg-slate-100 rounded">+</button>
                          <button onClick={() => removeItem(it.id)} className="text-sm text-red-600 ml-3">Remove</button>
                        </div>
                        {isFinite(it.deliveryDays) && <div className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">ETA {it.deliveryDays}d</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="text-sm text-slate-600">Need help? <button onClick={() => navigate('/feedback')} className="underline">Contact support</button></div>
        </div>

        {/* Right: Summary (1/3) */}
        <aside className="space-y-4">
          <div className="bg-white rounded-lg border p-4 sticky top-6">
            <div className="flex justify-between mb-2"><div className="text-sm text-slate-600">Items</div><div className="font-medium">₹{computed.itemsSubtotal.toFixed(2)}</div></div>
            <div className="flex justify-between mb-2"><div className="text-sm text-slate-600">Shipping</div><div className="font-medium">₹{computed.shippingTotal.toFixed(2)}</div></div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between font-semibold text-lg"><div>Total</div><div>₹{computed.total.toFixed(2)}</div></div>
              <div className="text-xs text-slate-500 mt-2">Estimated delivery: {computed.estimatedDays} day(s)</div>
            </div>

            <div className="mt-4 space-y-2">
              <button onClick={placeOrder} disabled={loading} className="w-full px-4 py-3 rounded bg-indigo-600 text-white text-sm font-medium">{loading ? 'Placing...' : 'Place order'}</button>
              <button onClick={() => navigate('/store')} className="w-full px-4 py-3 rounded bg-slate-100 text-sm">Continue shopping</button>
            </div>
            {message && <div className="text-sm text-emerald-600 mt-3">{message}</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
