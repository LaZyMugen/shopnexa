import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { useNotifications } from '../context/notificationContext.jsx';

export default function OrderTracking() {
  const [orders, setOrders] = useState([]); // API orders
  const [offline, setOffline] = useState([]); // offline orders
  const [loading, setLoading] = useState(false);
  const { push } = useNotifications();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      const data = res.data?.data || [];
      setOrders(Array.isArray(data)?data:[]);
    } catch {
      push('Failed to load orders', { type:'error' });
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { try { const arr = JSON.parse(localStorage.getItem('offline_orders')||'[]'); setOffline(Array.isArray(arr)?arr:[]);} catch { /* ignore parse error */ } }, []);

  // Realtime updates via SSE
  const sseRef = useRef(null);
  useEffect(() => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/events';
    const es = new EventSource(url);
    sseRef.current = es;
    es.addEventListener('order-status', (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        setOrders(prev => prev.map(o => o.id === payload.id ? { ...o, status: payload.status } : o));
        push(`Realtime: Order ${payload.id} → ${payload.status}`, { type:'info' });
      } catch {/* ignore parse error */}
    });
    es.addEventListener('delivery-confirmed', (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        push(`Delivery confirmed for order ${payload.id}`, { type:'success' });
      } catch {/* ignore */}
    });
    return () => { es.close(); };
  }, [push]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      push(`Order ${id} -> ${status}`, { type:'success' });
      load();
    } catch { push('Status update failed', { type:'error' }); }
  };

  const cycleOffline = (o) => {
    const map = { scheduled:'pending', pending:'completed', completed:'completed' };
    const ns = map[o.status] || 'completed';
    const next = offline.map(x => x.id===o.id? { ...x, status: ns } : x);
  setOffline(next);
  try { localStorage.setItem('offline_orders', JSON.stringify(next)); } catch { /* ignore persist error */ }
    push(`Offline ${o.id} -> ${ns}`, { type:'info' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Order Tracking</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white/70 backdrop-blur p-4 border border-white/30">
            <h2 className="text-sm font-semibold mb-2">Online Orders</h2>
            {loading && <div className="text-sm text-slate-500">Loading...</div>}
            <ul className="text-xs divide-y max-h-[420px] overflow-auto">
              {orders.map(o => (
                <li key={o.id} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col max-w-[60%]">
                    <span className="font-medium text-slate-700">{o.id}</span>
                    <span className="text-[10px] text-slate-500">{new Date(o.created_at).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">Status: {o.status}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {['pending','paid','shipped','completed','cancelled'].map(s => (
                      <button key={s} onClick={()=>updateStatus(o.id,s)} className={`px-2 py-1 rounded border text-[10px] ${o.status===s?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-600 hover:bg-slate-100'}`}>{s}</button>
                    ))}
                  </div>
                </li>
              ))}
              {orders.length===0 && !loading && <li className="py-6 text-center text-slate-500">No online orders</li>}
            </ul>
          </div>
          <div className="rounded-xl bg-white/70 backdrop-blur p-4 border border-white/30">
            <h2 className="text-sm font-semibold mb-2">Offline / Scheduled Orders</h2>
            <ul className="text-xs divide-y max-h-[420px] overflow-auto">
              {offline.map(o => (
                <li key={o.id} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col max-w-[60%]">
                    <span className="font-medium text-slate-700">{o.id}</span>
                    <span className="text-[10px] text-slate-500">Scheduled: {new Date(o.scheduled_for).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">Status: {o.status}</span>
                    {o.note && <span className="text-[10px] text-slate-500 truncate">Note: {o.note}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>cycleOffline(o)} className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px]">Advance</button>
                  </div>
                </li>
              ))}
              {offline.length===0 && <li className="py-6 text-center text-slate-500">No offline orders</li>}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
