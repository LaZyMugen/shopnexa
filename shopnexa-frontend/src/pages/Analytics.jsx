import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function Analytics() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rangeDays, setRangeDays] = useState(30); // default date range
  const [seeding, setSeeding] = useState(false);
  // local proxy + wholesaler catalogs (demo, client-side)
  const wholesalerProducts = useMemo(() => { try { return JSON.parse(localStorage.getItem('wholesaler_products')||'[]'); } catch { return []; } }, []);
  const proxyLinks = useMemo(() => { try { return JSON.parse(localStorage.getItem('retailer_proxy_products')||'[]'); } catch { return []; } }, []);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [/*mResIgnored*/, oRes, uRes, pRes] = await Promise.allSettled([
        api.get("/admin/metrics"), // optional backend metrics (ignored for now to avoid unused var)
        api.get("/orders"),
        api.get("/users"),
        api.get("/products"),
      ]);

  // backend metrics currently unused; call retained for future expansion
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
      } catch { /* ignore retailer profile seed error */ }

      // Placeholder base64 (1x1 png) & simple colored variants
      const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9h1mZt8AAAAASUVORK5CYII=';
      const placeholderFor = (cat) => {
        if (!cat) return '/images/placeholders/default.svg';
        return '/images/placeholders/' + cat.toLowerCase().replace(/\s+/g,'-') + '.svg';
      };
      const productsDemo = [
        // Furniture
        { id: 'P100', retailerId: 'U3', name: 'Solid Teak Dining Table (6 seater)', sku: 'F-TEAK-6', price: 24999, stock: 8, category: 'Furniture', imageBase64: transparentPng, image_url: placeholderFor('Furniture'), published: true, createdAt: now - 86400000 * 40 },
        { id: 'P101', retailerId: 'U4', name: 'Lounge Sofa 3-seater', sku: 'F-SOFA-3', price: 19999, stock: 5, category: 'Furniture', imageBase64: transparentPng, image_url: placeholderFor('Furniture'), published: true, createdAt: now - 86400000 * 32 },
        { id: 'P102', retailerId: 'U8', name: 'Mid-Century Coffee Table', sku: 'F-CTBL-01', price: 6999, stock: 12, category: 'Furniture', imageBase64: transparentPng, image_url: placeholderFor('Furniture'), published: true, createdAt: now - 86400000 * 28 },
        { id: 'P103', retailerId: 'U3', name: 'Ergonomic Office Chair', sku: 'F-OCH-09', price: 5499, stock: 20, category: 'Furniture', imageBase64: transparentPng, image_url: placeholderFor('Furniture'), published: true, createdAt: now - 86400000 * 6 },
        { id: 'P104', retailerId: 'U4', name: 'Bookshelf (5-tier)', sku: 'F-BKS-05', price: 3999, stock: 14, category: 'Furniture', imageBase64: transparentPng, image_url: placeholderFor('Furniture'), published: true, createdAt: now - 86400000 * 12 },

        // Home decor
  { id: 'P105', retailerId: 'U8', name: 'Handwoven Jute Rug (5x8)', sku: 'D-RUG-JT', price: 2999, stock: 25, category: 'Home Decor', imageBase64: transparentPng, image_url: placeholderFor('Home Decor'), published: true, createdAt: now - 86400000 * 20 },
  { id: 'P106', retailerId: 'U3', name: 'Ceramic Table Lamp', sku: 'D-LAMP-CR', price: 1299, stock: 40, category: 'Home Decor', imageBase64: transparentPng, image_url: placeholderFor('Home Decor'), published: true, createdAt: now - 86400000 * 4 },
  { id: 'P107', retailerId: 'U4', name: 'Framed Wall Art - Abstract', sku: 'D-ART-AB', price: 2199, stock: 18, category: 'Home Decor', imageBase64: transparentPng, image_url: placeholderFor('Home Decor'), published: true, createdAt: now - 86400000 * 16 },
  { id: 'P108', retailerId: 'U8', name: 'Indoor Plant Set (3 pcs)', sku: 'D-PLANT-3', price: 899, stock: 60, category: 'Home Decor', imageBase64: transparentPng, image_url: placeholderFor('Home Decor'), published: true, createdAt: now - 86400000 * 10 },
  { id: 'P109', retailerId: 'U3', name: 'Decorative Mirror (Round)', sku: 'D-MIR-RT', price: 1799, stock: 22, category: 'Home Decor', imageBase64: transparentPng, image_url: placeholderFor('Home Decor'), published: true, createdAt: now - 86400000 * 2 },

        // Dresses & Apparel
  { id: 'P110', retailerId: 'U4', name: 'Silk Sari - Handloom', sku: 'A-SARI-01', price: 4999, stock: 30, category: 'Apparel', imageBase64: transparentPng, image_url: placeholderFor('Apparel'), published: true, createdAt: now - 86400000 * 14 },
  { id: 'P111', retailerId: 'U4', name: 'A-Line Cotton Dress', sku: 'A-DRESS-AL', price: 1499, stock: 45, category: 'Apparel', imageBase64: transparentPng, image_url: placeholderFor('Apparel'), published: true, createdAt: now - 86400000 * 8 },
  { id: 'P112', retailerId: 'U3', name: 'Denim Jeans - Slim Fit', sku: 'A-JEANS-DF', price: 1299, stock: 80, category: 'Apparel', imageBase64: transparentPng, image_url: placeholderFor('Apparel'), published: true, createdAt: now - 86400000 * 22 },
  { id: 'P113', retailerId: 'U8', name: 'Summer Linen Shirt', sku: 'A-SHIRT-LN', price: 899, stock: 70, category: 'Apparel', imageBase64: transparentPng, image_url: placeholderFor('Apparel'), published: true, createdAt: now - 86400000 * 3 },

        // Kitchen & Dining
  { id: 'P114', retailerId: 'U3', name: 'Non-stick Cookware Set (7 pcs)', sku: 'K-COOK-7', price: 3999, stock: 28, category: 'Kitchen', imageBase64: transparentPng, image_url: placeholderFor('Kitchen'), published: true, createdAt: now - 86400000 * 26 },
  { id: 'P115', retailerId: 'U4', name: 'Stainless Steel Dinner Set (24 pcs)', sku: 'K-DIN-24', price: 2999, stock: 15, category: 'Kitchen', imageBase64: transparentPng, image_url: placeholderFor('Kitchen'), published: true, createdAt: now - 86400000 * 11 },
  { id: 'P116', retailerId: 'U8', name: 'Electric Kettle 1.7L', sku: 'K-KET-17', price: 1199, stock: 50, category: 'Kitchen', imageBase64: transparentPng, image_url: placeholderFor('Kitchen'), published: true, createdAt: now - 86400000 * 6 },

        // Bedding & Bath
  { id: 'P117', retailerId: 'U3', name: 'Cotton Bed Sheet Set (King)', sku: 'B-BED-K', price: 2199, stock: 34, category: 'Bedding', imageBase64: transparentPng, image_url: placeholderFor('Bedding'), published: true, createdAt: now - 86400000 * 19 },
  { id: 'P118', retailerId: 'U4', name: 'Memory Foam Pillow', sku: 'B-PIL-MF', price: 1499, stock: 60, category: 'Bedding', imageBase64: transparentPng, image_url: placeholderFor('Bedding'), published: true, createdAt: now - 86400000 * 7 },

        // Electronics & Gadgets
  { id: 'P119', retailerId: 'U3', name: 'Smartwatch (Fitness)', sku: 'E-SW-01', price: 5999, stock: 40, category: 'Electronics', imageBase64: transparentPng, image_url: placeholderFor('Electronics'), published: true, createdAt: now - 86400000 * 13 },
  { id: 'P120', retailerId: 'U4', name: 'Portable Bluetooth Speaker', sku: 'E-SPK-02', price: 2499, stock: 35, category: 'Electronics', imageBase64: transparentPng, image_url: placeholderFor('Electronics'), published: true, createdAt: now - 86400000 * 5 },
  { id: 'P121', retailerId: 'U8', name: 'Wireless Earbuds', sku: 'E-EAR-05', price: 1999, stock: 75, category: 'Electronics', imageBase64: transparentPng, image_url: placeholderFor('Electronics'), published: true, createdAt: now - 86400000 * 2 },

        // Kids & Toys
  { id: 'P122', retailerId: 'U3', name: 'Wooden Toy Train Set', sku: 'T-TRAIN-01', price: 799, stock: 44, category: 'Kids', imageBase64: transparentPng, image_url: placeholderFor('Kids'), published: true, createdAt: now - 86400000 * 15 },
  { id: 'P123', retailerId: 'U4', name: 'Plush Teddy Bear (Large)', sku: 'T-TED-XL', price: 499, stock: 100, category: 'Kids', imageBase64: transparentPng, image_url: placeholderFor('Kids'), published: true, createdAt: now - 86400000 * 9 },

        // Sports & Outdoor
  { id: 'P124', retailerId: 'U8', name: 'Yoga Mat (Eco)', sku: 'S-YOGA-01', price: 999, stock: 60, category: 'Sports', imageBase64: transparentPng, image_url: placeholderFor('Sports'), published: true, createdAt: now - 86400000 * 18 },
  { id: 'P125', retailerId: 'U3', name: 'Mountain Bike - 21 Speed', sku: 'S-BIKE-21', price: 14999, stock: 6, category: 'Sports', imageBase64: transparentPng, image_url: placeholderFor('Sports'), published: true, createdAt: now - 86400000 * 35 },

        // Office & Stationery
  { id: 'P126', retailerId: 'U4', name: 'Executive Notebook (A4)', sku: 'O-NOTE-A4', price: 299, stock: 200, category: 'Office', imageBase64: transparentPng, image_url: placeholderFor('Office'), published: true, createdAt: now - 86400000 * 1 },
  { id: 'P127', retailerId: 'U3', name: 'Ballpoint Pen Set (10)', sku: 'O-PEN-10', price: 149, stock: 300, category: 'Office', imageBase64: transparentPng, image_url: placeholderFor('Office'), published: true, createdAt: now - 86400000 * 2 },

        // Personal Care
  { id: 'P128', retailerId: 'U8', name: 'Herbal Shampoo 500ml', sku: 'PC-SHAM-500', price: 249, stock: 120, category: 'Personal Care', imageBase64: transparentPng, image_url: placeholderFor('Personal Care'), published: true, createdAt: now - 86400000 * 3 },
  { id: 'P129', retailerId: 'U3', name: 'Electric Toothbrush', sku: 'PC-ETB-01', price: 1999, stock: 40, category: 'Personal Care', imageBase64: transparentPng, image_url: placeholderFor('Personal Care'), published: true, createdAt: now - 86400000 * 21 },

        // Seasonal / Gifts
        { id: 'P130', retailerId: 'U4', name: 'Gift Hamper - Gourmet', sku: 'G-HAMP-01', price: 2599, stock: 30, category: 'Gifts', imageBase64: transparentPng, image_url: placeholderFor('Gifts'), published: true, createdAt: now - 86400000 * 17 }
      ];

      // Demo Orders - weighted city distribution for varied sources (deterministic pseudo-random)
      const cityWeights = [
        { city: 'Bengaluru', weight: 18 },
        { city: 'Mumbai', weight: 16 },
        { city: 'Delhi', weight: 14 },
        { city: 'Chennai', weight: 12 },
        { city: 'Hyderabad', weight: 11 },
        { city: 'Kolkata', weight: 10 },
        { city: 'Pune', weight: 9 },
        { city: 'Jaipur', weight: 5 }
      ];
      const totalWeight = cityWeights.reduce((s,c)=>s+c.weight,0);
      const pickWeightedCity = (seedIdx) => {
        // deterministic pseudo random from index
        const seed = (seedIdx*9301 + 49297) % 233280;
        const r = seed / 233280; // 0..1
        let acc = 0;
        for (const c of cityWeights) {
          acc += c.weight / totalWeight;
          if (r <= acc) return c.city;
        }
        return cityWeights[cityWeights.length-1].city;
      };
      const demoOrders = [];
      for (let i=0;i<120;i++) { // slightly more orders for stronger differentiation
        const orderDate = new Date(now - i* ( (i%5===0?18: (i%3===0?12:6)) ) * 3600 * 1000); // variable spacing introduces temporal spread
        const items = [];
        const pick = productsDemo[i % productsDemo.length];
        items.push({ name: pick.name, category_name: pick.category, quantity: 1 + (i%3===0?2:1), price: pick.price });
        if (i%4===0) {
          const extra = productsDemo[(i+5)%productsDemo.length];
          items.push({ name: extra.name, category_name: extra.category, quantity: 1, price: extra.price });
        }
        if (i%11===0) { // occasional third item for richer order composition
          const extra2 = productsDemo[(i+7)%productsDemo.length];
          items.push({ name: extra2.name, category_name: extra2.category, quantity: 1, price: extra2.price });
        }
        const total = items.reduce((s,x)=> s + x.price * x.quantity, 0);
        const city = pickWeightedCity(i);
        demoOrders.push({ id:`SEED-${1000+i}`, created_at: orderDate.toISOString(), total, status: ['paid','shipped','processing','delivered'][i%4], city, items });
      }

      // Demo Sessions - visits & engagement
      const demoSessions = [];
      for (let i=0;i<250;i++) {
        const start = now - i * 60 * 60 * 1000; // every hour
        demoSessions.push({ start, duration: 2 + (i%10) * 0.7, pages: 1 + (i%7) });
      }

      // Ensure seeded products have a visible thumbnail for demo (prefer real image but fall back to category placeholder)
      const ensureImageUrl = (p) => {
        if (p.image_url && p.image_url.trim()) return;
        const cat = (p.category || p.category_name || 'default').toString().toLowerCase().replace(/\s+/g,'-');
        p.image_url = `/images/placeholders/${cat}.svg`;
      };
      productsDemo.forEach(ensureImageUrl);

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
    // fallback deterministic weighted city demo orders
    const cityWeights = [
      { city: 'Bengaluru', weight: 20 },
      { city: 'Mumbai', weight: 15 },
      { city: 'Delhi', weight: 13 },
      { city: 'Chennai', weight: 11 },
      { city: 'Hyderabad', weight: 10 },
      { city: 'Kolkata', weight: 9 },
      { city: 'Pune', weight: 8 },
      { city: 'Jaipur', weight: 6 }
    ];
    const totalWeight = cityWeights.reduce((s,c)=>s+c.weight,0);
    const pickWeightedCity = (seedIdx) => {
      const seed = (seedIdx*1103515245 + 12345) & 0x7fffffff; // LCG
      const r = (seed % 100000) / 100000; // 0..1
      let acc = 0;
      for (const c of cityWeights) {
        acc += c.weight / totalWeight;
        if (r <= acc) return c.city;
      }
      return cityWeights[cityWeights.length-1].city;
    };
    const demo = [];
    const base = Date.now();
    for (let i=0;i<55;i++) {
      const d = new Date(base - i*( (i%4===0?9:6) )*3600*1000);
      const items = [
        { name: 'Item '+(i%9), category_name: ['Electronics','Fashion','Home','Beauty'][i%4], quantity: 1 + (i%3===0?1:0), price: 199 + (i%5)*20 }
      ];
      if (i%5===0) items.push({ name: 'AddOn '+(i%7), category_name: ['Electronics','Sports','Home'][i%3], quantity: 1, price: 99 + (i%4)*15 });
      const total = items.reduce((s,x)=>s + x.price * x.quantity,0);
      demo.push({
        id: `DEMO-${1000+i}`,
        created_at: d.toISOString(),
        total,
        status: ['paid','shipped','processing','delivered'][i%4],
        city: pickWeightedCity(i),
        items
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
  // Proxy metrics: published proxy listings & potential margin revenue (not realized until orders occur)
  const publishedProxyLinks = useMemo(()=> proxyLinks.filter(l => l.published !== false), [proxyLinks]);
  const proxyListingsCount = publishedProxyLinks.length;
  const proxyMarginPotential = useMemo(()=> {
    let sum = 0;
    for (const link of publishedProxyLinks) {
      const w = wholesalerProducts.find(x => x.id === link.wholesalerProductId);
      if (!w) continue;
      const base = (w.basePrice || w.price || 0);
      const margin = base * (link.marginPercent || 0) / 100;
      sum += margin * (w.minQty ? w.minQty : 1); // rough potential based on minQty batch size
    }
    return sum;
  }, [publishedProxyLinks, wholesalerProducts]);
  // Realized proxy margin revenue from filteredOrders (items whose name ends with '(Proxy)')
  const realizedProxyMarginRevenue = useMemo(()=> {
    let sum = 0;
    for (const o of filteredOrders) {
      for (const it of (o.items||[])) {
        if (typeof it.name === 'string' && it.name.endsWith('(Proxy)')) {
          const baseName = it.name.replace(/ \(Proxy\)$/,'').trim();
          const w = wholesalerProducts.find(x => x.name === baseName);
          const base = (w?.basePrice || w?.price || 0);
          const marginPerUnit = (Number(it.price||0) - base);
          if (marginPerUnit > 0) sum += marginPerUnit * (it.quantity||1);
        }
      }
    }
    return sum;
  }, [filteredOrders, wholesalerProducts]);

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
  try { localStorage.setItem('demo_sessions', JSON.stringify(synth)); } catch { /* ignore persist error */ }
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
              <MetricCard title="Proxy Listings" value={proxyListingsCount} subtitle="Published proxies" />
              <MetricCard title="Proxy Potential" value={`₹${proxyMarginPotential.toFixed(0)}`} subtitle="Est. margin capacity" />
              <MetricCard title="Proxy Margin (Realized)" value={`₹${realizedProxyMarginRevenue.toFixed(2)}`} subtitle="From orders" />
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
