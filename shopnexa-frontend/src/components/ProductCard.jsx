import { Link } from "react-router-dom";

// Deterministic pseudo-random helpers (stable per product id/name)
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return h >>> 0;
}

function deriveRating(id, name) {
  const base = hashString(String(id) + name);
  // rating between 4.1 and 4.9 (one decimal)
  const dec = (base % 9) + 1; // 1..9
  return parseFloat((4 + dec / 10).toFixed(1));
}

function deriveTotalCount(id, name, trending) {
  const base = hashString(name + String(id));
  if (trending) {
    // 6000 - 6999 -> format k+
    const count = 6000 + (base % 1000); // 6000..6999
    return formatK(count);
  }
  // 1500 - 4999
  const count = 1500 + (base % 3500);
  return formatK(count);
}

function formatK(n) {
  if (n >= 1000) {
    const k = n / 1000;
    return k.toFixed(1).replace(/\.0$/, '') + 'k+';
  }
  return n + '+';
}

function StarBarMini({ value }) {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100;
  return (
    <div className="relative inline-flex" style={{ width: 72, height: 14 }} aria-label={`Avg rating ${value} out of 5`}>
      <div className="absolute inset-0 flex">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-slate-300 text-[14px] leading-none">★</span>
        ))}
      </div>
      <div className="absolute inset-0 flex overflow-hidden" style={{ width: pct + '%' }}>
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-amber-400 text-[14px] leading-none">★</span>
        ))}
      </div>
    </div>
  );
}

export default function ProductCard({ product, onAdd, hints }) {
  const isProxy = !!product.proxy;
  const isTrending = !!product.trending;
  const avgRating = deriveRating(product.id, product.name || '');
  const totalRatings = deriveTotalCount(product.id, product.name || '', isTrending);
  return (
    <div className="product-card relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 ring-1 ring-white/30 p-6 shadow-[0_10px_36px_rgba(0,0,0,0.16)] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_44px_rgba(0,0,0,0.26)]">
      {/* highlight / reflection layer */}
  <div className="inner-reflection pointer-events-none absolute -top-6 -left-6 w-2/3 h-2/3 rounded-full bg-gradient-to-br from-white/60 via-white/20 to-transparent opacity-40" />
      {isTrending && (
        <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white text-[11px] font-semibold shadow-sm" aria-label="Trending product">
          <span>🔥</span><span>Trending</span>
        </div>
      )}
      {product.image_url && (
        <Link to={`/product/${product.id}`} className="block mb-3">
          <img src={product.image_url} alt={product.name} loading="lazy" decoding="async" className="h-56 w-full object-cover rounded-xl" />
        </Link>
      )}
      <div className="flex-1">
        <Link to={`/product/${product.id}`} className="font-semibold text-slate-900/90 dark:text-white drop-shadow-sm line-clamp-2 hover:underline">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-sm text-slate-700/80 dark:text-white">₹{product.price} • Stock: {product.stock ?? 0}{isTrending && <span className="ml-2 text-xs text-red-600 font-medium">Popular</span>}</div>
        </div>
        {/* Rating summary */}
        <div className="mt-2 flex items-center gap-2">
          <StarBarMini value={avgRating} />
          <span className="text-[11px] font-medium text-slate-700">{avgRating}</span>
          <span className="text-[10px] text-slate-500">{totalRatings}</span>
        </div>
        {product.description && (
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-200 line-clamp-2">{product.description}</div>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {product.region && (
            <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-sky-100/80 text-black dark:text-black backdrop-blur-sm">{product.region}</span>
          )}
          {isProxy && (
            <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800" title={`Margin ${product.marginPercent || 0}%`}>Proxy +{product.marginPercent || 0}%</span>
          )}
          {hints?.local && (
            <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Local</span>
          )}
          {hints?.fastShip ? (
            <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800">Fast ship</span>
          ) : (
            <>
              {Number.isFinite(hints?.etaDays) && (
                <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-pink-100 text-pink-700">ETA {hints.etaDays}d</span>
              )}
              {Number.isFinite(hints?.distanceKm) && (
                <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{hints.distanceKm.toFixed(1)} km</span>
              )}
            </>
          )}
        </div>
      </div>
      <button onClick={onAdd} className="mt-4 w-full rounded-lg bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white py-3 text-sm font-medium tracking-wide shadow-[0_6px_16px_rgba(217,70,239,0.45)] hover:shadow-[0_8px_20px_rgba(217,70,239,0.55)] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-pink-300/60">
        Add to Cart
      </button>
    </div>
  );
}
