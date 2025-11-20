import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import AdminLayout from "../components/AdminLayout";
import api from "../api/axios";
import { Sun, Database, ToggleLeft } from "lucide-react";

let pkgVersion = undefined;
try {
  // attempt to read package.json version at build time (works with Vite)
  // eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires
  // note: bundlers may inline this; fallback to env var if not available
  // (wrap in try/catch to avoid runtime failures)
  // eslint-disable-next-line no-undef
  // import.meta is not allowed here; we'll try dynamic require via relative path
  // but keep it optional
} catch (err) {
  // ignore
}

export default function Settings() {
  const { user, loading } = useAuth();

  // Admin check: allow only when local admin flag is set or known admin user email
  const adminFlag = localStorage.getItem('admin_auth') === 'true';
  const isAdminUser = user && (user.email === 'shaswatsahoo234@gmail.com');
  if (loading) return <div className="p-6">Loading...</div>;
  if (!adminFlag && !isAdminUser) return <Navigate to="/landing" replace />;
  const [maintenance, setMaintenance] = useState(() => localStorage.getItem('admin_maintenance') === '1');
  const [registrationOpen, setRegistrationOpen] = useState(() => localStorage.getItem('admin_registration_open') !== '0');
  const [demoSync, setDemoSync] = useState(() => localStorage.getItem('admin_demo_sync') === '1');
  const [enableCache, setEnableCache] = useState(() => localStorage.getItem('admin_enable_cache') !== '0');
  const [featureFlags, setFeatureFlags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_feature_flags') || '{}'); } catch (err) { return {}; }
  });

  const [pinging, setPinging] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try { localStorage.setItem('admin_maintenance', maintenance ? '1' : '0'); } catch (err) { console.warn('persist maintenance failed', err); }
  }, [maintenance]);

  useEffect(() => {
    try { localStorage.setItem('admin_registration_open', registrationOpen ? '1' : '0'); } catch (err) { console.warn('persist registration_open failed', err); }
  }, [registrationOpen]);

  useEffect(() => {
    try { localStorage.setItem('admin_demo_sync', demoSync ? '1' : '0'); } catch (err) { console.warn('persist demo_sync failed', err); }
  }, [demoSync]);

  useEffect(() => {
    try { localStorage.setItem('admin_enable_cache', enableCache ? '1' : '0'); } catch (err) { console.warn('persist enable_cache failed', err); }
  }, [enableCache]);

  useEffect(() => {
    try { localStorage.setItem('admin_feature_flags', JSON.stringify(featureFlags || {})); } catch (err) { console.warn('persist feature_flags failed', err); }
  }, [featureFlags]);

  const toggleFlag = (key) => {
    setFeatureFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearCaches = () => {
    try {
      sessionStorage.removeItem('admin_products_cache');
      sessionStorage.removeItem('admin_orders_cache');
      setMessage('Session caches cleared');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.warn('clear caches failed', err);
      setMessage('Failed to clear caches');
      setTimeout(() => setMessage(''), 2500);
    }
  };

  const clearLocalDemoData = () => {
    try {
      localStorage.removeItem('products');
      localStorage.removeItem('admin_audit_log');
      localStorage.removeItem('demo_orders');
      setMessage('Demo local data cleared');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.warn('clear demo data failed', err);
      setMessage('Failed to clear demo data');
      setTimeout(() => setMessage(''), 2500);
    }
  };

  const testPing = async () => {
    setPinging(true);
    setMessage('Pinging server...');
    try {
      const res = await api.get('/admin/metrics');
      setMessage('Server responded');
      console.info('metrics', res.data);
    } catch (err) {
      console.warn('ping failed', err);
      setMessage('Server unreachable');
    }
    setTimeout(() => { setPinging(false); setMessage(''); }, 1200);
  };

  // Environment info
  const env = {
    mode: import.meta.env.MODE,
    apiBase: api.defaults.baseURL,
    viteApi: import.meta.env.VITE_API_URL || 'not set',
    version: import.meta.env.VITE_APP_VERSION || pkgVersion || '0.0.0',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>

        {/* Environment info */}
        <section className="rounded-2xl bg-white/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun />
              <div>
                <div className="font-medium">Environment</div>
                <div className="text-xs text-slate-600">Build and runtime information</div>
              </div>
            </div>
            <div className="text-sm text-slate-700">Mode: <strong>{env.mode}</strong></div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <div>Frontend version: <strong>{env.version}</strong></div>
            <div>API base: <strong className="break-all">{env.apiBase}</strong></div>
            <div>Env var API: <strong>{env.viteApi}</strong></div>
            <div>Cache enabled: <strong>{enableCache ? 'yes' : 'no'}</strong></div>
          </div>
        </section>

        {/* Toggles */}
        <section className="rounded-2xl bg-white/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ToggleLeft />
              <div>
                <div className="font-medium">Configuration toggles</div>
                <div className="text-xs text-slate-600">Control demo and site behavior</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">Persisted to localStorage</div>
          </div>

          <div className="mt-4 space-y-3">
            <ToggleRow label="Maintenance mode" value={maintenance} onChange={() => setMaintenance(v => !v)} desc="Disable customer access for maintenance" />
            <ToggleRow label="Allow registration" value={registrationOpen} onChange={() => setRegistrationOpen(v => !v)} desc="New users can sign up" />
            <ToggleRow label="Demo server sync" value={demoSync} onChange={() => setDemoSync(v => !v)} desc="Attempt to sync approved demo products to server" />
            <ToggleRow label="Enable admin cache" value={enableCache} onChange={() => setEnableCache(v => !v)} desc="Cache products/orders for faster admin load" />
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Feature flags</div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => toggleFlag('newCheckout')} className={`px-3 py-1 rounded ${featureFlags.newCheckout ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-800'}`}>New checkout: {featureFlags.newCheckout ? 'ON' : 'OFF'}</button>
              <button onClick={() => toggleFlag('fastSearch')} className={`px-3 py-1 rounded ${featureFlags.fastSearch ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-800'}`}>Fast search: {featureFlags.fastSearch ? 'ON' : 'OFF'}</button>
              <button onClick={() => toggleFlag('experimentalUi')} className={`px-3 py-1 rounded ${featureFlags.experimentalUi ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-800'}`}>Experimental UI: {featureFlags.experimentalUi ? 'ON' : 'OFF'}</button>
            </div>
          </div>
        </section>

        {/* Utilities */}
        <section className="rounded-2xl bg-white/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Database /><div className="font-medium">Utilities</div></div>
            <div className="text-xs text-slate-500">Admin tools</div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <button onClick={clearCaches} className="px-3 py-1 rounded bg-white/10">Clear session cache</button>
              <div className="text-sm text-slate-600">Removes cached admin snapshots</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={clearLocalDemoData} className="px-3 py-1 rounded bg-white/10">Reset demo local data</button>
              <div className="text-sm text-slate-600">Deletes demo products, orders & audit logs from localStorage</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={testPing} disabled={pinging} className="px-3 py-1 rounded bg-white/10">Ping server</button>
              <div className="text-sm text-slate-600">Test connectivity with API</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { localStorage.removeItem('admin_auth'); setMessage('Admin gate cleared'); setTimeout(()=>setMessage(''),2000); }} className="px-3 py-1 rounded bg-white/10">Clear admin auth</button>
              <div className="text-sm text-slate-600">Revokes admin local flag (force login)</div>
            </div>
            {message && <div className="text-sm text-emerald-600 mt-2">{message}</div>}
          </div>
        </section>

      </div>
    </AdminLayout>
  );
}

function ToggleRow({ label, value, onChange, desc }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">{label}</div>
        {desc && <div className="text-xs text-slate-600">{desc}</div>}
      </div>
      <label className="inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={Boolean(value)} onChange={onChange} className="sr-only" />
        <span className={`${value ? 'bg-emerald-400' : 'bg-gray-400'} w-11 h-6 flex items-center rounded-full p-1 transition-colors`}>
          <span className={`bg-white w-4 h-4 rounded-full shadow-md transform ${value ? 'translate-x-5' : ''}`} />
        </span>
      </label>
    </div>
  );
}
