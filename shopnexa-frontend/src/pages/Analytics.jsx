import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rangeDays, setRangeDays] = useState(30); // default date range
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [mRes, oRes, uRes, pRes] = await Promise.allSettled([
        api.get("/admin/metrics"),
        api.get("/orders"),
        api.get("/users"),
        api.get("/products"),
      ]);

      if (mRes.status === 'fulfilled') setMetrics(mRes.value?.data?.data || null); else setMetrics(null);
      if (oRes.status === 'fulfilled') {
        const arr = oRes.value?.data?.data ?? []; setRawOrders(Array.isArray(arr) ? arr : []);
      } else {
        // fallback demo orders from localStorage
        try { const demo = JSON.parse(localStorage.getItem('demo_orders')||'[]'); setRawOrders(Array.isArray(demo)?demo:[]); } catch { setRawOrders([]); }
      }
      if (uRes.status === 'fulfilled') {
        const arr = uRes.value?.data?.data ?? []; setUsers(Array.isArray(arr) ? arr : []);
      } else {
        try { const demoUsers = JSON.parse(localStorage.getItem('demo_users')||'[]'); setUsers(Array.isArray(demoUsers)?demoUsers:[]);} catch { setUsers([]);} }
      if (pRes.status === 'fulfilled') {
        const arr = pRes.value?.data?.data ?? []; setProducts(Array.isArray(arr)?arr:[]);
      } else {
        try { const localProducts = JSON.parse(localStorage.getItem('products')||'[]'); setProducts(Array.isArray(localProducts)?localProducts:[]);} catch { setProducts([]);} }

    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Seed demo data (users, products, orders, sessions) for lively analytics & storefront
  const seedDemoData = () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const now = Date.now();
      // Demo Users
      const demoUsers = [
        // Customers (15)
        { id: 'U1', name: 'Aarav', email: 'aarav@example.com', role: 'customer' },
        { id: 'U2', name: 'Diya', email: 'diya@example.com', role: 'customer' },
        { id: 'U6', name: 'Meera', email: 'meera@example.com', role: 'customer' },
        { id: 'U7', name: 'Dev', email: 'dev@example.com', role: 'customer' },
        { id: 'U9', name: 'Nikhil', email: 'nikhil@example.com', role: 'customer' },
        { id: 'U10', name: 'Isha', email: 'isha@example.com', role: 'customer' },
        { id: 'U13', name: 'Tanvi', email: 'tanvi@example.com', role: 'customer' },
        { id: 'U14', name: 'Harsh', email: 'harsh@example.com', role: 'customer' },
        { id: 'U15', name: 'Kunal', email: 'kunal@example.com', role: 'customer' },
        { id: 'U16', name: 'Ananya', email: 'ananya@example.com', role: 'customer' },
        { id: 'U17', name: 'Siddharth', email: 'sid@example.com', role: 'customer' },
        { id: 'U18', name: 'Rhea', email: 'rhea@example.com', role: 'customer' },
        { id: 'U19', name: 'Parth', email: 'parth@example.com', role: 'customer' },
        { id: 'U20', name: 'Tara', email: 'tara@example.com', role: 'customer' },
        { id: 'U21', name: 'Varun', email: 'varun@example.com', role: 'customer' },
        // Retailers (8)
        { id: 'U3', name: 'Rohan', email: 'rohan@example.com', role: 'retailer' },
        { id: 'U4', name: 'Priya', email: 'priya@example.com', role: 'retailer' },
        { id: 'U8', name: 'Saanvi', email: 'saanvi@example.com', role: 'retailer' },
        { id: 'U22', name: 'Ishaan', email: 'ishaan@example.com', role: 'retailer' },
        { id: 'U23', name: 'Neha', email: 'neha@example.com', role: 'retailer' },
        { id: 'U24', name: 'Arjun', email: 'arjun@example.com', role: 'retailer' },
        { id: 'U25', name: 'Simran', email: 'simran@example.com', role: 'retailer' },
        { id: 'U26', name: 'Vivek', email: 'vivek@example.com', role: 'retailer' },
        // Wholesalers (5)
        { id: 'U5', name: 'Kabir', email: 'kabir@example.com', role: 'wholesaler' },
        { id: 'U12', name: 'Ritika', email: 'ritika@example.com', role: 'wholesaler' },
        { id: 'U27', name: 'Salman', email: 'salman@example.com', role: 'wholesaler' },
        { id: 'U28', name: 'Bhavya', email: 'bhavya@example.com', role: 'wholesaler' },
        { id: 'U29', name: 'Reyansh', email: 'reyansh@example.com', role: 'wholesaler' },
        // Admin (excluded from pie chart but retained for system logic)
        { id: 'U11', name: 'Admin', email: 'admin@shopnexa.local', role: 'admin' }
      ];

      // Retailer Profiles (if not existing)
      const retailerProfiles = [
        { retailerId: 'U3', businessName: 'Rohan Electronics', address: 'Bengaluru', categories: ['Electronics','Home'], approved: true },
        { retailerId: 'U4', businessName: 'Priya Fashion', address: 'Mumbai', categories: ['Fashion'], approved: true },
        { retailerId: 'U8', businessName: 'Saanvi Home Essentials', address: 'Delhi', categories: ['Home','Beauty'], approved: true }
      ];
      try {
        const existingProfiles = JSON.parse(localStorage.getItem('retailer_profiles')||'[]');
        const mergedProfiles = [...existingProfiles];
        retailerProfiles.forEach(p=> { if (!mergedProfiles.find(x=>x.retailerId===p.retailerId)) mergedProfiles.push(p); });
        localStorage.setItem('retailer_profiles', JSON.stringify(mergedProfiles));
      } catch {}

      // Placeholder base64 (1x1 png) & simple colored variants
      const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9h1mZt8AAAAASUVORK5CYII=';
      const productsDemo = [
        { id:'P1', retailerId:'U3', name:'Wireless Headphones', sku:'WH-100', price:1999, stock:42, category:'Electronics', imageBase64: transparentPng, published:true, createdAt: now - 86400000*5 },
        { id:'P2', retailerId:'U3', name:'Smart LED Bulb', sku:'SLB-22', price:499, stock:120, category:'Home', imageBase64: transparentPng, published:true, createdAt: now - 86400000*12 },
        { id:'P3', retailerId:'U4', name:'Cotton Kurta', sku:'CK-09', price:899, stock:75, category:'Fashion', imageBase64: transparentPng, published:true, createdAt: now - 86400000*3 },
        { id:'P4', retailerId:'U4', name:'Denim Jacket', sku:'DJ-44', price:1499, stock:33, category:'Fashion', imageBase64: transparentPng, published:true, createdAt: now - 86400000*18 },
        { id:'P5', retailerId:'U8', name:'Ceramic Vase', sku:'CV-12', price:1299, stock:15, category:'Home', imageBase64: transparentPng, published:true, createdAt: now - 86400000*9 },
        { id:'P6', retailerId:'U8', name:'Organic Face Cream', sku:'OFC-05', price:699, stock:58, category:'Beauty', imageBase64: transparentPng, published:true, createdAt: now - 86400000*1 },
        { id:'P7', retailerId:'U3', name:'Bluetooth Speaker', sku:'BS-88', price:2499, stock:27, category:'Electronics', imageBase64: transparentPng, published:true, createdAt: now - 86400000*30 }
      ];

      // Demo Orders - spread across last 90 days
      const demoOrders = [];
      for (let i=0;i<95;i++) {
        const orderDate = new Date(now - i* ( (i%3===0?12:6) ) * 3600 * 1000); // variable spacing
        const items = [];
        const pick = productsDemo[i % productsDemo.length];
        items.push({ name: pick.name, category_name: pick.category, quantity: 1 + (i%2), price: pick.price });
        if (i%4===0) {
          const extra = productsDemo[(i+3)%productsDemo.length];
          items.push({ name: extra.name, category_name: extra.category, quantity: 1, price: extra.price });
        }
        const total = items.reduce((s,x)=> s + x.price * x.quantity, 0);
        const city = ['Bengaluru','Mumbai','Delhi','Kolkata','Chennai','Pune','Hyderabad','Jaipur'][i%8];
        demoOrders.push({ id:`SEED-${1000+i}`, created_at: orderDate.toISOString(), total, status: ['paid','shipped','processing','delivered'][i%4], city, items });
      }

      // Demo Sessions - visits & engagement
      const demoSessions = [];
      for (let i=0;i<250;i++) {
        const start = now - i * 60 * 60 * 1000; // every hour
        demoSessions.push({ start, duration: 2 + (i%10) * 0.7, pages: 1 + (i%7) });
      }

      localStorage.setItem('demo_users', JSON.stringify(demoUsers));
      localStorage.setItem('products', JSON.stringify(productsDemo));
      localStorage.setItem('demo_orders', JSON.stringify(demoOrders));
      localStorage.setItem('demo_sessions', JSON.stringify(demoSessions));

      // Reflect immediately in state (merge instead of skipping when arrays already populated)
      if (!rawOrders.length) setRawOrders(demoOrders);
      else setRawOrders(prev => {
        const existingIds = new Set(prev.map(o=>o.id));
        const merged = [...prev];
        for (const o of demoOrders) if (!existingIds.has(o.id)) merged.push(o);
        return merged;
      });

      setUsers(prev => {
        const map = new Map();
        [...prev, ...demoUsers].forEach(u=> { if (!map.has(u.id)) map.set(u.id,u); });
        return Array.from(map.values());
      });

      setProducts(prev => {
        const map = new Map();
        [...prev, ...productsDemo].forEach(p=> { if (!map.has(p.id)) map.set(p.id,p); });
        return Array.from(map.values());
      });
    } catch (e) {
      console.warn('Seeding failed', e);
    } finally {
      setSeeding(false);
    }
  };

  // DEMO FALLBACKS & DERIVED DATA
  const orders = rawOrders && rawOrders.length ? rawOrders : (() => {
    // create deterministic demo orders if none
    const demo = [];
    const base = Date.now();
    for (let i=0;i<40;i++) {
      const d = new Date(base - i*6*3600*1000);
      demo.push({
        id: `DEMO-${1000+i}`,
        created_at: d.toISOString(),
        total: 200 + (i%7)*50 + (i%3)*35,
        status: ['paid','shipped','processing','delivered'][i%4],
        city: ['Bengaluru','Mumbai','Delhi','Kolkata','Chennai','Pune','Hyderabad'][i%7],
        items: [
          { name: 'Item '+(i%9), category_name: ['Electronics','Fashion','Home','Beauty'][i%4], quantity: 1 + (i%2), price: 199 + (i%5)*20 },
          { name: 'Item '+((i+3)%11), category_name: ['Electronics','Sports','Home'][i%3], quantity: 1, price: 99 + (i%4)*15 }
        ]
      });
    }
    return demo;
  })();

  // Date-range filter applied to orders
  const filteredOrders = useMemo(()=>{
    const cutoff = Date.now() - rangeDays*86400000;
    return orders.filter(o => {
      const t = o.created_at ? Date.parse(o.created_at) : 0;
      return t >= cutoff;
    });
  }, [orders, rangeDays]);

  const roleCounts = useMemo(() => {
    const counts = { customer:0, retailer:0, wholesaler:0, admin:0 };
    for (const u of users||[]) counts[u.role] = (counts[u.role]||0)+1;
    return counts;
  }, [users]);

  const revenueTotal = useMemo(() => filteredOrders.reduce((s,o)=> s + Number(o.total||0),0), [filteredOrders]);
  const avgOrderValue = useMemo(()=> filteredOrders.length? revenueTotal/filteredOrders.length : 0, [filteredOrders, revenueTotal]);

  // Orders by day for trend
  const revenueByDay = useMemo(()=>{
    const map = {};
    for (const o of filteredOrders) {
      const day = o.created_at ? o.created_at.slice(0,10) : 'unknown';
      map[day] = (map[day]||0) + Number(o.total||0);
    }
    return Object.entries(map).sort((a,b)=> a[0].localeCompare(b[0])).map(([date,value])=>({date,value: Number(value.toFixed(2))}));
  }, [filteredOrders]);

  // Frequent order locations
  const ordersByCity = useMemo(()=>{
    const map={};
    for (const o of filteredOrders) { const city = o.city || 'Unknown'; map[city]=(map[city]||0)+1; }
    return Object.entries(map).sort((a,b)=> b[1]-a[1]).map(([city,count])=>({city,count}));
  }, [filteredOrders]);

  // Category velocity (items quantity over recent N orders)
  const categoryVelocity = useMemo(()=>{
    const map={};
    for (const o of filteredOrders) for (const it of (o.items||[])) map[it.category_name||'Unknown']=(map[it.category_name||'Unknown']||0)+ (it.quantity||1);
    return Object.entries(map).sort((a,b)=> b[1]-a[1]).map(([name,qty])=>({name,qty}));
  }, [filteredOrders]);

  // Retailer performance: cross with products local demo
  const retailerProfiles = (()=>{ try { return JSON.parse(localStorage.getItem('retailer_profiles')||'[]'); } catch { return []; } })();
  const retailerPerformance = useMemo(()=>{
    const map={};
    for (const p of products||[]) {
      if (!p.retailerId) continue;
      map[p.retailerId] = map[p.retailerId] || { retailerId: p.retailerId, productCount:0, sampleProducts: [] };
      map[p.retailerId].productCount++;
      if (map[p.retailerId].sampleProducts.length<3) map[p.retailerId].sampleProducts.push(p.name);
    }
    // attach businessName from profiles
    return Object.values(map).map(r => {
      const profile = retailerProfiles.find(x=>x.retailerId===r.retailerId);
      return { ...r, businessName: profile?.businessName || 'Retailer '+r.retailerId };
    }).sort((a,b)=> b.productCount - a.productCount);
  }, [products, retailerProfiles]);

  // Viewer retention (demo sessions)
  const sessionData = (()=>{ try { return JSON.parse(localStorage.getItem('demo_sessions')||'[]'); } catch { return []; } })();
  if (!sessionData.length) {
    // generate synthetic sessions and persist once
    const synth=[]; const now=Date.now();
    for (let i=0;i<120;i++) {
      const start = now - i*45*60*1000;
      const duration = 2 + (i%15) * (0.5 + (i%3)*0.25); // minutes
      const pages = 1 + (i%6);
      synth.push({ start, duration, pages });
    }
    try { localStorage.setItem('demo_sessions', JSON.stringify(synth)); } catch {}
  }
  const sessions = sessionData.length ? sessionData : (()=>{ try { return JSON.parse(localStorage.getItem('demo_sessions')||'[]'); } catch { return []; } })();
  const avgSessionDuration = sessions.length ? sessions.reduce((s,x)=>s+x.duration,0)/sessions.length : 0;
  const avgPagesPerSession = sessions.length ? sessions.reduce((s,x)=>s+x.pages,0)/sessions.length : 0;
  const conversionRate = sessions.length ? (filteredOrders.length / sessions.length) * 100 : 0;

  // Pie data for role distribution
  const rolePie = useMemo(()=>{
    const data=[
      { name: 'Customers', value: roleCounts.customer||0 },
      { name: 'Retailers', value: roleCounts.retailer||0 },
      { name: 'Wholesalers', value: roleCounts.wholesaler||0 }
    ].filter(d=>d.value>0);
    return data.length?data:[{name:'No users', value:1}];
  }, [roleCounts]);

  // Three distinct colors for the three roles (blue, amber, emerald)
  const COLORS=["#2563eb","#f59e0b","#10b981"]; 

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs bg-white/50 backdrop-blur px-2 py-1 rounded border border-white/30">
              <span className="text-slate-500">Range:</span>
              {[7,30,90].map(d => (
                <button
                  key={d}
                  onClick={()=>setRangeDays(d)}
                  className={`px-2 py-0.5 rounded ${rangeDays===d ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >{d}d</button>
              ))}
            </div>
            <button onClick={seedDemoData} disabled={seeding} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">
              {seeding ? 'Seeding…' : 'Seed Demo Data'}
            </button>
            <button onClick={load} disabled={loading} className="px-3 py-1 rounded bg-slate-700 text-white text-sm">Refresh</button>
          </div>
        </header>
        {error && <div className="p-3 rounded bg-red-500/15 border border-red-500 text-red-600 text-sm">{error}</div>}
        {loading && <div className="text-slate-600">Loading...</div>}
        {!loading && (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Revenue" value={`₹${revenueTotal.toFixed(2)}`} />
              <MetricCard title="Orders" value={filteredOrders.length} subtitle={`${orders.length} total`} />
              <MetricCard title="Avg Order Value" value={`₹${avgOrderValue.toFixed(2)}`} />
              <MetricCard title="Users" value={users.length} subtitle={`${roleCounts.customer||0} customers`} />
              <MetricCard title="Retailers" value={roleCounts.retailer||0} subtitle="Active demo retailers" />
              <MetricCard title="Wholesalers" value={roleCounts.wholesaler||0} subtitle="Supply partners" />
              <MetricCard title="Avg Session (min)" value={avgSessionDuration.toFixed(1)} subtitle="Viewer retention" />
              <MetricCard title="Pages / Session" value={avgPagesPerSession.toFixed(1)} subtitle="Engagement" />
              <MetricCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} subtitle="Orders / sessions" />
              <MetricCard title="Distinct Cities" value={ordersByCity.length} subtitle="Geographic footprint" />
              <MetricCard title="Categories (velocity)" value={categoryVelocity.length} subtitle="Active categories" />
              <MetricCard title="Retailer Products" value={products.filter(p=>p.retailerId).length} subtitle="Catalog size" />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
              <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Revenue Trend</h2>
                <LineChart width={480} height={220} data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide={revenueByDay.length>14} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </div>
              <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">User Roles</h2>
                <PieChart width={300} height={220}>
                  <Pie data={rolePie} dataKey="value" nameKey="name" outerRadius={80} label>
                    {rolePie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>
              <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Order Sources (City)</h2>
                <BarChart width={480} height={220} data={ordersByCity.slice(0,10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </div>
            </div>

            {/* CATEGORY VELOCITY & RETAILERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Category Velocity (qty)</h2>
                <ul className="text-xs space-y-1 max-h-64 overflow-auto">
                  {categoryVelocity.map(c=> <li key={c.name} className="flex justify-between"><span>{c.name}</span><span className="font-medium">{c.qty}</span></li>)}
                  {categoryVelocity.length===0 && <li className="text-slate-500">No category data</li>}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Retailer Performance</h2>
                <ul className="text-xs space-y-2 max-h-64 overflow-auto">
                  {retailerPerformance.map(r=> (
                    <li key={r.retailerId} className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{r.businessName}</span>
                        <span className="text-[10px] text-slate-500">ID {r.retailerId}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{r.productCount} products</div>
                        {r.sampleProducts.length>0 && <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{r.sampleProducts.join(', ')}</div>}
                      </div>
                    </li>
                  ))}
                  {retailerPerformance.length===0 && <li className="text-slate-500">No retailer data</li>}
                </ul>
              </div>
            </div>

            {/* RECENT HIGH-VALUE ORDERS */}
            <div className="mt-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent High-Value Orders</h2>
              <ul className="text-xs space-y-2 max-h-72 overflow-auto">
                {filteredOrders.slice().sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).filter(o=>o.total>=500).slice(0,15).map(o=> (
                  <li key={o.id} className="flex justify-between">
                    <span className="flex-1 truncate">{o.id} • {o.city}</span>
                    <span className="text-slate-700 font-medium">₹{Number(o.total).toFixed(2)}</span>
                  </li>
                ))}
                {filteredOrders.length===0 && <li className="text-slate-500">No orders in range</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl bg-white/60 backdrop-blur-md border border-white/30 p-4 shadow flex flex-col">
      <span className="text-xs uppercase tracking-wide text-slate-500">{title}</span>
      <span className="mt-2 text-lg font-semibold text-slate-800">{value}</span>
      {subtitle && <span className="text-[10px] mt-1 text-slate-500">{subtitle}</span>}
    </div>
  );
}
