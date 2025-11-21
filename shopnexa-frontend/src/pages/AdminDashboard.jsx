// AdminDashboard.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { Line, CartesianGrid, XAxis, YAxis, Tooltip, Pie, Cell, LineChart, PieChart } from "recharts";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import QuickOrderForm from "../components/QuickOrderForm.jsx";
import GlassCard from "../components/GlassCard";
import GlassChart from "../components/GlassChart";
import GlassTable from "../components/GlassTable";

const COLORS = ["#2563eb", "#06b6d4", "#f59e0b", "#ef4444", "#7c3aed"];

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const sseRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      // Try to render quickly from session cache (if available)
      try {
        const cachedProducts = sessionStorage.getItem('admin_products_cache');
        const cachedOrders = sessionStorage.getItem('admin_orders_cache');
        if (cachedProducts) setProducts(JSON.parse(cachedProducts));
        if (cachedOrders) setOrders(JSON.parse(cachedOrders));
      } catch (err) {
        console.warn('admin cache read failed', err);
      }

      setLoading(true);
      setProductsError(false);
      setOrdersError(false);
      setUsersError(false);
      setMetricsError(false);

      // Fetch the most critical endpoints first (products + orders) and show UI as soon as they arrive
      const [prodRes, ordRes] = await Promise.allSettled([
        api.get("/products"),
        api.get("/orders"),
      ]);

      if (!isMounted) return;

      if (prodRes.status === "fulfilled") {
        const data = prodRes.value?.data?.data ?? prodRes.value?.data ?? [];
        setProducts(Array.isArray(data) ? data : []);
        try { sessionStorage.setItem('admin_products_cache', JSON.stringify(Array.isArray(data) ? data : [])); } catch (err) { /* ignore */ }
      } else {
        setProductsError(true);
        setProducts([]);
      }

      if (ordRes.status === "fulfilled") {
        const data = ordRes.value?.data?.data ?? ordRes.value?.data ?? [];
        setOrders(Array.isArray(data) ? data : []);
        try { sessionStorage.setItem('admin_orders_cache', JSON.stringify(Array.isArray(data) ? data : [])); } catch (err) { /* ignore */ }
      } else {
        setOrdersError(true);
        setOrders([]);
      }

      // We can now render the page; fetch remaining non-blocking data (users, metrics) in background
      setLoading(false);

      // Fetch users and metrics in background; their results will patch the UI when available
      (async () => {
        const [usrRes, mRes] = await Promise.allSettled([
          api.get('/users'),
          api.get('/admin/metrics'),
        ]);

        if (!isMounted) return;

        if (usrRes.status === 'fulfilled') {
          const data = usrRes.value?.data?.data ?? usrRes.value?.data ?? [];
          setUsers(Array.isArray(data) ? data : []);
        } else {
          setUsersError(true);
          setUsers([]);
        }

        if (mRes.status === 'fulfilled') {
          setMetrics(mRes.value?.data?.data || null);
        } else {
          console.warn('metrics fetch error', mRes.status === 'rejected' ? mRes.reason : 'unknown');
          setMetricsError(true);
          setMetrics(null);
        }
      })();
    };

    fetchAll();
    // Fetch recent feedback initially
    (async () => {
      try {
        const res = await api.get('/products/feedback/recent/list');
        const arr = res.data?.data || [];
        setRecentFeedback(Array.isArray(arr)?arr:[]);
      } catch {/* ignore */}
    })();
    return () => { isMounted = false; };
  }, [reloadTick]);

  // SSE subscription for feedback-new events
  useEffect(() => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/events';
    const es = new EventSource(url);
    sseRef.current = es;
    es.addEventListener('feedback-new', (evt) => {
      try {
        const fb = JSON.parse(evt.data);
        setRecentFeedback(prev => [fb, ...prev].slice(0,20));
      } catch {/* ignore */}
    });
    return () => { es.close(); };
  }, []);

  // Derived metrics
  const totalProducts = metrics?.totalProducts ?? products.length;
  const totalOrders = metrics?.totalOrders ?? orders.length;
  const totalCustomers = metrics?.customerCount ?? users.filter(u => u.role === "customer").length;
  const lowStock = metrics?.lowStock ?? products.filter(p => Number(p.stock ?? 9999) <= 5);

  const ordersByDay = useMemo(() => {
    if (metrics?.salesByDay) return metrics.salesByDay.map(r => ({ date: r.date, count: r.count }));
    const map = {};
    for (const o of orders) {
      const d = o.created_at ? new Date(o.created_at).toISOString().slice(0,10) : null;
      if (!d) continue;
      map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [orders, metrics]);

  const categoryDist = useMemo(() => {
    if (metrics?.categoryDistribution) {
      return metrics.categoryDistribution.map(c => ({ name: c.category_id || "Unknown", count: c.count }));
    }
    const map = {};
    for (const o of orders) {
      for (const it of (o.items || [])) {
        const cat = it.category_name || it.category_id || "Unknown";
        map[cat] = (map[cat] || 0) + (it.quantity || 1);
      }
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [orders, metrics]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);
  }, [orders]);

  // Fallbacks to keep the dashboard informative when there's no data
  const displayOrdersByDay = useMemo(() => {
    if (ordersByDay && ordersByDay.length > 0) return ordersByDay;
    // Generate a simple 14-day demo series
    const arr = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // deterministic small pattern 0-7
      const count = (d.getDate() % 7) + (i % 2);
      arr.push({ date: d.toISOString().slice(0, 10), count });
    }
    return arr;
  }, [ordersByDay]);

  const displayCategoryDist = useMemo(() => {
    if (categoryDist && categoryDist.length > 0) return categoryDist;
    return [
      { name: "Electronics", count: 12 },
      { name: "Fashion", count: 8 },
      { name: "Home", count: 5 },
      { name: "Beauty", count: 4 },
      { name: "Sports", count: 3 },
    ];
  }, [categoryDist]);

  const displayRecentOrders = useMemo(() => {
    if (recentOrders && recentOrders.length > 0) return recentOrders;
    // Demo recent orders
    const now = Date.now();
    const mk = (i, total, status) => ({
      id: `DEMO-${1000 + i}`,
      customer_name: "Guest",
      total,
      status,
      created_at: new Date(now - i * 60 * 60 * 1000).toISOString(),
    });
    return [
      mk(1, 499, "paid"),
      mk(2, 1299, "shipped"),
      mk(3, 799, "processing"),
      mk(4, 2599, "paid"),
      mk(5, 349, "processing"),
    ];
  }, [recentOrders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {loading && (
          <div className="text-center py-10">
            <div className="loader" />
            <p className="text-slate-600">Loading data...</p>
          </div>
        )}

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">Overview</h1>
            <p className="text-sm text-slate-600">ShopNexa Dashboard</p>
          </div>
          {!loading && (productsError || ordersError || usersError || metricsError) && (
            <div className="text-xs text-red-600">
              {productsError && <span className="mr-2">Products failed</span>}
              {ordersError && <span className="mr-2">Orders failed</span>}
              {usersError && <span className="mr-2">Users failed</span>}
              {metricsError && <span className="mr-2">Metrics failed</span>}
              <button
                onClick={() => setReloadTick((t) => t + 1)}
                className="ml-3 px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </header>

        {!loading && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard title="Customers" value={usersError ? "-" : totalCustomers} />
              <GlassCard title="Products" value={productsError ? "-" : totalProducts} />
              <GlassCard title="Orders" value={ordersError ? "-" : totalOrders} />
              <GlassCard title="Low Stock" value={productsError ? "-" : lowStock.length} subtitle="<= 5 units" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassChart title="Orders over time" className="lg:col-span-2">
                <LineChart data={displayOrdersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </GlassChart>

              <GlassChart title="Category distribution">
                <PieChart>
                  <Pie data={displayCategoryDist} dataKey="count" nameKey="name" outerRadius={80} innerRadius={30} label>
                    {displayCategoryDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </GlassChart>
            </div>

            {/* Recent orders + products table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassTable data={displayRecentOrders} title="Recent Orders" />
              <div>
                <div className="mb-3 text-sm text-slate-700 font-medium">Products</div>
                <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 p-4 shadow-sm">
                  <ul className="space-y-3">
                    {!productsError && products.slice(0, 6).map((p) => (
                      <li key={p.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{p.name}</div>
                          <div className="text-xs text-slate-600">Stock: {p.stock}</div>
                        </div>
                        <div className="text-sm text-slate-700">₹{p.price}</div>
                      </li>
                    ))}
                    {productsError && <div className="text-red-600 p-4">Failed to load products.</div>}
                    {!productsError && products.length === 0 && (
                      <div className="text-slate-600 p-4">No products</div>
                    )}
                  </ul>
                </div>
                {/* Local pending products from demo localStorage */}
                <div className="mt-4">
                  <div className="mb-2 text-sm text-slate-700 font-medium">Pending local products (demo)</div>
                  <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 p-4 shadow-sm">
                    <LocalPendingProducts />
                  </div>
                </div>
              </div>
            </div>
            {/* Quick order form */}
            <div className="mt-6">
              <QuickOrderForm />
            </div>

            {/* Recent Feedback */}
            <div className="mt-8">
              <div className="mb-3 text-sm text-slate-700 font-medium">Latest Product Feedback</div>
              <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 p-4 shadow-sm">
                <ul className="space-y-2 max-h-64 overflow-y-auto text-xs">
                  {recentFeedback.map((f,i)=>(
                    <li key={f.created_at+String(i)} className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">Product #{f.product_id}</div>
                        <div className="text-[10px] text-slate-500">{new Date(f.created_at).toLocaleString()}</div>
                        <div className="text-[11px] text-slate-600">Rating: {f.rating}★</div>
                        {f.comment && <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{f.comment}</div>}
                      </div>
                    </li>
                  ))}
                  {recentFeedback.length===0 && <li className="text-slate-500">No feedback yet.</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function LocalPendingProducts() {
  const [local, setLocal] = useState(() => {
    try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch (err) { console.warn('read local products failed', err); return []; }
  });

  const [audit, setAudit] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_audit_log') || '[]'); } catch (err) { console.warn('read admin_audit_log failed', err); return []; }
  });

  const [modal, setModal] = useState({ open: false, action: null, product: null });

  useEffect(() => {
    // keep local updated if other tabs change storage
    const handler = (e) => {
      if (e.key === 'products') {
        try { setLocal(JSON.parse(e.newValue || '[]')); } catch (err) { console.warn('storage parse products failed', err); setLocal([]); }
      }
      if (e.key === 'admin_audit_log') {
        try { setAudit(JSON.parse(e.newValue || '[]')); } catch (err) { console.warn('storage parse admin_audit_log failed', err); setAudit([]); }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const pending = useMemo(() => (local || []).filter(p => p.published === false), [local]);

  const pushAudit = (entry) => {
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ...entry }, ...(audit || [])].slice(0, 200);
    try { localStorage.setItem('admin_audit_log', JSON.stringify(next)); } catch (err) { console.warn('saving admin_audit_log failed', err); }
    setAudit(next);
  };

  const requestApprove = (p) => setModal({ open: true, action: 'approve', product: p });
  const requestRemove = (p) => setModal({ open: true, action: 'remove', product: p });

  const performAction = async () => {
    if (!modal.product) return setModal({ open: false, action: null, product: null });
    const p = modal.product;
    setModal({ open: false, action: null, product: null });

    if (modal.action === 'approve') {
      // update local store
      const next = local.map(it => it.id === p.id ? { ...it, published: true } : it);
  try { localStorage.setItem('products', JSON.stringify(next)); } catch (err) { console.warn('saving products failed', err); }
      setLocal(next);

      // optional server sync
      let syncResult = 'skipped';
      let syncMessage = '';
      try {
        // try to POST to /products (server may dedupe by id)
        const payload = { ...p, published: true };
        await api.post('/products', payload);
        syncResult = 'synced';
      } catch (err) {
        syncResult = 'failed';
        syncMessage = err?.message || String(err);
      }

      pushAudit({ action: 'approve', productId: p.id, productName: p.name, timestamp: new Date().toISOString(), result: syncResult, message: syncMessage });
    }

    if (modal.action === 'remove') {
      const next = local.filter(it => it.id !== p.id);
  try { localStorage.setItem('products', JSON.stringify(next)); } catch (err) { console.warn('saving products failed', err); }
      setLocal(next);
      pushAudit({ action: 'remove', productId: p.id, productName: p.name, timestamp: new Date().toISOString(), result: 'removed', message: '' });
    }
  };

  const clearAudit = () => {
    try { localStorage.removeItem('admin_audit_log'); } catch (err) { console.warn('clearing admin_audit_log failed', err); }
    setAudit([]);
  };

  if (!pending || pending.length === 0) return <div className="text-slate-600">No pending local products</div>;

  return (
    <div>
      <ul className="space-y-3">
        {pending.map(p => (
          <li key={p.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden">
                {p.imageBase64 ? <img src={p.imageBase64} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No image</div>}
              </div>
              <div>
                <div className="font-medium text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-600">By {p.retailerId}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => requestApprove(p)} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Approve</button>
              <button onClick={() => requestRemove(p)} className="px-3 py-1 rounded border text-sm">Remove</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal({ open: false, action: null, product: null })} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
            <h3 className="text-lg font-semibold">Confirm {modal.action === 'approve' ? 'Approve' : 'Remove'}</h3>
            <p className="text-sm text-slate-600 mt-2">Are you sure you want to {modal.action === 'approve' ? 'approve and publish' : 'remove'} <strong>{modal.product?.name}</strong>?</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModal({ open: false, action: null, product: null })} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={performAction} className="px-3 py-1 rounded bg-emerald-600 text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-700 font-medium">Admin audit log</div>
          <div className="text-xs text-slate-500">Recent actions</div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {audit && audit.length > 0 ? audit.map(a => (
            <div key={a.id} className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
              <div className="flex items-center justify-between">
                <div><strong className="text-slate-800">{a.action}</strong> — {a.productName}</div>
                <div className="text-slate-500">{new Date(a.timestamp).toLocaleString()}</div>
              </div>
              <div className="text-xxs text-slate-500">Result: {a.result} {a.message ? ` — ${a.message}` : ''}</div>
            </div>
          )) : <div className="text-xs text-slate-500">No audit entries</div>}
        </div>
        <div className="mt-2 flex justify-end">
          <button onClick={clearAudit} className="text-xs px-2 py-1 rounded border">Clear log</button>
        </div>
      </div>
    </div>
  );
}
