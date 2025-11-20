import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/authContext";
import { Link, useNavigate } from "react-router-dom";

function readProducts() {
  try {
    return JSON.parse(localStorage.getItem('products') || '[]');
  } catch (err) { console.warn('readProducts failed', err); return []; }
}

function writeProducts(arr) {
  try { localStorage.setItem('products', JSON.stringify(arr)); } catch (err) { console.warn('writeProducts failed', err); }
}

export default function ManageMyProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', description: '', imageBase64: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const all = readProducts();
    const mine = all.filter(p => p.retailerId === user.id);
    setProducts(mine);
    setLoading(false);
  }, [user]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">Please sign in.</div>
  );

  if (!(user.role === 'retailer' || user.role === 'wholesaler')) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold">Access denied</h2>
          <p className="mt-2 text-sm text-slate-600">This area is for retailers and wholesalers only.</p>
          <div className="mt-4">
            <Link to="/store" className="px-4 py-2 rounded bg-indigo-600 text-white">Browse store</Link>
          </div>
        </div>
      </div>
    );
  }

  const saveList = (next) => {
    const all = readProducts().filter(p => p.retailerId !== user.id).concat(next);
    writeProducts(all);
    setProducts(next);
  };

  const onSubmit = (e) => {
    e?.preventDefault();
    if (!form.name.trim()) return alert('Please give the product a name');
    const now = new Date().toISOString();
    if (editing) {
      const next = products.map(p => p.id === editing.id ? { ...p, ...form, price: Number(form.price||0), stock: Number(form.stock||0), updatedAt: now, published: (p.published ?? true) } : p);
      saveList(next);
      setEditing(null);
      setForm({ name: '', sku: '', price: '', stock: '', description: '', imageBase64: '' });
      return;
    }
    const id = 'p-' + Date.now();
    const created = { id, retailerId: user.id, ...form, price: Number(form.price||0), stock: Number(form.stock||0), createdAt: now, published: true };
    const next = [created, ...products];
    saveList(next);
    setForm({ name: '', sku: '', price: '', stock: '', description: '', imageBase64: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const onEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name||'', sku: p.sku||'', price: p.price||'', stock: p.stock||'', description: p.description||'', imageBase64: p.imageBase64||'' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    const next = products.filter(x => x.id !== p.id);
    saveList(next);
  };

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, imageBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const filtered = products.filter(p => !query || (p.name || '').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold mb-2">Manage</div>
          <nav className="flex flex-col gap-2 text-sm">
            <button onClick={() => { setEditing(null); setForm({ name: '', sku: '', price: '', stock: '', description: '', imageBase64: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left px-3 py-2 rounded hover:bg-slate-50">Add product</button>
            <Link to="/retailer/dashboard" className="px-3 py-2 rounded hover:bg-slate-50 text-left">Dashboard</Link>
            <Link to="/store" className="px-3 py-2 rounded hover:bg-slate-50 text-left">Public storefront</Link>
          </nav>
        </aside>

        <main>
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-lg font-semibold">Your Products</h2>
            <p className="text-sm text-slate-600">Create and manage items you'll sell on Shopnexa.</p>

            <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs">Name</label>
                <input value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} className="mt-1 w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="text-xs">SKU</label>
                <input value={form.sku} onChange={(e)=>setForm(f=>({...f,sku:e.target.value}))} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-xs">Price (₹)</label>
                <input type="number" value={form.price} onChange={(e)=>setForm(f=>({...f,price:e.target.value}))} className="mt-1 w-full px-3 py-2 border rounded" min={0} step="0.01" />
              </div>
              <div>
                <label className="text-xs">Stock</label>
                <input type="number" value={form.stock} onChange={(e)=>setForm(f=>({...f,stock:e.target.value}))} className="mt-1 w-full px-3 py-2 border rounded" min={0} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs">Description</label>
                <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} rows={3} className="mt-1 w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="text-xs">Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e)=>onFile(e.target.files?.[0])} className="mt-1 w-full" />
                {form.imageBase64 && (
                  <div className="mt-2">
                    <img src={form.imageBase64} alt="preview" className="h-24 w-24 object-cover rounded border" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.published ?? true} onChange={(e)=>setForm(f=>({...f,published:e.target.checked}))} />
                  <span className="text-sm">Published</span>
                </label>
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end mt-2">
                {editing && <button type="button" onClick={()=>{ setEditing(null); setForm({ name: '', sku: '', price: '', stock: '', description: '', imageBase64: '', published: true }); if (fileRef.current) fileRef.current.value = ''; }} className="px-4 py-2 rounded border">Cancel</button>}
                <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white">{editing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search your products..." className="px-3 py-2 border rounded" />
                <div className="text-sm text-slate-600">{filtered.length} item(s)</div>
              </div>
              <div>
                <button onClick={()=>{ const all = readProducts(); const mine = all.filter(p=>p.retailerId===user.id); setProducts(mine); }} className="px-3 py-2 rounded border">Refresh</button>
              </div>
            </div>

            {loading ? (
              <div>Loading…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => (
                  <div key={p.id} className="border rounded p-3 flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className="h-20 w-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {p.imageBase64 ? <img src={p.imageBase64} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">No image</div>}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">SKU: {p.sku || '—'}</div>
                        <div className="mt-2 text-sm">₹{Number(p.price||0).toFixed(2)} · {p.stock ?? 0} in stock</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 items-center">
                      <button onClick={()=>onEdit(p)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Edit</button>
                      <button onClick={()=>onDelete(p)} className="px-3 py-1 rounded border text-sm">Delete</button>
                      <label className="inline-flex items-center gap-2 ml-2 text-sm">
                        <input type="checkbox" checked={p.published ?? true} onChange={(e)=>{
                          const next = products.map(x => x.id === p.id ? { ...x, published: e.target.checked } : x);
                          saveList(next);
                        }} />
                        <span>{(p.published ?? true) ? 'Published' : 'Unpublished'}</span>
                      </label>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-slate-600">No products yet.</div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
