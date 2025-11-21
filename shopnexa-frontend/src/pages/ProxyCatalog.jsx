import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { Link } from 'react-router-dom';

function readWholesalerProducts() {
  try { return JSON.parse(localStorage.getItem('wholesaler_products')||'[]'); } catch { return []; }
}
function writeWholesalerProducts(arr) {
  try { localStorage.setItem('wholesaler_products', JSON.stringify(arr)); } catch {}
}
function readProxyLinks() {
  try { return JSON.parse(localStorage.getItem('retailer_proxy_products')||'[]'); } catch { return []; }
}
function writeProxyLinks(arr) {
  try { localStorage.setItem('retailer_proxy_products', JSON.stringify(arr)); } catch {}
}

export default function ProxyCatalog() {
  const { user } = useAuth();
  const [whProducts, setWhProducts] = useState([]);
  const [links, setLinks] = useState([]);
  const [marginInput, setMarginInput] = useState({}); // { wholesalerProductId: value }
  const [filter, setFilter] = useState('');

  // Seed wholesaler catalog if empty (demo)
  useEffect(() => {
    const existing = readWholesalerProducts();
    if (existing.length === 0) {
      const seedNow = Date.now();
      const baseImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAI0lEQVQoU2NkYGD4z0AEMGJgYGBg+M+ACzCqgRgGJAhmA0YBAGM2BAA2DCysAAAAAElFTkSuQmCC';
      const seeded = [
        { id: 'wP1', wholesalerId: 'U5', name: 'Bulk Rice (25kg)', sku: 'BR-25', basePrice: 1100, minQty: 5, category: 'Grocery', imageBase64: baseImg, createdAt: seedNow },
        { id: 'wP2', wholesalerId: 'U12', name: 'Industrial Cleaner (5L)', sku: 'IC-5L', basePrice: 750, minQty: 3, category: 'Industrial', imageBase64: baseImg, createdAt: seedNow },
        { id: 'wP3', wholesalerId: 'U27', name: 'Packaged Almonds (1kg)', sku: 'ALM-1', basePrice: 520, minQty: 10, category: 'Grocery', imageBase64: baseImg, createdAt: seedNow },
        { id: 'wP4', wholesalerId: 'U28', name: 'LED Strip Roll (10m)', sku: 'LED-10', basePrice: 900, minQty: 4, category: 'Electronics', imageBase64: baseImg, createdAt: seedNow },
        { id: 'wP5', wholesalerId: 'U29', name: 'Organic Soap Pack (12)', sku: 'OSP-12', basePrice: 300, minQty: 12, category: 'Beauty', imageBase64: baseImg, createdAt: seedNow },
      ];
      writeWholesalerProducts(seeded);
      setWhProducts(seeded);
    } else {
      setWhProducts(existing);
    }
    setLinks(readProxyLinks());
  }, []);

  const myLinks = useMemo(() => links.filter(l => l.retailerId === user?.id), [links, user]);

  if (!user) return <div className="min-h-screen flex items-center justify-center">Please sign in.</div>;
  if (user.role !== 'retailer') return <div className="p-6">Only retailers can access proxy catalog.</div>;

  const attachProxy = (whId) => {
    const margin = Number(marginInput[whId]);
    const finalMargin = Number.isFinite(margin) && margin > 0 ? margin : 25; // default 25%
    const existing = myLinks.find(l => l.wholesalerProductId === whId);
    let next;
    if (existing) {
      next = links.map(l => l === existing ? { ...l, marginPercent: finalMargin, updatedAt: new Date().toISOString() } : l);
    } else {
      const entry = { id: 'proxy-'+Date.now(), retailerId: user.id, wholesalerProductId: whId, marginPercent: finalMargin, published: true, createdAt: new Date().toISOString() };
      next = [...links, entry];
    }
    writeProxyLinks(next);
    setLinks(next);
  };

  const removeProxy = (whId) => {
    const existing = myLinks.find(l => l.wholesalerProductId === whId);
    if (!existing) return;
    const next = links.filter(l => l !== existing);
    writeProxyLinks(next);
    setLinks(next);
  };

  const visibleWh = whProducts.filter(p => !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Wholesaler Proxy Catalog</h1>
          <div className="flex gap-2">
            <Link to="/retailer/dashboard" className="px-4 py-2 rounded bg-emerald-600 text-white text-sm">Dashboard</Link>
            <Link to="/manage-products" className="px-4 py-2 rounded border text-sm">My Products</Link>
            <Link to="/store" className="px-4 py-2 rounded border text-sm">Storefront</Link>
          </div>
        </div>
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-lg font-medium mb-2">Your Proxy Listings</h2>
          {myLinks.length === 0 && <div className="text-sm text-slate-600">No proxy items yet. Add from the catalog below.</div>}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myLinks.map(link => {
              const p = whProducts.find(w => w.id === link.wholesalerProductId);
              if (!p) return null;
              const proxPrice = (p.basePrice * (1 + link.marginPercent/100)).toFixed(2);
              return (
                <li key={link.id} className="border rounded p-3 bg-slate-50 flex flex-col">
                  <div className="font-medium text-sm line-clamp-2">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Base ₹{p.basePrice.toFixed(2)} · Margin {link.marginPercent}%</div>
                  <div className="text-sm font-semibold mt-1">Listing Price ₹{proxPrice}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={()=>removeProxy(p.id)} className="px-2 py-1 rounded border text-xs">Remove</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Wholesaler Products</h2>
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search catalog..." className="px-3 py-2 border rounded text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWh.map(w => {
              const existing = myLinks.find(l => l.wholesalerProductId === w.id);
              return (
                <div key={w.id} className="border rounded p-3 flex flex-col">
                  <div className="flex-1">
                    <div className="font-medium text-sm line-clamp-2">{w.name}</div>
                    <div className="text-xs text-slate-500 mt-1">SKU {w.sku} · Min Qty {w.minQty}</div>
                    <div className="text-sm font-semibold mt-1">Base Price ₹{w.basePrice.toFixed(2)}</div>
                    <div className="text-xs text-slate-500 mt-1">Category: {w.category}</div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Margin %"
                      value={marginInput[w.id] ?? (existing ? existing.marginPercent : '')}
                      onChange={e=>setMarginInput(m=>({...m,[w.id]: e.target.value}))}
                      className="px-2 py-1 border rounded text-xs"
                    />
                    <button
                      onClick={()=>attachProxy(w.id)}
                      className="px-3 py-1 rounded text-xs text-white bg-emerald-600"
                    >{existing ? 'Update Margin' : 'Add as Proxy'}</button>
                  </div>
                </div>
              );
            })}
            {visibleWh.length === 0 && <div className="text-sm text-slate-600">No wholesaler products match your search.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
