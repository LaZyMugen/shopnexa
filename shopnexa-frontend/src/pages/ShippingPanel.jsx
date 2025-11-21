import { useEffect, useState, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { useNotifications } from '../context/notificationContext.jsx';
import ShippingProgress from '../components/ShippingProgress.jsx';

export default function ShippingPanel(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open:false, order:null, agent:null, revealPhone:false });
  const [message, setMessage] = useState('');
  const { push } = useNotifications();
  const sseRef = useRef(null);

  const [attemptSeed, setAttemptSeed] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    let primary = [];
    try {
      const res = await api.get('/orders');
      primary = Array.isArray(res.data?.data)?res.data.data:[];
    } catch {
      primary = [];
    }
    // If primary empty attempt seed (once)
    if (primary.length === 0 && !attemptSeed) {
      try {
        await api.post('/demo/seed-shipping');
        setAttemptSeed(true);
        const again = await api.get('/orders');
        primary = Array.isArray(again.data?.data)?again.data.data:[];
        if (primary.length) push('Demo shipping orders seeded', { type:'success' });
      } catch (e) {
        push(e.response?.data?.error || 'Seeding failed', { type:'error' });
      }
    }
    // Fallback to demo list if still empty
    if (primary.length === 0) {
      try {
        const fb = await api.get('/demo/shipping-orders');
        const demoData = Array.isArray(fb.data?.data)?fb.data.data:[];
        setOrders(demoData);
      } catch {
        setOrders([]);
      }
    } else {
      setOrders(primary);
    }
    setLoading(false);
  }, [push, attemptSeed]);

  useEffect(()=>{ load(); },[load]);

  // SSE for realtime status + shipper messages
  useEffect(()=>{
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/events';
    const es = new EventSource(url);
    sseRef.current = es;
    es.addEventListener('order-status', evt => {
      try { const p = JSON.parse(evt.data); setOrders(prev => prev.map(o=> o.id===p.id? { ...o, status:p.status } : o)); } catch {}
    });
    es.addEventListener('shipper-message', evt => {
      try { const msg = JSON.parse(evt.data); if (msg?.order_id) {
        // store in local storage history
        const key = 'shipper_messages';
        let hist = []; try { hist = JSON.parse(localStorage.getItem(key)||'[]'); } catch {}
        hist.unshift(msg); hist = hist.slice(0,200);
        try { localStorage.setItem(key, JSON.stringify(hist)); } catch {}
        if (modal.open && modal.order?.id === msg.order_id) {
          // maybe show toast
          push('Shipper acknowledged message (simulated)', { type:'success' });
        }
      }} catch {}
    });
    return () => es.close();
  }, [modal.open, modal.order, push]);

  const buildPhone = (id) => {
    // Deterministic pseudo-random generator for varied digits
    let seed = 0;
    for (let i=0;i<id.length;i++) seed = (seed + id.charCodeAt(i) * (i+3)) % 100000;
    const digits = [];
    for (let i=0;i<10;i++) {
      seed = (seed * 9301 + 49297) % 233280; // LCG
      digits.push(seed % 10);
    }
    // Ensure first digit matches Indian mobile prefixes (6-9)
    digits[0] = (digits[0] % 4) + 6;
    return digits.join('');
  };
  const SHIPPER_NAMES = [
    'MS Enterprises',
    'Bharat Electronics',
    "Priya's Fashion Centre",
    'Shree Logistics',
    'Sai Traders',
    'Ganesh Distributors',
    'Om Express Couriers',
    'Kamal Garments',
    'Vijaya Home Store',
    'Lakshmi Pharma',
    'Royal Footwear',
    'GreenLeaf Organics',
    'Metro Office Supplies',
    'Classic Stationers',
    'Sunrise Mobile Hub',
    'Heritage Textiles',
    'Urban Decor Mart',
    'Velocity Auto Parts',
    'Allied Agro Tools',
    'Himalaya Tea Traders'
  ];
  const deriveShipperName = (orderId) => {
    // Simple stable hash to index into names
    let h = 0;
    for (let i=0;i<String(orderId).length;i++) h = (h * 31 + String(orderId).charCodeAt(i)) >>> 0;
    return SHIPPER_NAMES[h % SHIPPER_NAMES.length];
  };
  const openModal = (order) => {
    const phoneDigits = buildPhone(String(order.id));
    const formatted = `+91 ${phoneDigits.slice(0,5)} ${phoneDigits.slice(5)}`;
    const hash = btoa(String(order.id)).replace(/[^A-Z0-9]/gi,'').slice(0,6).toUpperCase();
  const agentName = deriveShipperName(order.id);
  const agent = { name: agentName, code: hash, phone: formatted, raw: `+91${phoneDigits}` };
    setModal({ open:true, order, agent, revealPhone:false });
    setMessage('');
  };

  const sendMessage = async () => {
    if (!message.trim() || !modal.order) return;
    try {
      await api.post(`/orders/${modal.order.id}/shipper-message`, { message });
      push('Message sent to shipper', { type:'success' });
      setMessage('');
      setModal(m => ({ ...m, open:false }));
    } catch (e) {
      push(e.response?.data?.error || 'Send failed', { type:'error' });
    }
  };

  const stageLabel = (status) => {
    if (status === 'out_for_delivery') return 'Out for delivery';
    if (status === 'completed') return 'Delivered';
    return status.charAt(0).toUpperCase()+status.slice(1).replace(/_/g,' ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Shipping Overview</h1>
        {loading && <div className="text-sm text-slate-500">Loading...</div>}
        <div className="rounded-xl bg-white/70 backdrop-blur p-4 border border-white/30">
          <ul className="divide-y text-sm">
            {orders.map(o => {
              const shipperName = deriveShipperName(o.id);
              return (
                <li key={o.id} className="py-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">Order {o.id}</span>
                      <span className="text-[10px] text-slate-500">{new Date(o.created_at).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500">Status: {stageLabel(o.status)}</span>
                      <span className="text-[10px] text-slate-500">Shipper: {shipperName}</span>
                    </div>
                    <button onClick={()=>openModal(o)} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs">Contact Shipper</button>
                  </div>
                  <ShippingProgress status={o.status} />
                </li>
              );
            })}
            {orders.length===0 && !loading && <li className="py-6 text-center text-slate-500">No orders available</li>}
          </ul>
        </div>
      </div>
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setModal({ open:false, order:null, agent:null })} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Message Shipper</h2>
            <div className="text-xs text-slate-600">Order: {modal.order.id}</div>
            <div className="text-xs text-slate-600">Agent: {modal.agent?.name}</div>
            <div className="text-xs text-slate-600">Phone: {modal.revealPhone ? modal.agent?.phone : '•••••••••• (hidden)'}</div>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} placeholder="Enter message..." className="w-full px-3 py-2 rounded border text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={()=>setModal({ open:false, order:null, agent:null })} className="px-3 py-1 rounded border text-sm">Cancel</button>
              <button disabled={!message.trim()} onClick={sendMessage} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">Send</button>
            </div>
            <div className="pt-2 border-t flex flex-col gap-2">
              {modal.revealPhone && (
                <div className="text-[11px] text-slate-700 bg-red-50 border border-red-200 rounded p-2">
                  Call shipper at <span className="font-mono font-medium">{modal.agent?.raw}</span> now?
                  <div className="mt-2 flex gap-2">
                    <a href={`tel:${modal.agent?.raw}`} className="px-2 py-1 rounded bg-red-600 text-white text-[11px]">Call</a>
                    <button onClick={()=> setModal(m=>({ ...m, revealPhone:false }))} className="px-2 py-1 rounded border border-red-300 text-[11px]">Hide</button>
                  </div>
                </div>
              )}
              {!modal.revealPhone && (
                <button
                  onClick={() => setModal(m => ({ ...m, revealPhone:true }))}
                  className="px-3 py-1 rounded bg-red-600 text-white text-xs font-semibold w-fit"
                >Contact using phone number</button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
