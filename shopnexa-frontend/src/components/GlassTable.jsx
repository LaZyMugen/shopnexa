// GlassTable.jsx
import React from "react";

const Row = ({ order }) => (
  <tr className="hover:bg-white/30 transition">
    <td className="px-4 py-3 text-sm font-medium">{order.id?.slice?.(0,8)}</td>
    <td className="px-4 py-3 text-sm">{order.user_email || order.customer_name || "-"}</td>
    <td className="px-4 py-3 text-sm">₹{order.total?.toFixed?.(2) ?? order.total}</td>
    <td className="px-4 py-3 text-sm">{order.status}</td>
    <td className="px-4 py-3 text-sm">{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</td>
  </tr>
);

export default function GlassTable({ data = [], title = "Recent Orders" }) {
  return (
    <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        <div className="text-xs text-slate-600">{data.length} items</div>
      </div>

      <div className="overflow-auto rounded">
        <table className="min-w-full">
          <thead className="text-left text-xs text-slate-700 uppercase">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-600">No records</td>
              </tr>
            ) : (
              data.map((o) => <Row key={o.id} order={o} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
