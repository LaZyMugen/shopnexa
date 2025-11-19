import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";

const STATUS_OPTIONS = ["pending", "paid", "shipped", "completed", "cancelled"];
const USE_DEMO = true; // Force demo data only for now

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({}); // orderId -> bool
  const [updatingId, setUpdatingId] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Fetch orders list (summary)
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      if (USE_DEMO) {
        // Skip network and show demo immediately
        setError(false);
        setLoading(false);
        setOrders([]);
        return;
      }
      setLoading(true); setError(false);
      try {
        const res = await api.get("/orders");
        const data = res.data?.data ?? res.data?.data?.data ?? res.data ?? [];
        if (isMounted) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        const msg = e.response?.data?.error || e.message || "Unknown error";
        console.warn("orders fetch error", msg);
        if (isMounted) {
          setError(true);
          setErrorMessage(msg);
          setErrorStatus(e.response?.status || null);
          setOrders([]);
        }
      } finally { if (isMounted) setLoading(false); }
    };
    fetchOrders();
    return () => { isMounted = false; };
  }, [reloadTick]);

  // Inject demo orders if none
  const displayOrders = useMemo(() => {
    // Always use demo list when USE_DEMO is true
    if (!USE_DEMO && orders.length > 0) return orders;
    const now = Date.now();
    const CUSTOMERS = ["Prassad", "Rosy", "Shashwat", "Baka", "Test"];
    const genOrderId = (i) => {
      // Fake stable order ids e.g., SNX-25-11-0001
      const d = new Date(now - i * 3600_000);
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const seq = String(1000 + i).slice(-4);
      return `SNX-${yy}${mm}${dd}-${seq}`;
    };
    const mk = (i, status, amount, custIdx) => ({
      id: genOrderId(i),
      customer_name: CUSTOMERS[custIdx % CUSTOMERS.length],
      total_amount: amount,
      status,
      created_at: new Date(now - i * 3600_000).toISOString(),
      _demo: true,
      _items: [
        { id: `itm-${i}-1`, product_id: `prod-${i}-A`, quantity: 1 + (i % 2), price_each: 199 },
        { id: `itm-${i}-2`, product_id: `prod-${i}-B`, quantity: 2, price_each: 99 }
      ]
    });
    return [
      mk(1, "pending", 398, 0),
      mk(2, "paid", 497, 1),
      mk(3, "shipped", 699, 2),
      mk(4, "completed", 299, 3),
      mk(5, "cancelled", 129, 4),
      mk(6, "paid", 899, 0),
      mk(7, "completed", 1499, 1),
    ];
  }, [orders]);

  // Derived filtered list
  const filtered = useMemo(() => {
    let list = displayOrders;
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.id.toLowerCase().includes(q) || (o.user_id || "").toLowerCase().includes(q));
    }
    return list;
  }, [displayOrders, statusFilter, search]);

  // Expand details: fetch order items if not present
  const toggleExpand = async (order) => {
    setExpanded(prev => ({ ...prev, [order.id]: !prev[order.id] }));
    // if we just expanded and items not loaded (no _items and not demo), fetch
    if (USE_DEMO) return; // no fetch needed
    if (!expanded[order.id] && !order._items && !order.id.startsWith("DEMO")) {
      try {
        const res = await api.get(`/orders/${order.id}`);
        const full = res.data?.data;
        if (full?.order_items) {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, _items: full.order_items } : o));
        }
      } catch (e) { console.warn("order details fetch error", e); }
    }
  };

  // Update status optimistically
  const updateStatus = async (order, newStatus) => {
    if (order.status === newStatus) return;
    setUpdatingId(order.id);
    // optimistic local update
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    try {
      if (!USE_DEMO && !order._demo && !order.id.startsWith("DEMO")) {
        await api.put(`/orders/${order.id}/status`, { status: newStatus });
      }
    } catch (e) {
      console.warn("status update error", e);
      // revert on error
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Manage Orders</h1>
            <p className="text-sm text-slate-600">View, filter, expand and update order statuses.</p>
          </div>
          <button
            onClick={() => setReloadTick(t => t + 1)}
            className="px-3 py-2 rounded-lg text-sm bg-slate-800 text-white hover:bg-slate-700"
          >Refresh</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 bg-white/50 backdrop-blur rounded-xl p-1 border border-white/30">
            {["all", ...STATUS_OPTIONS].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${statusFilter===s?"bg-slate-800 text-white shadow":"text-slate-700 hover:bg-white"}`}
              >{s.charAt(0).toUpperCase()+s.slice(1)}</button>
            ))}
          </div>
          <div className="relative">
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search order id or user id..."
              className="pl-3 pr-10 py-2 rounded-lg bg-white/70 backdrop-blur border border-white/30 text-sm focus:ring-2 focus:ring-sky-200 outline-none"
            />
            {search && (
              <button onClick={()=>setSearch("")} className="absolute right-2 top-2 text-xs text-slate-500 hover:text-slate-700">Clear</button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/60 backdrop-blur border border-white/30 shadow-sm overflow-auto">
          {error && !loading && (
            <div className={`px-4 py-3 border-b flex flex-wrap gap-3 items-center justify-between text-sm ${errorStatus===401?"bg-amber-50 border-amber-200 text-amber-700":"bg-red-50 border-red-200 text-red-700"}`}>
              <span>
                {errorStatus===401 ? (
                  <>Authorization required – please log in. ({errorMessage})</>
                ) : (
                  <>Failed to load orders: {errorMessage}</>
                )}
              </span>
              <div className="flex items-center gap-2">
                {errorStatus===401 && (
                  <button
                    onClick={() => { window.location.href = '/login'; }}
                    className="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >Login</button>
                )}
                <button
                  onClick={() => { setError(false); setReloadTick(t=>t+1); }}
                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                >Retry</button>
                <button
                  onClick={() => { setError(false); /* demo fallback already kicks in */ }}
                  className="px-2 py-1 text-xs rounded bg-slate-800 text-white hover:bg-slate-700"
                >Use Demo Data</button>
              </div>
            </div>
          )}
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-600">Loading orders...</td></tr>
              )}
              {!loading && error && errorStatus!==401 && (
                <tr><td colSpan={6} className="p-6 text-center text-red-600">Error – retry or use demo data above.</td></tr>
              )}
              {!loading && error && errorStatus===401 && (
                <tr><td colSpan={6} className="p-6 text-center text-amber-700">Not authorized – please login or use demo data.</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-600">No orders match current filters.</td></tr>
              )}
              {!loading && !error && filtered.map(o => (
                <>
                  <tr key={o.id} className="hover:bg-white/40 transition">
                    <td className="px-4 py-3 font-medium">{o.id.slice(0,10)}</td>
                    <td className="px-4 py-3">{o.customer_name || o.user_id || '—'}</td>
                    <td className="px-4 py-3">₹{(o.total_amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select
                        disabled={updatingId===o.id}
                        value={o.status}
                        onChange={e=>updateStatus(o, e.target.value)}
                        className="text-xs px-2 py-1 rounded bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={()=>toggleExpand(o)}
                        className="text-xs px-2 py-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                      >{expanded[o.id] ? 'Hide' : 'Details'}</button>
                    </td>
                  </tr>
                  {expanded[o.id] && (
                    <tr className="bg-white/30" key={o.id+"-details"}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="text-xs uppercase font-semibold text-slate-600 mb-2">Items</div>
                        <ul className="space-y-2">
                          {(o._items || []).map(it => (
                            <li key={it.id} className="flex justify-between text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium">{it.product_id}</span>
                                <span className="text-xs text-slate-600">Qty: {it.quantity}</span>
                              </div>
                              <div className="text-sm">₹{(it.price_each * it.quantity).toFixed(2)}</div>
                            </li>
                          ))}
                          {(!o._items || o._items.length === 0) && <li className="text-slate-600 text-sm">No items</li>}
                        </ul>
                        <div className="mt-4 text-sm font-medium">Total: ₹{(o.total_amount ?? 0).toFixed(2)}</div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
