import React from "react";

import { useMemo, useState } from "react";

const ProductTable = ({ products = [], onEdit, onDelete, loading = false, skeletonRows = 8 }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  const categories = useMemo(() => {
    const set = new Set();
    (products || []).forEach(p => { if (p.category || p.category_name) set.add((p.category || p.category_name).toString()); });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let arr = Array.isArray(products) ? products.slice() : [];
    if (filterCategory !== 'all') arr = arr.filter(p => (p.category || p.category_name) === filterCategory);
    arr.sort((a,b) => {
      const A = (a[sortKey] ?? '').toString();
      const B = (b[sortKey] ?? '').toString();
      if (!isNaN(Number(A)) && !isNaN(Number(B))) {
        return sortAsc ? Number(A) - Number(B) : Number(B) - Number(A);
      }
      return sortAsc ? A.localeCompare(B) : B.localeCompare(A);
    });
    return arr;
  }, [products, filterCategory, sortKey, sortAsc]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const getPlaceholderFor = (category) => {
    if (!category) return '/images/placeholders/default.svg';
    const key = category.toString().toLowerCase().replace(/\s+/g,'-');
    return `/images/placeholders/${key}.svg`;
  };
  const [previewProduct, setPreviewProduct] = useState(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <label className="text-xs">Category:</label>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="px-2 py-1 rounded border bg-white text-sm">
            <option value="all">All</option>
            {categories.map(c=> <option value={c} key={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-sm text-slate-600">Sorted by <strong className="text-slate-800">{sortKey}</strong> {sortAsc? '↑':'↓'}</div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm border border-white/10 rounded-xl shadow-sm overflow-auto" aria-busy={loading}>
      <table className="min-w-full table-auto" aria-label="Products table">
        <thead className="text-left text-xs text-slate-700 uppercase">
          <tr>
            <th className="px-4 py-3">Image</th>
            <th className="px-4 py-3 cursor-pointer" onClick={()=>toggleSort('name')}>Name</th>
            <th className="px-4 py-3 cursor-pointer" onClick={()=>toggleSort('category')}>Category</th>
            <th className="px-4 py-3 text-right cursor-pointer" onClick={()=>toggleSort('price')}>Price</th>
            <th className="px-4 py-3 text-right cursor-pointer" onClick={()=>toggleSort('stock')}>Stock</th>
            <th className="px-4 py-3">Seller</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {loading && products.length === 0 && Array.from({ length: skeletonRows }).map((_, i) => (
            <tr key={`skeleton-${i}`} className="animate-pulse">
              <td className="px-4 py-3"><div className="h-12 w-12 rounded bg-slate-200" /></td>
              <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-slate-200" /></td>
              <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-slate-200" /></td>
              <td className="px-4 py-3 text-right"><div className="h-4 w-14 rounded bg-slate-200 ml-auto" /></td>
              <td className="px-4 py-3 text-right"><div className="h-4 w-12 rounded bg-slate-200 ml-auto" /></td>
              <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-slate-200" /></td>
              <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-slate-200" /></td>
              <td className="px-4 py-3 text-center"><div className="h-4 w-16 rounded bg-slate-200 mx-auto" /></td>
            </tr>
          ))}

          {!loading && filtered.map((p) => (
            <tr key={p.id} className="hover:bg-white/30 transition" data-testid="product-row">
              <td className="px-4 py-3">
                {(() => {
                  const hasImage = !!(p.image_url) || (!!p.imageBase64 && p.imageBase64.length > 200);
                  const src = p.image_url || (hasImage ? p.imageBase64 : getPlaceholderFor(p.category || p.category_name));
                  return (
                    <img
                      src={src}
                      alt={p.name ? `Image of ${p.name}` : "Product image"}
                      className="h-16 w-16 object-cover rounded cursor-pointer"
                      loading="lazy"
                      onClick={() => setPreviewProduct(p)}
                    />
                  );
                })()}
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
              <td className="px-4 py-3 text-slate-600">{p.category || p.category_name || p.categories?.name || p.category_id || "-"}</td>
              <td className="px-4 py-3 text-right">₹{p.price}</td>
              <td className="px-4 py-3 text-right">{p.stock}</td>
              <td className="px-4 py-3">{p.seller_type || p.owner_user_id || p.retailerId || "-"}</td>
              <td className="px-4 py-3">{p.created_at || p.createdAt ? new Date(p.created_at || p.createdAt).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onEdit(p)}
                  className="text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline mr-3 text-xs"
                  aria-label={`Edit product ${p.name}`}
                >Edit</button>
                <button
                  onClick={() => onDelete(p)}
                  className="text-rose-600 hover:text-rose-500 focus:outline-none focus:underline text-xs"
                  aria-label={`Delete product ${p.name}`}
                >Delete</button>
              </td>
            </tr>
          ))}

          {!loading && products.length === 0 && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-slate-600">No products found</td>
            </tr>
          )}
        </tbody>
      </table>
      {loading && products.length > 0 && (
        <div className="p-3 text-xs text-slate-500" role="status">Refreshing products…</div>
      )}
      </div>
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewProduct(null)} />
          <div className="relative bg-white rounded-xl shadow-lg w-[420px] max-w-[95vw] p-5">
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-700"
              aria-label="Close preview"
            >✕</button>
            <div className="flex flex-col gap-3">
              <img
                src={previewProduct.image_url || (previewProduct.imageBase64 && previewProduct.imageBase64.length>200 ? previewProduct.imageBase64 : getPlaceholderFor(previewProduct.category || previewProduct.category_name))}
                alt={previewProduct.name}
                className="w-full h-56 object-contain bg-slate-50 rounded border"
              />
              <h2 className="text-lg font-semibold text-slate-800">{previewProduct.name}</h2>
              <div className="text-sm text-slate-600 space-y-1">
                <p><span className="font-medium">Category:</span> {previewProduct.category || previewProduct.category_name || '-'}</p>
                <p><span className="font-medium">Price:</span> ₹{previewProduct.price}</p>
                <p><span className="font-medium">Stock:</span> {previewProduct.stock}</p>
                {previewProduct.sku && <p><span className="font-medium">SKU:</span> {previewProduct.sku}</p>}
                {previewProduct.retailerId && <p><span className="font-medium">Retailer:</span> {previewProduct.retailerId}</p>}
                {previewProduct.created_at || previewProduct.createdAt ? <p><span className="font-medium">Created:</span> {new Date(previewProduct.created_at || previewProduct.createdAt).toLocaleDateString()}</p> : null}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={()=>{ onEdit(previewProduct); setPreviewProduct(null); }}
                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                >Edit</button>
                <button
                  onClick={()=>{ onDelete(previewProduct); setPreviewProduct(null); }}
                  className="px-3 py-1 rounded bg-rose-600 text-white text-xs"
                >Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProductTable);
