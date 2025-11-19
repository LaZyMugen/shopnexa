import { useEffect, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/metrics");
      setMetrics(res.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>
          <button onClick={load} disabled={loading} className="px-3 py-1 rounded bg-slate-700 text-white text-sm">Refresh</button>
        </header>
        {error && <div className="p-3 rounded bg-red-500/15 border border-red-500 text-red-600 text-sm">{error}</div>}
        {loading && <div className="text-slate-600">Loading...</div>}
        {!loading && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Revenue" value={`₹${metrics.revenue.toFixed(2)}`}/>
            <MetricCard title="Orders" value={metrics.totalOrders} />
            <MetricCard title="Products" value={metrics.totalProducts} />
            <MetricCard title="Customers" value={metrics.customerCount} />
            <MetricCard title="Low Stock" value={metrics.lowStock.length} />
          </div>
        )}
        {!loading && metrics && (
          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Sales By Day</h2>
              <ul className="text-xs space-y-1">
                {metrics.salesByDay.map(r => <li key={r.date}>{r.date}: {r.count}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white/60 backdrop-blur-md border border-white/30 p-4 shadow flex flex-col">
      <span className="text-xs uppercase tracking-wide text-slate-500">{title}</span>
      <span className="mt-2 text-lg font-semibold text-slate-800">{value}</span>
    </div>
  );
}
