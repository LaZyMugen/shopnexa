// GlassChart.jsx
import React from "react";
import { ResponsiveContainer } from "recharts";

export default function GlassChart({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-slate-700 mb-3">{title}</h3>
      <div className="w-full h-64">
        <ResponsiveContainer>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
