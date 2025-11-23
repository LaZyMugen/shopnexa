import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import CheckoutProgress from '../components/CheckoutProgress';

function loadOrderSummary(id) {
  try {
    const all = JSON.parse(localStorage.getItem('order_summaries') || '[]');
    const found = all.find(o => o.id === id);
    if (found) return found;
    return null;
  } catch { /* ignore: malformed localStorage */ return null; }
}

// Deterministic mock status progression (placed -> packed -> shipped -> out_for_delivery -> delivered)
// We map elapsed minutes since placedAt to a status.
function computeStatusTimeline(placedAtIso) {
  const placedAt = placedAtIso ? new Date(placedAtIso).getTime() : Date.now();
  const now = Date.now();
  const elapsedMin = (now - placedAt) / 60000; // minutes
  const stages = [
    { key: 'placed', label: 'Order Placed', min: 0 },
    { key: 'packed', label: 'Items Packed', min: 10 },
    { key: 'shipped', label: 'Shipped from warehouse', min: 30 },
    { key: 'out_for_delivery', label: 'Out for delivery', min: 60 },
    { key: 'delivered', label: 'Delivered', min: 120 }
  ];
  let current = stages[0].key;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (elapsedMin >= stages[i].min) { current = stages[i].key; break; }
  }
  return { stages, current, elapsedMin };
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [order, setOrder] = useState(null);
  const [tick, setTick] = useState(0); // re-render for simulated realtime status
  
  // Build a lightweight product index for image fallbacks
  const productIndex = useMemo(() => {
    try {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      const idx = {};
      for (const p of products) {
        if (!p) continue;
        if (p.id) idx[`id:${p.id}`] = p;
        if (p.sku) idx[`sku:${String(p.sku).toLowerCase()}`] = p;
        if (p.name) idx[`name:${String(p.name).toLowerCase()}`] = p;
      }
      return idx;
    } catch { return {}; }
  }, []);

  const placeholderDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140">
      <rect width="200" height="140" fill="#f1f5f9"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="12">Image</text>
    </svg>`
  );

  const resolveItemImage = (item) => {
    if (!item) return placeholderDataUrl;
    const direct = item.image_url || item.imageBase64 || item.image || item.img || item.thumbnail;
    if (direct) return direct;
    const keys = [
      item.productId ? `id:${item.productId}` : null,
      item.id ? `id:${item.id}` : null,
      item.sku ? `sku:${String(item.sku).toLowerCase()}` : null,
      item.name ? `name:${String(item.name).toLowerCase()}` : null,
    ].filter(Boolean);
    for (const k of keys) {
      const p = productIndex[k];
      if (p) {
        const src = p.imageBase64 || p.image_url || p.image || p.thumbnail || p.img;
        if (src) return src;
      }
    }
    return placeholderDataUrl;
  };

  useEffect(() => { setOrder(loadOrderSummary(orderId)); }, [orderId]);

  // Realtime simulation: update every 15s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const timeline = useMemo(() => computeStatusTimeline(order?.placedAt || order?.created), [order, tick]);

  const derivedEmail = useMemo(() => {
    if (user?.email) return user.email;
    try {
      const token = localStorage.getItem('token');
      if (token && token.startsWith('__demo_token__')) {
        const id = token.split(':')[1];
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const u = users.find(x => x.id === id);
        return u?.email || 'your registered email';
      }
    } catch { /* ignore: demo fallback resolution */ }
    return 'your registered email';
  }, [user]);

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 border text-center">
          <h2 className="text-2xl font-semibold mb-2">Confirmation</h2>
          <p className="text-slate-600 mb-4">Order not found.</p>
          <Link to="/store" className="px-4 py-2 rounded bg-indigo-600 text-white inline-block">Go to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <CheckoutProgress currentStep={3} />
      <div className="bg-white rounded-xl border p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Order Delivery Confirmation</h1>
        <p className="text-sm leading-relaxed text-slate-700 mb-6">
          Your order items <span className="font-medium">{order.items.map(i => `${i.name} x${i.qty}`).join(', ')}</span> have been confirmed to be delivered!<br />
          A confirmation mail has been sent to <span className="font-semibold text-emerald-600">{derivedEmail}</span> and your registered phone number.<br />
          Track realtime status updates below and receive delivery confirmation via SMS / E‑mail automatically.
        </p>

        {/* Ordered Items Photos */}
        {Array.isArray(order.items) && order.items.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Items in this order</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {order.items.map((item, idx) => {
                const src = resolveItemImage(item);
                const alt = item?.name ? String(item.name) : `Item ${idx+1}`;
                return (
                  <div key={idx} className="group rounded-lg border bg-white overflow-hidden">
                    <div className="relative w-full h-28 bg-slate-50">
                      <img src={src} alt={alt} className="w-full h-full object-cover" />
                      {item?.qty ? (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/70 text-white">
                          ×{item.qty}
                        </div>
                      ) : null}
                    </div>
                    <div className="px-2 py-2">
                      <div className="text-xs font-medium text-slate-800 truncate" title={alt}>{alt}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Realtime Status */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Realtime Order Status</h2>
          <div className="space-y-2">
            {timeline.stages.map(stage => {
              const reached = timeline.elapsedMin >= stage.min;
              const active = timeline.current === stage.key;
              return (
                <div key={stage.key} className={`flex items-center gap-3 p-3 rounded border text-sm transition ${active ? 'bg-emerald-50 border-emerald-400' : reached ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}> 
                  <div className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-600 animate-pulse' : reached ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{stage.label}</div>
                    <div className="text-[11px] text-slate-500">{stage.min === 0 ? 'Just now' : `~${stage.min} min from placement`}</div>
                  </div>
                  {active && <div className="text-[11px] text-emerald-700 font-semibold">LIVE</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500">Status auto-refreshes every 15s. (Simulated timeline)</div>
        </div>

        {/* Track Order CTA */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/track-order/${orderId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-slate-800"
          >
            <span>Track your order</span>
            <span aria-hidden>→</span>
          </button>
        </div>

        {/* Delivery Confirmation */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Delivery Confirmation Alerts</h2>
          <div className="rounded-lg border p-4 bg-slate-50 text-sm text-slate-700">
            <p className="mb-2">You'll receive an SMS and E‑mail when the order transitions to <span className="font-medium">Out for delivery</span> and again when it is <span className="font-medium">Delivered</span>.</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>SMS includes courier name & OTP (if required)</li>
              <li>Email contains invoice + delivery timestamp</li>
              <li>Undelivered attempts trigger a retry notification</li>
              <li>Configure notification preferences in Settings later</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { logout(); navigate('/login'); }} className="px-4 py-2 rounded bg-red-600 text-white text-sm font-medium">Logout</button>
          <button onClick={() => navigate('/store')} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium">Continue Shopping</button>
          <button onClick={() => navigate('/landing')} className="px-4 py-2 rounded border border-slate-300 text-sm font-medium">Go to Landing</button>
          <button onClick={() => navigate(`/order-summary/${orderId}`)} className="px-4 py-2 rounded border border-slate-300 text-sm font-medium">View Order Summary</button>
        </div>
        <div className="mt-6 text-[11px] text-slate-500">Need help? <Link to="/feedback" className="text-indigo-600 hover:underline">Send feedback</Link>.</div>
      </div>
    </div>
  );
}
