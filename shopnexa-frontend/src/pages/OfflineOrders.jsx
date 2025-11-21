import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNotifications } from '../context/notificationContext.jsx';

export default function OfflineOrders() {
  const [scheduled, setScheduled] = useState([]);
  const [when, setWhen] = useState(''); // datetime-local value
  const [note, setNote] = useState('');
  const [items, setItems] = useState(''); // comma separated productId:qty
  const { push } = useNotifications();

  // Load existing
  useEffect(() => {
    try { const arr = JSON.parse(localStorage.getItem('offline_orders')||'[]'); setScheduled(Array.isArray(arr)?arr:[]); } catch { /* ignore */ }
  }, []);

  const saveAll = (arr) => {
    setScheduled(arr);
    try { localStorage.setItem('offline_orders', JSON.stringify(arr)); } catch { /* ignore */ }
  };

  // Reminder poll (every minute)
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const updated = scheduled.map(o => {
        if (o.status === 'scheduled' && !o.reminderSent && o.scheduled_for && Date.parse(o.scheduled_for) - now < 30*60*1000 && Date.parse(o.scheduled_for) > now) {
          push(`Offline order ${o.id} starts in <30m`, { type:'info' });
          changed = true;
          return { ...o, reminderSent: true };
        }
        return o;
      });
      if (changed) saveAll(updated);
    }, 60000);
    return () => clearInterval(id);
  }, [scheduled, push]);

  const schedule = () => {
    if (!when) { push('Select date/time', { type:'error' }); return; }
    const dt = new Date(when);
    if (isNaN(dt.getTime())) { push('Invalid datetime', { type:'error' }); return; }
    const id = 'OFF-' + dt.getTime();
    // parse items
    const parsedItems = items.split(',').map(seg => {
      const [pid, qtyStr] = seg.trim().split(':');
      const qty = Math.max(parseInt(qtyStr||'1',10),1);
      return pid ? { product_id: pid, quantity: qty } : null;
    }).filter(Boolean);
    const order = { id, scheduled_for: dt.toISOString(), created_at: new Date().toISOString(), status:'scheduled', note, items: parsedItems, reminderSent:false };
    const next = [...scheduled, order].sort((a,b)=> new Date(a.scheduled_for)-new Date(b.scheduled_for));
    saveAll(next);
    push('Offline order scheduled', { type:'success' });
    setWhen(''); setNote(''); setItems('');
  };

  const advance = (o) => {
    const map = { scheduled:'pending', pending:'completed', completed:'completed' };
    const nextStatus = map[o.status] || 'completed';
    const next = scheduled.map(x => x.id===o.id? { ...x, status: nextStatus } : x);
    saveAll(next);
    push(`Order ${o.id} -> ${nextStatus}`, { type:'info' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Offline Orders</h1>
        <div className="rounded-xl bg-white/70 backdrop-blur p-4 border border-white/30 space-y-3">
          <h2 className="text-sm font-semibold">Schedule Offline Order</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <label className="text-xs font-medium">When</label>
              <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="mt-1 px-2 py-1 rounded border" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium">Items (prodId:qty, comma)</label>
              <input value={items} onChange={e=>setItems(e.target.value)} placeholder="P100:2,P101:1" className="mt-1 px-2 py-1 rounded border" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="text-xs font-medium">Note</label>
              <input value={note} onChange={e=>setNote(e.target.value)} className="mt-1 px-2 py-1 rounded border" />
            </div>
          </div>
          <button onClick={schedule} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Schedule</button>
        </div>

        <div className="rounded-xl bg-white/70 backdrop-blur p-4 border border-white/30">
          <h2 className="text-sm font-semibold mb-2">Upcoming / Scheduled</h2>
          <ul className="text-xs divide-y">
            {scheduled.length===0 && <li className="py-6 text-center text-slate-500">No offline orders</li>}
            {scheduled.map(o => (
              <li key={o.id} className="py-2 flex items-center justify-between">
                <div className="flex flex-col max-w-[60%]">
                  <span className="font-medium text-slate-700">{o.id}</span>
                  <span className="text-[10px] text-slate-500">{new Date(o.scheduled_for).toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500">Status: {o.status}</span>
                  {o.note && <span className="text-[10px] text-slate-500 truncate">Note: {o.note}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>advance(o)} className="px-2 py-1 rounded bg-emerald-600 text-white">Next</button>
                  <button onClick={()=>saveAll(scheduled.filter(x=>x.id!==o.id))} className="px-2 py-1 rounded bg-rose-600 text-white">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
