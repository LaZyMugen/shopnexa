import { Link } from "react-router-dom";
import { useState } from "react";

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

// Generate a human-like retailer name, deterministic per seed and product category
function genRetailerName(seed, category) {
  const base = hashString(String(seed || 'seed'));
  const firstNames = ['Priya','Rohan','Neha','Arjun','Simran','Vivek','Anita','Rahul','Saanvi','Ishaan','Kavya','Aarav','Meera','Kabir','Ritika'];
  const initials = ['RK','MK','SS','AK','PN','VK','RS','JK','PK','DN','PM','RG','KV','AM','NS'];
  const cat = String(category || '').toLowerCase();
  const suffixGeneric = ['General Store','Bazaar','Super Mart','Traders','Stores'];
  const suffixElectronics = ['Electronics','Tech Mart','Appliances','Mobile Hub'];
  const suffixFashion = ['Fashion Centre','Textiles','Boutique','Clothing Co'];
  const suffixHome = ['Home Store','Home Essentials','Furnishings','Decor Studio'];
  const suffixKitchen = ['Home & Kitchen','Kitchen Ware'];
  const suffixSports = ['Sports & Fitness','Sport Shop'];
  const suffixKids = ['Kids Corner','Toy House'];
  let suffixPool = suffixGeneric;
  if (cat.includes('elect')) suffixPool = suffixElectronics;
  else if (cat.includes('apparel') || cat.includes('fashion') || cat.includes('cloth')) suffixPool = suffixFashion;
  else if (cat.includes('home') || cat.includes('decor') || cat.includes('furniture')) suffixPool = suffixHome;
  else if (cat.includes('kitchen')) suffixPool = suffixKitchen;
  else if (cat.includes('sport')) suffixPool = suffixSports;
  else if (cat.includes('kid') || cat.includes('toy')) suffixPool = suffixKids;
  const style = base % 2; // 0 -> FirstName + Suffix, 1 -> Initials + Suffix
  const namePart = style === 0
    ? firstNames[base % firstNames.length]
    : initials[base % initials.length];
  const suffix = suffixPool[(base >>> 4) % suffixPool.length];
  return `${namePart} ${suffix}`;
}

// Helpers for offline order contact & calendar
function genPhone(seed) {
  let h = 0;
  const s = String(seed || 'seed');
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) & 0xffffffff;
  const starts = ['6', '7', '8', '9'];
  const start = starts[Math.abs(h) % starts.length];
  let x = Math.abs(h) || 1;
  let digits = start;
  for (let i = 0; i < 9; i++) { x = (x * 1664525 + 1013904223) & 0xffffffff; digits += String(Math.abs(x) % 10); }
  return `+91 ${digits}`;
}

function formatDateRangeForGoogle(start, end) {
  const pad = (n) => String(n).padStart(2, '0');
  const toUtc = (d) => {
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const da = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const mm = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    return `${y}${m}${da}T${hh}${mm}${ss}Z`;
  };
  return `${toUtc(start)}/${toUtc(end)}`;
}

function buildIcs(summary, description, start, end) {
  const uid = `shopnexa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function fmt(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shopnexa//Offline Order Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${summary.replace(/\r?\n/g, ' ')}`,
    `DESCRIPTION:${(description||'').replace(/\r?\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

export default function ProductCard({ product, onAdd, hints }) {
  const isProxy = !!product.proxy;
  const isTrending = !!product.trending;
  const avgRating = deriveRating(product.id, product.name || '');
  const totalRatings = deriveTotalCount(product.id, product.name || '', isTrending);
  const [offlineOpen, setOfflineOpen] = useState(false);

  const retailerName = product.retailer?.name || genRetailerName(`${product.id}:${product.category || product.name}`, product.category);
  const retailerCity = product.retailer?.city || product.region || 'Bengaluru';
  const retailerPhone = product.retailer?.phone || genPhone(`${product.id}:${retailerName}`);

  const reminderStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  })();
  const reminderEnd = new Date(reminderStart.getTime() + 30 * 60 * 1000);
  const gcalDates = formatDateRangeForGoogle(reminderStart, reminderEnd);
  const gcalHref = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Call retailer about offline order: ' + (product.name || 'Item'))}&details=${encodeURIComponent(`Retailer: ${retailerName}\nCity: ${retailerCity}\nPhone: ${retailerPhone}`)}&dates=${gcalDates}`;
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
      <button
        onClick={() => setOfflineOpen(v => !v)}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white text-slate-800 py-2.5 text-sm font-medium hover:bg-slate-50"
      >Click here for offline order</button>
      {offlineOpen && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <div className="font-medium text-slate-800">Contact retailer</div>
          <div className="mt-1 text-slate-700">Name: <span className="font-semibold">{retailerName}</span></div>
          <div className="text-slate-700">City: <span className="font-semibold">{retailerCity}</span></div>
          <div className="text-slate-700">Phone: <span className="font-semibold">{retailerPhone}</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={gcalHref} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-emerald-600 text-white text-xs">Add reminder (Google)</a>
            <button
              className="px-3 py-2 rounded border border-slate-300 text-xs"
              onClick={() => {
                const ics = buildIcs(
                  `Call retailer: ${(product.name || 'Item')}`,
                  `Retailer: ${retailerName} | City: ${retailerCity} | Phone: ${retailerPhone}`,
                  new Date(reminderStart), new Date(reminderEnd)
                );
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `offline-order-reminder-${String(product.id).replace(/[^a-zA-Z0-9_-]/g,'')}.ics`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >Download .ics</button>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">We’ll remind you to contact the retailer for offline delivery.</div>
        </div>
      )}
    </div>
  );
}
