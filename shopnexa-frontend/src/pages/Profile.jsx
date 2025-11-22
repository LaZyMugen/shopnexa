import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cartContext";
import { useAuth } from "../context/authContext";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();
  const [profile, setProfile] = useState({ name: "", age: "", location: "" });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [ordersKey, setOrdersKey] = useState(0);

  // Load/save profile details from localStorage (demo)
  useEffect(() => {
    try {
      // Initialize/clear profile to requested defaults:
      // - Name: first part of user's email (before @)
      // - Age: 20
      // - Location: Bits Pilani Hyderabad Campus
      const email = user?.email || '';
      const nameFromEmail = email.includes('@') ? email.split('@')[0] : email;
      const defaults = { name: nameFromEmail || '', age: '20', location: 'Bits Pilani Hyderabad Campus' };
      // Apply defaults and persist them so the UI shows the cleared values immediately
      setProfile(defaults);
      try { localStorage.setItem('user_profile', JSON.stringify(defaults)); } catch (e) { /* ignore storage errors */ }
    } catch (err) {
      console.warn('Failed to initialize user_profile defaults', err);
    }
  }, []);

  const saveProfile = () => {
    try {
      localStorage.setItem("user_profile", JSON.stringify(profile));
    } catch (err) {
      console.warn('Failed to save user_profile to localStorage', err);
    }
    setEditing(false);
    setMessage("Profile saved");
    setTimeout(() => setMessage(""), 1500);
  };

  const orders = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("demo_orders") || "[]");
      // newest first
      return saved.sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
    } catch {
      console.warn('Failed to read demo_orders from localStorage');
      return [];
    }
  }, [ordersKey]);

  const clearAllOrders = () => {
    try {
      if (!window.confirm('Clear all past demo orders? This cannot be undone.')) return;
      localStorage.removeItem('demo_orders');
      setOrdersKey(k => k + 1);
      setMessage('All past orders cleared');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.warn('Failed to clear demo_orders', err);
      setMessage('Failed to clear orders');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const repeatOrder = (order) => {
    if (!order?.items?.length) return;
    order.items.forEach((it) => addItem(it, Math.max(1, it.qty || 1)));
    setMessage("Order items added to cart");
    setTimeout(() => setMessage(""), 2000);
    navigate("/checkout");
  };

  return (
    <div className="profile-page relative min-h-screen text-slate-900 dark:text-white p-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div aria-hidden className="absolute inset-0 -z-10 profile-gradient-light dark:profile-gradient-dark" />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Your Profile</h1>
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">Back</button>
        </div>

        {/* Profile card */}
  <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 ring-1 ring-white/30 shadow p-5 mb-6 text-slate-900 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Basic details</div>
              <div className="text-xs text-slate-600 dark:text-white/60">Used for personalization and delivery</div>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveProfile} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded bg-slate-200 text-slate-800 text-sm">Cancel</button>
              </div>
            )}
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><div className="text-xs text-slate-600 dark:text-white/60">Name</div><div className="text-base font-medium text-slate-900 dark:text-white">{profile.name || "—"}</div></div>
              <div><div className="text-xs text-slate-600 dark:text-white/60">Age</div><div className="text-base font-medium text-slate-900 dark:text-white">{profile.age || "—"}</div></div>
              <div><div className="text-xs text-slate-600 dark:text-white/60">Location</div><div className="text-base font-medium text-slate-900 dark:text-white">{profile.location || "—"}</div></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500" placeholder="Name" value={profile.name} onChange={(e)=>setProfile(p=>({...p,name:e.target.value}))} />
              <input className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500" placeholder="Age" value={profile.age} onChange={(e)=>setProfile(p=>({...p,age:e.target.value}))} />
              <input className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500" placeholder="Location" value={profile.location} onChange={(e)=>setProfile(p=>({...p,location:e.target.value}))} />
            </div>
          )}
          {message && <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{message}</div>}
        </div>

        {/* Orders history */}
  <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 ring-1 ring-white/30 shadow p-5 text-slate-900 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Recent orders</div>
            <div className="flex items-center gap-2">
              <button onClick={clearAllOrders} className="px-2 py-1 rounded bg-red-600 text-white text-sm">Clear orders</button>
            </div>
          </div>
          {orders.length === 0 ? (
            <div className="text-sm text-slate-600 dark:text-white/70">No orders yet. Explore the <button onClick={()=>navigate('/store')} className="underline">store</button>.</div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-white/15 p-4 bg-white/5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left: order meta and subtext */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-slate-900 dark:text-white">Order #{o.id || '—'}</div>
                        <div className="text-sm text-slate-600 dark:text-white/70">{o.created ? new Date(o.created).toLocaleString() : ''}</div>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-white/80 mt-1">Total: ₹{Number(o?.totals?.total || 0).toFixed(2)} • Items: {o?.items?.reduce((s, it)=>s + (it.qty || 0), 0)}</div>
                      {/* subtext details */}
                      <div className="mt-2 text-xs text-slate-600 dark:text-white/70 space-y-1">
                        {o.items?.slice(0,3).map((it) => (
                          <div key={`${o.id}-${it.id}`}>{it.name} × {it.qty} <span className="text-slate-500 dark:text-white/50">{it.retailer?.name ? `• ${it.retailer.name}` : ''}</span></div>
                        ))}
                        {o.items?.length > 3 && (
                          <div>+{o.items.length - 3} more…</div>
                        )}
                        {Number.isFinite(o.estimatedDays) && (
                          <div>Last ETA: {o.estimatedDays} day(s)</div>
                        )}
                      </div>
                    </div>

                    {/* Right: big thumbnails and action */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex -space-x-2">
                        {(o.items||[]).slice(0,4).map((it, idx) => (
                          <img key={idx} src={it.image_url} alt={it.name} className="w-20 h-20 md:w-24 md:h-24 rounded-md border border-white/30 object-cover bg-white" onError={(e)=>{e.currentTarget.style.visibility='hidden';}} />
                        ))}
                        {o.items?.length > 4 && (
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-md border border-white/30 bg-white/70 text-slate-800 flex items-center justify-center text-sm">+{o.items.length-4}</div>
                        )}
                      </div>
                      <button onClick={()=>repeatOrder(o)} className="px-3 py-1.5 rounded bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white text-sm">Repeat order</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
