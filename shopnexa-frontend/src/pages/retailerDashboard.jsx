import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from "../context/authContext";
import { Link } from "react-router-dom";
import { useMemo } from "react";

function readLocalOrders() {
  try {
    const a = JSON.parse(localStorage.getItem('demo_orders') || '[]');
    const b = JSON.parse(localStorage.getItem('order_summaries') || '[]');
    return [...a, ...b];
  } catch (err) { console.warn('readLocalOrders failed', err); return []; }
}

function readLocalProducts() {
  try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch (err) { console.warn('readLocalProducts failed', err); return []; }
}

export default function RetailerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  // Load orders & products for metrics
  const orders = useMemo(() => readLocalOrders(), []);
  const myProducts = useMemo(() => {
    const base = readLocalProducts().filter(p => p.retailerId === user?.id);
    // Build virtual proxy products (retailer wholesaler attachments)
    try {
      const links = JSON.parse(localStorage.getItem('retailer_proxy_products') || '[]').filter(l => l.retailerId === user?.id && l.published !== false);
      const wholesaler = JSON.parse(localStorage.getItem('wholesaler_products') || '[]');
      const virtual = links.map(l => {
        const w = wholesaler.find(x => x.id === l.wholesalerProductId);
        if (!w) return null;
        const price = (w.basePrice || w.price || 0) * (1 + (l.marginPercent || 0) / 100);
        return {
          id: `proxy-${user?.id}-${w.id}`,
          name: w.name + ' (Proxy)',
          imageBase64: w.imageBase64,
          retailerId: user?.id,
          proxy: true,
          marginPercent: l.marginPercent,
          sourceWholesalerId: w.id,
          price: Number(price.toFixed(2))
        };
      }).filter(Boolean);
      return [...base, ...virtual];
    } catch {
      return base;
    }
  }, [user]);

  const metrics = useMemo(() => {
    if (!user) return { totalOrders: 0, itemsSold: 0, revenue: 0, topItems: [], topCities: [], productCount: 0, proxyCount: 0 };
    const productIds = new Set(myProducts.map(p => p.id));
    const ordersWithMyItems = [];
    const itemTotals = new Map();
    const cityTotals = new Map();
  let grossRevenue = 0; // full price
  let proxyMarginRevenue = 0; // margin portion for proxy items
    let itemsSold = 0;

          for (const o of orders) {
      let orderHas = false;
      const its = o.items || [];
      for (const it of its) {
        const belongs = (it.retailer && (it.retailer.id === user.id || it.retailer.retailerId === user.id)) || productIds.has(it.id) || productIds.has(it.productId);
        if (belongs) {
          orderHas = true;
          const qty = Number(it.qty || 1);
          const price = Number(it.price || it.total || 0);
          itemsSold += qty;
          // Detect proxy via name suffix or product id pattern
          let marginAdd = 0;
          if (typeof it.name === 'string' && it.name.endsWith('(Proxy)')) {
            const baseName = it.name.replace(/ \(Proxy\)$/,'').trim();
            try {
              const wholesaler = JSON.parse(localStorage.getItem('wholesaler_products')||'[]');
              const w = wholesaler.find(x => x.name === baseName);
              const base = (w?.basePrice || w?.price || 0);
              const marginPerUnit = price - base;
              if (marginPerUnit > 0) marginAdd = marginPerUnit * qty;
            } catch { /* ignore proxy margin calc error */ }
          } else if (it.id && String(it.id).startsWith('proxy-')) {
            // attempt parse of id to find wholesaler product id
            const parts = String(it.id).split('-');
            const wholesalerId = parts[2];
            try {
              const wholesaler = JSON.parse(localStorage.getItem('wholesaler_products')||'[]');
              const w = wholesaler.find(x => x.id === wholesalerId);
              const base = (w?.basePrice || w?.price || 0);
              const marginPerUnit = price - base;
              if (marginPerUnit > 0) marginAdd = marginPerUnit * qty;
            } catch { /* ignore proxy id parse error */ }
          }
          grossRevenue += price * qty;
          proxyMarginRevenue += marginAdd;
          const key = it.id || it.productId || it.name || 'unknown';
          itemTotals.set(key, (itemTotals.get(key) || 0) + qty);
          // improved city extraction: prefer penultimate token unless it's numeric (pincode); fallback to last token
          const addr = (it.selectedLocation && (it.selectedLocation.address || it.selectedLocation.place_name)) || o.shippingAddress || o.destination || o.address || '';
          let city = 'Unknown';
          if (addr && typeof addr === 'string') {
            const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
              // penultimate is often city; if penultimate looks numeric (pincode), choose previous
              const penult = parts[parts.length - 2];
              const last = parts[parts.length - 1];
              const isPenultNumeric = /^\d{3,}$/.test(penult.replace(/\s+/g, ''));
              city = isPenultNumeric && parts.length >=3 ? parts[parts.length - 3] : penult || last || 'Unknown';
            } else if (parts.length === 1) {
              city = parts[0];
            }
          }
          cityTotals.set(city, (cityTotals.get(city) || 0) + qty);
        }
      }
      if (orderHas) ordersWithMyItems.push(o);
    }

  const topItems = Array.from(itemTotals.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>({ id:k, qty:v }));
    const topCities = Array.from(cityTotals.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>({ city:k, qty:v }));

    const proxyCount = myProducts.filter(p => p.proxy).length;
    const directRevenue = grossRevenue - proxyMarginRevenue;
    return { totalOrders: ordersWithMyItems.length, itemsSold, revenue: grossRevenue, proxyMarginRevenue, directRevenue, topItems, topCities, productCount: myProducts.length, proxyCount };
  }, [orders, myProducts, user]);

  // Resolve topItems to product names and thumbnails by joining against products localStorage
  const localProducts = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch { return []; }
  }, []);

  const resolvedTopItems = useMemo(() => {
    return metrics.topItems.map(t => {
      const p = localProducts.find(x => x.id === t.id) || myProducts.find(x => x.id === t.id) || { name: String(t.id), imageBase64: null };
      return { id: t.id, qty: t.qty, name: p.name || String(t.id), image: p.imageBase64 || p.image_url || null };
    });
  }, [metrics.topItems, localProducts, myProducts]);

  // Orders over time for this retailer (14 days window)
  const ordersByDayForMe = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      map[d.toISOString().slice(0,10)] = 0;
    }
    const productIds = new Set(myProducts.map(p => p.id));
    for (const o of orders) {
      const date = o.createdAt || o.created || o.created_at || (new Date()).toISOString();
      const day = new Date(date).toISOString().slice(0,10);
      if (!(day in map)) continue;
      const its = o.items || [];
      let hit = false;
      for (const it of its) {
        const belongs = (it.retailer && (it.retailer.id === user.id || it.retailer.retailerId === user.id)) || productIds.has(it.id) || productIds.has(it.productId);
        if (belongs) { hit = true; break; }
      }
      if (hit) map[day] = (map[day] || 0) + 1;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [orders, myProducts, user]);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('retailer_profiles') || '[]');
      const me = all.find(r => r.retailerId === user?.id);
      setProfile(me || null);
    } catch (err) { console.warn('reading retailer_profiles failed', err); setProfile(null); }
  }, [user]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">Please sign in.</div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Retailer Dashboard</h1>
        {!profile ? (
          <div>
            <p className="text-sm text-gray-600">No onboarding profile found.</p>
            <Link to="/onboarding" className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded">Complete onboarding</Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="text-xs text-gray-500">Business</div>
                <div className="text-lg font-medium">{profile.businessName}</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <div className="text-xs text-slate-500">Contact</div>
                    <div>{profile.phone || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">GSTIN</div>
                    <div>{profile.gstin || '—'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-slate-500">Address</div>
                    <div className="text-sm text-slate-600">{profile.address || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Pincode</div>
                    <div>{profile.pincode || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Categories</div>
                    <div>{(profile.categories || []).join(', ') || '—'}</div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-3">
                {/* Verified badge: small light-green circle with tick */}
                <div className="flex items-center gap-2">
                  { (profile.status === 'approved' || profile.status === 'verified') ? (
                    <>
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">✓</span>
                      <span className="text-sm font-medium text-emerald-700">Verified</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-100 text-yellow-700 text-[10px]">!</span>
                      <span className="text-sm font-medium text-yellow-700">{profile.status || 'Pending'}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-500">Joined</div>
                <div className="text-sm text-slate-700">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded p-4 border">
                <div className="text-xs text-slate-500">Orders</div>
                <div className="text-2xl font-semibold">{metrics.totalOrders}</div>
                <div className="text-sm text-slate-600">orders containing your items</div>
              </div>
              <div className="bg-white rounded p-4 border">
                <div className="text-xs text-slate-500">Items sold</div>
                <div className="text-2xl font-semibold">{metrics.itemsSold}</div>
                <div className="text-sm text-slate-600">units sold</div>
              </div>
              <div className="bg-white rounded p-4 border">
                <div className="text-xs text-slate-500">Gross Revenue</div>
                <div className="text-2xl font-semibold">₹{metrics.revenue.toFixed(2)}</div>
                <div className="text-sm text-slate-600">includes proxy items</div>
              </div>
              <div className="bg-white rounded p-4 border">
                <div className="text-xs text-slate-500">Proxy listings</div>
                <div className="text-2xl font-semibold">{metrics.proxyCount}</div>
                <div className="text-sm text-slate-600">attached wholesaler items</div>
              </div>
              <div className="bg-white rounded p-4 border md:col-span-2">
                <div className="text-xs text-slate-500">Proxy Margin Revenue</div>
                <div className="text-2xl font-semibold">₹{metrics.proxyMarginRevenue.toFixed(2)}</div>
                <div className="text-sm text-slate-600">net margin earned from proxy sales</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded p-4 border">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Top items</div>
                  <div className="text-xs text-slate-500">by units sold</div>
                </div>
                <ul className="mt-3 space-y-2">
                  {metrics.topItems.length === 0 && <li className="text-sm text-slate-500">No sales yet</li>}
                  {resolvedTopItems.map(t => (
                    <li key={t.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {t.image ? <img src={t.image} alt={t.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No image</div>}
                        </div>
                        <div className="text-sm truncate max-w-[220px]">{t.name}</div>
                      </div>
                      <div className="text-sm font-semibold">{t.qty}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded p-4 border">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Top cities</div>
                  <div className="text-xs text-slate-500">where your products sell most</div>
                </div>
                <ul className="mt-3 space-y-2">
                  {metrics.topCities.length === 0 && <li className="text-sm text-slate-500">No data yet</li>}
                  {metrics.topCities.map(c => (
                    <li key={c.city} className="flex items-center justify-between">
                      <div className="text-sm truncate mr-3">{c.city}</div>
                      <div className="text-sm font-semibold">{c.qty}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Orders over time sparkline */}
            <div className="mt-6 bg-white rounded p-4 border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Orders over time</div>
                <div className="text-xs text-slate-500">last 14 days</div>
              </div>
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersByDayForMe}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4">
              <Link to="/manage-products" className="px-4 py-2 bg-emerald-600 text-white rounded mr-2">Add / Manage Products</Link>
              <Link to="/store" className="px-4 py-2 border rounded">View Storefront</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
