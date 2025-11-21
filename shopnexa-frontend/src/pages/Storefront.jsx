import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LocationInput from "../components/LocationInput";
import { demoRetailers, haversineKm, estimateDays } from "../data/retailers";
import SkeletonProductCard from "../components/SkeletonProductCard";
import api from "../api/axios";
import { useCart } from "../context/cartContext";
import ProductCard from "../components/ProductCard";
import ThemeToggle from "../components/ThemeToggle";
import ProfileButton from "../components/ProfileButton";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../context/authContext";
import { useTheme } from "../context/themeContext";

function StoreInner() {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('cat') || 'all';
  const [category, setCategory] = useState(initialCategory);
  const [onlyLocal, setOnlyLocal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // {address, lat, lon}
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxShipping, setMaxShipping] = useState("");
  const [maxDistance, setMaxDistance] = useState("");

  const { items, addItem, totals, updateQty, removeItem, clearCart } = useCart();
  const { groups } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/products");
        const data = res?.data?.data ?? [];
        // merge server products with locally created products (demo)
        const local = (() => {
          try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch { return []; }
        })();
        // Proxy products: join wholesaler catalog with retailer margin links
        const wh = (() => { try { return JSON.parse(localStorage.getItem('wholesaler_products') || '[]'); } catch { return []; } })();
        const proxyLinks = (() => { try { return JSON.parse(localStorage.getItem('retailer_proxy_products') || '[]'); } catch { return []; } })();
        const proxyProducts = proxyLinks.filter(l=>l.published!==false).map(l => {
          const w = wh.find(x => x.id === l.wholesalerProductId);
          if (!w) return null;
          const price = (w.basePrice || w.price || 0) * (1 + (l.marginPercent||0)/100);
          return {
            id: `proxy-${l.retailerId}-${w.id}`,
            name: w.name + ' (Proxy)',
            price: Number(price.toFixed(2)),
            stock: w.minQty * 10, // synthetic stock for demo
            image_url: w.imageBase64,
            category_name: w.category || 'Proxy',
            proxy: true,
            retailerId: l.retailerId,
            originalWholesalerProductId: w.id,
            marginPercent: l.marginPercent,
            published: true
          };
        }).filter(Boolean);
        // include only published local products
        const localPublished = Array.isArray(local) ? local.filter(p => p.published !== false) : [];
        const merged = Array.isArray(data) ? [...data] : [];
        // avoid duplicates by id
        const ids = new Set(merged.map(p => p.id));
        for (const lp of localPublished) {
          if (!ids.has(lp.id)) merged.unshift(lp);
        }
        for (const pp of proxyProducts) {
          if (!ids.has(pp.id)) merged.unshift(pp);
        }
        if (mounted) setProducts(merged);
      } catch {
        // fallback to local products when server fails
        const local = (() => { try { return JSON.parse(localStorage.getItem('products') || '[]'); } catch { return []; } })();
        const localPublished = Array.isArray(local) ? local.filter(p => p.published !== false) : [];
        const wh = (() => { try { return JSON.parse(localStorage.getItem('wholesaler_products') || '[]'); } catch { return []; } })();
        const proxyLinks = (() => { try { return JSON.parse(localStorage.getItem('retailer_proxy_products') || '[]'); } catch { return []; } })();
        const proxyProducts = proxyLinks.filter(l=>l.published!==false).map(l => {
          const w = wh.find(x => x.id === l.wholesalerProductId);
          if (!w) return null;
          const price = (w.basePrice || w.price || 0) * (1 + (l.marginPercent||0)/100);
          return {
            id: `proxy-${l.retailerId}-${w.id}`,
            name: w.name + ' (Proxy)',
            price: Number(price.toFixed(2)),
            stock: w.minQty * 10,
            image_url: w.imageBase64,
            category_name: w.category || 'Proxy',
            proxy: true,
            retailerId: l.retailerId,
            originalWholesalerProductId: w.id,
            marginPercent: l.marginPercent,
            published: true
          };
        }).filter(Boolean);
        const merged = [...proxyProducts, ...localPublished];
        if (mounted) setProducts(merged);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Ensure viewport starts at top on initial mount (avoid unexpected auto scroll)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const name = p.categories?.name || p.category_name || "Unknown";
      if (name) set.add(name);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // Sync category to URL
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('cat', category);
      return next;
    });
  }, [category, setSearchParams]);

  // Compute global shipping/distance estimates for current location
  const locationEstimates = useMemo(() => {
    const lat = Number(selectedLocation?.lat ?? selectedLocation?.geometry?.coordinates?.[1]);
    const lon = Number(selectedLocation?.lon ?? selectedLocation?.geometry?.coordinates?.[0]);
    if (!isFinite(lat) || !isFinite(lon)) return { minShipping: null, minDistance: null };
    let minShipping = Infinity;
    let minDistance = Infinity;
    for (const r of demoRetailers) {
      const d = haversineKm(lat, lon, r.lat, r.lon);
      const ship = Math.round((r.shipping_base + r.shipping_per_km * d) * 100) / 100;
      if (d < minDistance) minDistance = d;
      if (ship < minShipping) minShipping = ship;
    }
    if (!isFinite(minShipping)) minShipping = null;
    if (!isFinite(minDistance)) minDistance = null;
    return { minShipping, minDistance };
  }, [selectedLocation]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const nameLower = (p.categories?.name || p.category_name || "Unknown").toLowerCase();
      const catLower = (category || 'all').toLowerCase();
      const okCat = catLower === "all" || nameLower === catLower;
      const okQuery = !query || (p.name || "").toLowerCase().includes(query.toLowerCase());
      const okLocal = !onlyLocal || Boolean(p.region);
      const price = Number(p.price || 0);
      const okMin = minPrice === "" || price >= Number(minPrice);
      const okMax = maxPrice === "" || price <= Number(maxPrice);
      const ship = locationEstimates.minShipping;
      const dist = locationEstimates.minDistance;
      const okShip = maxShipping === "" || (ship != null && ship <= Number(maxShipping));
      const okDist = maxDistance === "" || (dist != null && dist <= Number(maxDistance));
      return okCat && okQuery && okLocal && okMin && okMax && okShip && okDist;
    });
  }, [products, query, category, onlyLocal, minPrice, maxPrice, maxShipping, maxDistance, locationEstimates]);

  // placeOrder was a demo helper; actual checkout uses /checkout route

  // Force storefront to use a dark presentation regardless of global theme so it stays visually distinct.
  // We still conditionally style elements that rely on light backgrounds, but page chrome is dark-only.
  const isLightTheme = false; // override global theme for this page

  return (
  <div className={`storefront-page relative min-h-screen md:pl-72 bg-[var(--app-bg)] text-white`}> 
      {/* Fixed left sidebar (md+) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-72 bg-black text-white p-4 overflow-auto z-30">
        <div className="text-sm uppercase tracking-wide text-white/70 mb-3">Categories</div>
        {/* Primary categories */}
        <div className="space-y-2 mb-4">
          {categories.slice(0,1).map((c) => {
            const active = c.toLowerCase() === (category || 'all').toLowerCase();
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition cursor-pointer capitalize text-base
                  ${active
                    ? 'text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 shadow-[0_6px_18px_rgba(217,70,239,0.35)]'
                    : 'text-white/90 hover:text-white hover:bg-gradient-to-r hover:from-pink-500 hover:via-fuchsia-500 hover:to-purple-600 hover:shadow-[0_6px_18px_rgba(217,70,239,0.25)]'
                  }`}
              >
                <span>{c}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategories */}
        <div className="text-xs uppercase tracking-wide text-white/60 mb-2">Subcategories</div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          {categories.slice(1).map((c, idx) => {
            const active = c.toLowerCase() === (category || 'all').toLowerCase();
            return (
              <div key={c} className={`${idx!==0 ? 'border-t border-white/10' : ''}`}>
                <button
                  onClick={() => setCategory(c)}
                  className={`w-full text-left px-3 py-1.5 transition cursor-pointer capitalize text-sm 
                    ${active
                      ? 'text-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600'
                      : 'text-white/85 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <span>{c}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mt-6 border-t border-white/10 pt-4 space-y-4">
          <div className="text-sm uppercase tracking-wide text-white/70">Filters</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/70 mb-1">Price range (₹)</div>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="numeric" placeholder="Min" value={minPrice}
                  onChange={(e)=>setMinPrice(e.target.value)}
                  className="w-1/2 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40" />
                <input type="number" inputMode="numeric" placeholder="Max" value={maxPrice}
                  onChange={(e)=>setMaxPrice(e.target.value)}
                  className="w-1/2 px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40" />
              </div>
            </div>

            <div>
              <div className="text-xs text-white/70 mb-1">Destination</div>
              <LocationInput
                onChange={(loc)=>{
                  const obj = loc && typeof loc === 'object' ? loc : { address: loc };
                  setSelectedLocation(obj);
                }}
                inputClassName="w-full px-2 py-2 rounded bg-white/10 border border-white/10 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <div className="text-xs text-white/70 mb-1">Max shipping (₹)</div>
              <input type="number" inputMode="numeric" placeholder="e.g. 60" value={maxShipping}
                onChange={(e)=>setMaxShipping(e.target.value)}
                className="w-full px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40" />
              {selectedLocation && locationEstimates.minShipping != null && (
                <div className="text-[10px] text-white/50 mt-1">Nearest est: ₹{locationEstimates.minShipping}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-white/70 mb-1">Max distance (km)</div>
              <input type="number" inputMode="numeric" placeholder="e.g. 10" value={maxDistance}
                onChange={(e)=>setMaxDistance(e.target.value)}
                className="w-full px-2 py-1 rounded bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40" />
              {selectedLocation && locationEstimates.minDistance != null && (
                <div className="text-[10px] text-white/50 mt-1">Nearest est: {locationEstimates.minDistance.toFixed(1)} km</div>
              )}
            </div>
          </div>
        </div>
      </aside>

  <div className="max-w-7xl mx-auto p-6 md:p-8 relative z-10">
        <header className="mb-6">
          <div className="grid grid-cols-3 items-center">
            <div />
            <div />
            <div className="flex items-center justify-end gap-3 flex-wrap">
              <ProfileButton variant="inline" />
              <ThemeToggle />
              <AuthSellButton />
              {/* Logout visible when authenticated (component internally handles auth) */}
              <LogoutButton className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="search-input px-3 py-2 rounded-lg bg-white/70 border border-white/30 outline-none text-sm text-slate-900"
              />
              <label className="hidden md:flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={onlyLocal} onChange={(e) => setOnlyLocal(e.target.checked)} />
                Local specials
              </label>
            </div>
          </div>
        </header>

        {/* Content */}
        <section>
          {/* Logo row (tagline removed) */}
          <div className="flex justify-start -mt-12 md:-mt-16 mb-16 pointer-events-none select-none md:-ml-16 lg:-ml-12" aria-hidden>
            <img src="/images-removebg-preview.svg" alt="Shopnexa" className="h-20 md:h-24 object-contain opacity-90" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p) => {
                // personalization hints based on user-selected location
                const lat = Number(selectedLocation?.lat ?? selectedLocation?.geometry?.coordinates?.[1]);
                const lon = Number(selectedLocation?.lon ?? selectedLocation?.geometry?.coordinates?.[0]);
                let distanceKm = null, shipCost = null, etaDays = null, local = false, fastShip = false;
                if (isFinite(lat) && isFinite(lon)) {
                  let minD = Infinity;
                  let minShip = Infinity;
                  for (const r of demoRetailers) {
                    const d = haversineKm(lat, lon, r.lat, r.lon);
                    const ship = (r.shipping_base + r.shipping_per_km * d);
                    if (d < minD) minD = d;
                    if (ship < minShip) minShip = ship;
                  }
                  if (isFinite(minD)) distanceKm = minD;
                  if (isFinite(minShip)) shipCost = Math.round(minShip * 100) / 100;
                  if (isFinite(distanceKm)) etaDays = estimateDays(distanceKm);
                  local = !!p.region && isFinite(distanceKm) && distanceKm < 10;
                  fastShip = Number.isFinite(etaDays) && etaDays <= 2;
                }
                const hints = { distanceKm, shipCost, etaDays, fastShip, local };
                return (
                  <ProductCard key={p.id} product={p} onAdd={() => addItem(p, 1)} hints={hints} />
                );
              })}
              {filtered.length === 0 && (
                <div className="text-slate-600">No products match your filters.</div>
              )}
            </div>
          )}
        </section>

  {/* Cart Panel with retailer grouping */}
        <div className="fixed bottom-6 right-6 w-[340px]">
          <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900 flex items-center gap-1">Cart <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-white">{totals.count}</span></div>
              {items.length > 0 && (
                <button onClick={clearCart} className="text-xs text-red-600 hover:underline">Clear</button>
              )}
            </div>
            <div className="max-h-56 overflow-auto pr-1 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="border rounded-lg p-3 bg-white/50 flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800 line-clamp-2">{it.name}</div>
                      <div className="text-[11px] text-slate-500">Price: ₹{it.price} &times; {it.qty}</div>
                      {it.selectedLocation?.address && (
                        <div className="text-[10px] text-slate-500 mt-0.5">Dest: {it.selectedLocation.address}</div>
                      )}
                      {it.retailer?.name && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                            <span>{it.retailer.name}</span>
                            {it.retailer.shipping != null && <span>Ship ₹{(Number(it.retailer.shipping) * it.qty).toFixed(2)}</span>}
                          </span>
                          {isFinite(it.deliveryDays) && (
                            <span className="inline-flex items-center text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">ETA {it.deliveryDays}d</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-sm font-semibold">₹{(Number(it.price||0)*it.qty).toFixed(2)}</div>
                      <div className="flex items-center gap-1">
                        <button className="px-2 py-1 bg-slate-100 rounded" onClick={() => updateQty(it.id, Math.max(1, (it.qty||1)-1))}>-</button>
                        <div className="px-2 text-sm">{it.qty}</div>
                        <button className="px-2 py-1 bg-slate-100 rounded" onClick={() => updateQty(it.id, (it.qty||1)+1)}>+</button>
                      </div>
                      <button className="text-[10px] text-red-600" onClick={() => removeItem(it.id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-slate-600 text-sm">Your cart is empty</div>}
            </div>
            {items.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {groups.map(g => (
                    <div key={g.key} className="rounded-lg border bg-white/60 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-semibold text-slate-700 flex flex-wrap items-center gap-1">
                          {g.retailer?.name || 'Unassigned'}
                          {g.retailer?.distance_km != null && (
                            <span className="text-[10px] text-slate-500">{g.retailer.distance_km.toFixed(1)} km</span>
                          )}
                          {g.maxDeliveryDays > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">ETA ≤ {g.maxDeliveryDays}d</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600">{g.items.length} item(s)</div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-[11px] text-slate-600">
                        <div>Items:</div><div className="text-right">₹{g.itemsSubtotal.toFixed(2)}</div>
                        <div>Shipping:</div><div className="text-right">₹{g.shippingSubtotal.toFixed(2)}</div>
                        <div className="font-medium">Group total:</div><div className="text-right font-medium">₹{g.total.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1">
                  <div className="flex justify-between text-sm"><span>Items</span><span>₹{totals.itemsAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span>Shipping</span><span>₹{totals.shippingAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-base font-semibold border-t border-white/20 pt-2"><span>Total</span><span>₹{totals.grandTotal.toFixed(2)}</span></div>
                </div>
                <Link
                  to="/checkout"
                  className="block w-full text-center px-4 py-3 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
                >Checkout</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Storefront() {
  // Outer App-level CartProvider now supplies context; avoid nested provider that caused checkout mismatch.
  return <StoreInner />;
}

function AuthSellButton() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== 'retailer' && user.role !== 'wholesaler') return null;
  return (
    <Link to="/manage-products" className="hidden md:inline-block px-3 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-500">Sell products</Link>
  );
}
