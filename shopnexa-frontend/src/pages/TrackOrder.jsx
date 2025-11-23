import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CheckoutProgress from '../components/CheckoutProgress';

function loadOrderSummary(id) {
  try {
    const all = JSON.parse(localStorage.getItem('order_summaries') || '[]');
    return all.find(o => o.id === id) || null;
  } catch { return null; }
}

function deterministicPick(id, list) {
  if (!list || list.length === 0) return null;
  let h = 0; const s = String(id || '');
  for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) & 0xffffffff;
  const idx = Math.abs(h) % list.length;
  return list[idx];
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showShipper, setShowShipper] = useState(false);

  useEffect(() => { setOrder(loadOrderSummary(orderId)); }, [orderId]);

  const firstItem = order?.items?.[0] || null;

  // Derive the delivery address the same way it was captured before payment
  const address = useMemo(() => {
    if (!order) return '';
    try {
      const items = Array.isArray(order.items) ? order.items : [];
      // Prefer the address provided at checkout on any item
      for (const it of items) {
        const addr = it?.selectedLocation?.address || it?.selectedLocation?.place_name;
        if (addr) return addr;
      }
      // Fallbacks if item-level selection is unavailable
      return order.shippingAddress || order.destination || order.address || 'Address not provided';
    } catch { return 'Address not provided'; }
  }, [order]);

  const warehouse = useMemo(() => {
    const from = (firstItem?.retailer?.city) || (firstItem?.region) || (firstItem?.retailer?.name);
    if (from) return String(from);
    // deterministic nice city fallback
    const cities = ['Bengaluru', 'Delhi NCR', 'Mumbai', 'Hyderabad', 'Chennai', 'Pune'];
    return deterministicPick(orderId, cities) || 'Primary Hub';
  }, [firstItem, orderId]);

  const shipper = useMemo(() => {
    const carriers = [
      { name: 'Delhivery', domain: 'delhivery.example' },
      { name: 'Blue Dart', domain: 'bluedart.example' },
      { name: 'Ecom Express', domain: 'ecomxp.example' },
      { name: 'XpressBees', domain: 'xb.example' },
      { name: 'Shadowfax', domain: 'sfx.example' }
    ];
    const chosen = deterministicPick(orderId, carriers) || carriers[0];
    // Build deterministic Indian mobile number: +91 + 10 digits starting with 6/7/8/9
    let h = 0; const s = String(orderId||'');
    for (let i=0;i<s.length;i++) h = (h*131 + s.charCodeAt(i)) & 0xffffffff;
    const starts = ['6','7','8','9'];
    const start = starts[Math.abs(h) % starts.length];
    let x = Math.abs(h) || 1;
    let digits = start;
    for (let i=0;i<9;i++) { x = (x*1664525 + 1013904223) & 0xffffffff; digits += String(Math.abs(x)%10); }
    const phone = `+91 ${digits}`;
    const email = `${chosen.name.toLowerCase().replace(/\s+/g,'')}@${chosen.domain}`;
    return { ...chosen, phone, email };
  }, [orderId]);

  const etaDays = order?.estimatedDays ?? 5;

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 border text-center">
          <h2 className="text-2xl font-semibold mb-2">Order Tracking</h2>
          <p className="text-slate-600 mb-4">We couldn't find this order.</p>
          <Link to="/store" className="px-4 py-2 rounded bg-indigo-600 text-white inline-block">Go to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <CheckoutProgress currentStep={3} />
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full blur-3xl opacity-60" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold">Track your order</h1>
            <div className="text-xs text-slate-500">Order ID: <span className="font-mono">{orderId}</span></div>
          </div>
          <p className="text-sm text-slate-600 mb-6">Get a quick summary of where your order is headed and who’s delivering it.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">Delivery address</div>
              <div className="mt-1 text-sm font-medium text-slate-800 break-words">{address}</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">Warehouse</div>
              <div className="mt-1 text-sm font-medium text-slate-800">{warehouse}</div>
              <div className="text-[11px] text-slate-500 mt-1">Dispatch center</div>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="text-xs text-slate-500">ETA</div>
              <div className="mt-1 text-sm font-medium text-emerald-700">{etaDays} day(s)</div>
              <div className="text-[11px] text-slate-500 mt-1">Based on distance & handling</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-500">Assigned shipper</div>
                <div className="text-lg font-semibold text-slate-800">{shipper.name}</div>
                <div className="text-[11px] text-slate-500">Standard Service</div>
              </div>
              <button onClick={() => setShowShipper(true)} className="px-4 py-2 rounded-lg bg-black text-white text-sm">Shipper details</button>
            </div>
            {/* Compact items preview */}
            {Array.isArray(order.items) && order.items.length>0 && (
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2">Items in this shipment</div>
                <div className="flex gap-2 overflow-x-auto">
                  {order.items.slice(0,6).map((it, idx) => (
                    <div key={idx} className="w-20 shrink-0">
                      <div className="w-20 h-20 rounded border bg-slate-50 overflow-hidden">
                        {(() => {
                          const src = it.image_url || it.imageBase64 || it.image || it.img || it.thumbnail;
                          return src ? <img src={src} alt={it.name||`Item ${idx+1}`} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-[10px] text-slate-400">No image</div>;
                        })()}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-700 truncate" title={it.name}>{it.name||`Item ${idx+1}`}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => navigate(`/order-confirmation/${orderId}`)} className="px-4 py-2 rounded border border-slate-300 text-sm">Back to Confirmation</button>
            <button onClick={() => navigate('/orders')} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">View Orders</button>
            <button onClick={() => navigate('/store')} className="px-4 py-2 rounded bg-slate-100 text-sm">Continue Shopping</button>
          </div>
        </div>
      </div>

      {/* Shipper Details Modal */}
      {showShipper && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShipper(false)} />
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="rounded-2xl border bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-500">Shipper</div>
                  <div className="text-lg font-semibold">{shipper.name}</div>
                </div>
                <button onClick={() => setShowShipper(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{shipper.phone}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium">{shipper.email}</span></div>
              </div>
              <div className="mt-4 text-xs text-slate-500">For delivery coordination, contact the shipper during working hours (9am – 7pm).</div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowShipper(false)} className="px-4 py-2 rounded bg-black text-white text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
