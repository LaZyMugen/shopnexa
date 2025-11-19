// GlassCard.jsx
import React from "react";

export default function GlassCard({ title, value, subtitle, children }) {
  return (
    <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 p-5 shadow-md transition transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-700">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
        </div>
        {children && <div className="ml-4">{children}</div>}
      </div>
    </div>
  );
}
