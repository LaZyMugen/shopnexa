// AdminDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { Line, CartesianGrid, XAxis, YAxis, Tooltip, Pie, Cell, LineChart, PieChart } from "recharts";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
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

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setProductsError(false);
      setOrdersError(false);
      setUsersError(false);
      setMetricsError(false);

      const [prodRes, ordRes, usrRes] = await Promise.allSettled([
        api.get("/products"),
        api.get("/orders"),
        api.get("/users"),
      ]);

      if (!isMounted) return;

      if (prodRes.status === "fulfilled") {
        const data = prodRes.value?.data?.data ?? prodRes.value?.data ?? [];
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProductsError(true);
        setProducts([]);
      }

      if (ordRes.status === "fulfilled") {
        const data = ordRes.value?.data?.data ?? ordRes.value?.data ?? [];
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrdersError(true);
        setOrders([]);
      }

      if (usrRes.status === "fulfilled") {
        const data = usrRes.value?.data?.data ?? usrRes.value?.data ?? [];
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsersError(true);
        setUsers([]);
      }

      // Fetch metrics (admin) separately so we can still show base data if it fails
      try {
        const mRes = await api.get("/admin/metrics");
        setMetrics(mRes.data?.data || null);
      } catch (err) {
        console.warn('metrics fetch error', err);
        setMetricsError(true);
        setMetrics(null);
      }

      setLoading(false);
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [reloadTick]);

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
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
