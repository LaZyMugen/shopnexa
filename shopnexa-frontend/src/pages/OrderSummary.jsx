import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

// Address shape: { id, label, name, line1, city, state, postal, country, created }
function loadAddresses() {
  try { return JSON.parse(localStorage.getItem('saved_addresses') || '[]'); } catch { return []; }
}
function saveAddresses(list) {
  try { localStorage.setItem('saved_addresses', JSON.stringify(list)); } catch {}
}

function loadOrder(id) {
  try {
    const all = JSON.parse(localStorage.getItem('order_summaries') || '[]');
    return all.find(o => o.id === id) || null;
  } catch { return null; }
}

export default function OrderSummary() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [addresses, setAddresses] = useState(() => loadAddresses());
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Form state
  const [form, setForm] = useState({
    label: '',
    name: '',
    line1: '',
    city: '',
    state: '',
    postal: '',
    country: 'India'
  });

  useEffect(() => {
    setOrder(loadOrder(orderId));
  }, [orderId]);

  const totals = useMemo(() => {
    if (!order) return null;
    return order.totals || { items: 0, shipping: 0, total: 0 };
  }, [order]);

  const selectAddress = (id) => {
    setSelectedAddrId(id);
    setSavedMsg('Address selected');
    setTimeout(() => setSavedMsg(''), 1500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const saveAddress = (e) => {
    e.preventDefault();
    // Basic validation
    if (!form.name || !form.line1 || !form.city) {
      setSavedMsg('Fill required fields');
      setTimeout(() => setSavedMsg(''), 1500);
      return;
    }
    setSaving(true);
    const id = `addr-${Date.now()}`;
    const newAddr = { id, ...form, created: new Date().toISOString() };
    const next = [...addresses, newAddr];
    setAddresses(next);
    saveAddresses(next);
    setSelectedAddrId(id);
    setSavedMsg('Address saved');
    setTimeout(() => setSavedMsg(''), 1600);
    setSaving(false);
    // Clear label but keep name for convenience
    setForm(f => ({ ...f, label: '', line1: '', city: '', state: '', postal: '' }));
  };

  const trashAddress = (id) => {
    const next = addresses.filter(a => a.id !== id);
    setAddresses(next);
    saveAddresses(next);
    if (selectedAddrId === id) setSelectedAddrId(null);
  };

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 border text-center">
          <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-slate-600 mb-4">We couldn't find an order with ID <span className="font-mono">{orderId}</span>.</p>
          <Link to="/store" className="px-4 py-2 rounded bg-indigo-600 text-white inline-block">Go to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order Summary</h1>
          <div className="text-sm text-slate-600 mt-1">Order ID: <span className="font-mono">{order.id}</span> • Placed {new Date(order.created).toLocaleString()}</div>
          <div className="text-sm text-slate-600">Estimated delivery: {order.estimatedDays} day(s)</div>
        </div>
        <button onClick={() => navigate('/store')} className="px-4 py-2 rounded bg-slate-100 text-sm">Back to Store</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-3">Items</h2>
            <div className="divide-y">
              {order.items.map(it => (
                <div key={it.id} className="py-3 flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-slate-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 flex flex-wrap items-center gap-2">
                      {it.name}
                      <span className="text-xs text-slate-500">x{it.qty}</span>
                      {isFinite(it.deliveryDays) && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">ETA {it.deliveryDays}d</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{it.region ? `Origin: ${it.region}` : (it.retailer?.name ? `Ships from ${it.retailer.name}` : 'Origin: N/A')}</div>
                  </div>
                  <div className="text-right min-w-[90px]">
                    <div className="text-sm font-semibold">₹{(Number(it.price||0)*(it.qty||0)).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-600">Subtotal: ₹{(totals.items).toFixed(2)} • Shipping: ₹{(totals.shipping).toFixed(2)}</div>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-3">Saved Addresses</h2>
            {addresses.length === 0 && <div className="text-sm text-slate-500 mb-3">No saved addresses yet.</div>}
            <div className="space-y-2 mb-4">
              {addresses.map(a => (
                <button
                  key={a.id}
                  onClick={() => selectAddress(a.id)}
                  className={`w-full text-left px-3 py-2 rounded border text-sm transition ${selectedAddrId === a.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{a.label || a.name}</div>
                      <div className="text-xs text-slate-600">{a.line1}, {a.city}{a.state?`, ${a.state}`:''}</div>
                      <div className="text-[11px] text-slate-500">{a.postal} {a.country}</div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); trashAddress(a.id); }} className="text-[11px] text-red-600">Remove</button>
                  </div>
                  {selectedAddrId === a.id && <div className="mt-1 text-[11px] text-emerald-600">Address selected</div>}
                </button>
              ))}
            </div>
            <form onSubmit={saveAddress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input name="label" value={form.label} onChange={handleChange} placeholder="Label (Home)" className="input" />
                <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name*" className="input" />
                <input name="line1" value={form.line1} onChange={handleChange} placeholder="Address Line*" className="input col-span-2" />
                <input name="city" value={form.city} onChange={handleChange} placeholder="City*" className="input" />
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="input" />
                <input name="postal" value={form.postal} onChange={handleChange} placeholder="Postal Code" className="input" />
                <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="input" />
              </div>
              <button disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              {savedMsg && <div className="text-xs text-indigo-600">{savedMsg}</div>}
            </form>
          </div>
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          <div className="bg-white rounded-lg border p-4 sticky top-6">
            <h2 className="text-lg font-medium mb-3">Total</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Items</span><span>₹{(totals.items).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>₹{(totals.shipping).toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 border-t font-semibold text-base"><span>Grand Total</span><span>₹{(totals.total).toFixed(2)}</span></div>
            </div>
            <div className="mt-4">
              <button
                disabled={!selectedAddrId}
                onClick={() => {
                  if (!selectedAddrId) return;
                  navigate(`/payment/${order.id}`);
                }}
                className={`w-full px-4 py-2 rounded text-sm font-medium transition
                  ${selectedAddrId ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
              >Proceed to Buy</button>
              {selectedAddrId && <div className="mt-2 text-[11px] text-emerald-600">Address selected. You can proceed.</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Basic input tailwind utility classes reused inline
// In a real project you'd consolidate these into a global style or component.
