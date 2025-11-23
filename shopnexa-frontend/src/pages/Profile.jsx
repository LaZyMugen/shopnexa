import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "Shashwat Sahoo", age: "20", location: "Bits Pilani Hyderabad Campus" });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState([]); // real placed orders from order_summaries
  const [productIndex, setProductIndex] = useState({}); // id -> product for image fallback
  const placeholderDataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#64748b">IMG</text></svg>');

  // Load placed orders from order_summaries (remove all demo_orders usage)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('order_summaries') || '[]');
      const normalized = Array.isArray(raw) ? raw : [];
      // Only include orders that are actually placed (status === 'placed') if status exists
      const placed = normalized.filter(o => !o.status || o.status === 'placed');
      placed.sort((a,b) => new Date(b.placedAt || b.created || 0) - new Date(a.placedAt || a.created || 0));
      setOrders(placed);
    } catch {
      setOrders([]);
    }
  }, []);

  // Limit display (e.g. last 12)
  const recentOrders = useMemo(() => orders.slice(0, 12), [orders]);

  // Build a quick lookup of products for image fallback
  useEffect(() => {
    try {
      const prods = JSON.parse(localStorage.getItem('products') || '[]');
      const map = {};
      if (Array.isArray(prods)) {
        for (const p of prods) map[p.id] = p;
      }
      setProductIndex(map);
    } catch { setProductIndex({}); }
  }, []);

  // Load/save profile details from localStorage (demo)
  useEffect(() => {
    // Force profile name override irrespective of stored value.
    const overridden = { name: "Shashwat Sahoo", age: profile.age, location: profile.location };
    setProfile(overridden);
    try { localStorage.setItem('user_profile', JSON.stringify(overridden)); } catch {/* ignore */}
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

        {/* Quick link to latest confirmation/tracking */}
        <div className="mb-6">
          <button
            onClick={() => {
              const latestId = orders?.[0]?.id;
              if (latestId) {
                navigate(`/order-confirmation/${latestId}`);
              } else {
                navigate('/orders');
              }
            }}
            className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
          >
            view confirmed live order and tracking details
          </button>
        </div>

        {/* Placed Orders (with product images) */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 ring-1 ring-white/30 shadow p-5 mb-6 text-slate-900 dark:text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Your Orders</div>
              <div className="text-xs text-slate-600 dark:text-white/60">Orders you've placed (latest first)</div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm"
            >View All</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-sm text-slate-600 dark:text-white/60">No orders yet. Place an order to see it here.</div>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map(o => {
                const created = o.placedAt || o.created || null;
                const total = typeof o.total === 'number' ? o.total : (o.totals?.finalTotal || o.totals?.items || 0);
                const status = o.status || 'placed';
                const items = Array.isArray(o.items) ? o.items : [];
                return (
                  <li key={o.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-4">
                    <div className="flex -space-x-2 overflow-hidden">
                      {items.slice(0,4).map((it, idx) => {
                        const prod = productIndex[it.id];
                        const img = it.image_url || it.imageBase64 || it.image || it.img || it.thumbnail || prod?.imageBase64 || prod?.image_url || placeholderDataUri;
                        const name = it.name || it.title || `Item ${idx+1}`;
                        return (
                          <img
                            key={idx}
                            src={img}
                            alt={name}
                            title={name}
                            className="w-14 h-14 object-cover rounded-lg ring-2 ring-white/20 bg-slate-200 dark:bg-slate-700"
                            onError={(e)=>{ e.currentTarget.src = placeholderDataUri; }}
                          />
                        );
                      })}
                      {items.length === 0 && (
                        <div className="w-14 h-14 flex items-center justify-center text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 rounded-lg">No Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">Order #{o.id}</div>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-800 capitalize">{status}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-white/60 mb-1">
                        {created ? new Date(created).toLocaleString() : 'Date unknown'} · {items.length} item(s)
                      </div>
                      <div className="text-sm font-medium text-emerald-600">₹{total.toFixed(2)}</div>
                      {items.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-white/50">
                          {items.slice(0,6).map((it, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white/10 border border-white/10 truncate max-w-[120px]" title={it.name || it.title}>{it.name || it.title || 'Item'}</span>
                          ))}
                          {items.length > 6 && <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10">+{items.length - 6} more</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-end md:items-center gap-2 md:flex-col md:justify-between">
                      <button
                        onClick={() => navigate(`/order-confirmation/${o.id}`)}
                        className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-medium"
                      >Details</button>
                      <button
                        onClick={() => navigate('/store')}
                        className="px-3 py-1.5 rounded border border-white/20 text-xs font-medium"
                      >Shop Again</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
