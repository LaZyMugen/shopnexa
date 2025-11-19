export default function SkeletonProductCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 ring-1 ring-white/30 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-pulse">
      <div className="pointer-events-none absolute -top-6 -left-6 w-2/3 h-2/3 rounded-full bg-white/40 opacity-30" />
      <div className="h-40 w-full rounded-xl bg-white/20 mb-3" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-white/20 rounded" />
        <div className="h-3 w-1/2 bg-white/15 rounded" />
        <div className="mt-3 h-8 w-full bg-white/15 rounded-lg" />
      </div>
    </div>
  );
}
