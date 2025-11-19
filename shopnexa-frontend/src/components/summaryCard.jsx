export default function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl bg-white/40 backdrop-blur-md border border-white/10 p-5 shadow-md transition transform hover:-translate-y-1">
      <div className="text-xs text-slate-700">{title}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
    </div>
  );
}
