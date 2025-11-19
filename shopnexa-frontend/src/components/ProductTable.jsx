import React from "react";

const ProductTable = ({ products = [], onEdit, onDelete, loading = false, skeletonRows = 8 }) => {
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-white/10 rounded-xl shadow-sm overflow-auto" aria-busy={loading}>
      <table className="min-w-full table-auto" aria-label="Products table">
        <thead className="text-left text-xs text-slate-700 uppercase">
          <tr>
            <th className="px-4 py-3">Image</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Stock</th>
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

          {!loading && products.map((p) => (
            <tr key={p.id} className="hover:bg-white/30 transition" data-testid="product-row">
              <td className="px-4 py-3">
                <img
                  src={p.image_url || "/placeholder.png"}
                  alt={p.name ? `Image of ${p.name}` : "Product image"}
                  className="h-12 w-12 object-cover rounded"
                  loading="lazy"
                />
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
              <td className="px-4 py-3 text-slate-600">{p.categories?.name || p.category_name || p.category_id || "-"}</td>
              <td className="px-4 py-3 text-right">₹{p.price}</td>
              <td className="px-4 py-3 text-right">{p.stock}</td>
              <td className="px-4 py-3">{p.seller_type || p.owner_user_id || "-"}</td>
              <td className="px-4 py-3">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}</td>
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
  );
};

export default React.memo(ProductTable);
