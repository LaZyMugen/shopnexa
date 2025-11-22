import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/cartContext";
import LocationInput from "../components/LocationInput";
// Centralized demo retailers & utilities
import { demoRetailers, haversineKm } from "../data/retailers";

// Small utility to generate a consistent tailwind text color from a username
function usernameColor(username) {
  const colors = [
    'text-rose-600','text-indigo-600','text-emerald-600','text-amber-600','text-blue-600','text-fuchsia-600','text-teal-600','text-purple-600','text-pink-600','text-cyan-600'
  ];
  let hash = 0;
  for (let i=0;i<username.length;i++) hash = (hash * 31 + username.charCodeAt(i)) & 0xfffffff;
  return colors[hash % colors.length];
}

// Star bar component with fractional support
function StarBar({ value, size = 18 }) {
  const pct = Math.max(0, Math.min(1, value/5)) * 100;
  return (
    <div className="relative inline-flex" style={{ width: size*5, height: size }} aria-label={`Rating ${value.toFixed(2)} out of 5`}>
      <div className="absolute inset-0 flex">
        {[...Array(5)].map((_,i)=>(
          <span key={i} style={{ fontSize: size }} className="text-slate-300">★</span>
        ))}
      </div>
      <div className="absolute inset-0 flex overflow-hidden" style={{ width: pct + '%' }}>
        {[...Array(5)].map((_,i)=>(
          <span key={i} style={{ fontSize: size }} className="text-amber-400">★</span>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState([]); // server/live feedback
  const [allFeedback, setAllFeedback] = useState([]); // combined historical (local) feedback
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingFb, setSubmittingFb] = useState(false);
  const sseRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(null); // {address, lat, lon}
  const [retailers, setRetailers] = useState([]);
  const [chosenRetailerId, setChosenRetailerId] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data?.data?.[0] ?? res.data?.data ?? null;
        if (mounted) setProduct(p);
  } catch {
        // fallback: fetch list and find
        try {
          const res = await api.get('/products');
          const arr = res.data?.data || [];
          const found = arr.find((x) => String(x.id) === String(id));
          if (mounted) setProduct(found || null);
        } catch (err2) {
          console.warn('Failed to load product via fallback', err2);
          if (mounted) setError('Failed to load product');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Load server/live feedback for product
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/products/${id}/feedback`);
        if (mounted) setFeedback(Array.isArray(res.data?.data)?res.data.data:[]);
      } catch {/* ignore */}
    })();
    return () => { mounted = false; };
  }, [id]);

  // Load local historical feedback (seed if empty with realistic sample snippets)
  useEffect(() => {
    try {
      const key = `product_feedback_${id}`;
      const raw = localStorage.getItem(key);
      const userPool = [
        'Riya123','ishan9','madking03','TechNomad','AquaLeaf','Zenify','PixelPilot','FluxCoder','NovaTrail','ByteBard',
        'CloudCrafter','EchoWave','QuantumQuill','DataDrift','ScriptSage','ByteBloom','NeonBranch','OrbitSpark','TerraMint','LogicLoom',
        'RustRider','AsyncAster','PixelPioneer','GridGuru','LambdaLynx','StateSmith','HookHaven','CacheCrafter'
      ];
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 3600 * 1000;
      function randomTimestamp(idx) {
        // ensure unique by subtracting idx*random spaced minutes within last week
        const offset = Math.floor(Math.random() * oneWeekMs);
        return new Date(now - offset - idx * 137000).toISOString();
      }
      function generateSeeded(count = 22) {
        const samples = [
          { text: 'Quality exceeded expectations.', tone: 'positive' },
          { text: 'Packaging was neat and delivery was on time.', tone: 'positive' },
          { text: 'Good value for the price.', tone: 'positive' },
          { text: 'Looks exactly like the photos.', tone: 'positive' },
          { text: 'Would purchase again.', tone: 'positive' },
          { text: 'Finish is clean and sturdy build.', tone: 'positive' },
          { text: 'Decent but could be improved in durability.', tone: 'neutral' },
          { text: 'Works fine; minor scratches on arrival.', tone: 'neutral' },
          { text: 'Average quality for the cost.', tone: 'neutral' },
          { text: 'Some parts feel a bit flimsy.', tone: 'neutral' },
          { text: 'Color slightly different than listing.', tone: 'neutral' },
          { text: 'Not satisfied: battery drained faster than expected.', tone: 'negative' },
          { text: 'Item arrived late and packaging was dented.', tone: 'negative' },
          { text: 'Disappointed: stopped working after a week.', tone: 'negative' },
          { text: 'Support response was slow.', tone: 'negative' },
          { text: 'Good build but heat dissipation could improve.', tone: 'neutral' },
          { text: 'Exceeded my expectations for this price.', tone: 'positive' },
          { text: 'Feels premium and solid.', tone: 'positive' },
          { text: 'Performance matches description.', tone: 'positive' },
          { text: 'Inconsistent finishing on edges.', tone: 'neutral' },
          { text: 'Great value bundle overall.', tone: 'positive' },
          { text: 'Durability test passed after heavy use.', tone: 'positive' },
          { text: 'Packaging lacked protective padding.', tone: 'negative' }
        ].sort(() => Math.random() - 0.5);
        const chosen = samples.slice(0, count);
        return chosen.map((obj, idx) => {
          let ratingVal;
          if (obj.tone === 'positive') ratingVal = 4 + (Math.random() < 0.5 ? 1 : 0); // 50% chance 5
          else if (obj.tone === 'neutral') ratingVal = [3,3,2,4][Math.floor(Math.random()*4)];
          else ratingVal = [1,2][Math.floor(Math.random()*2)];
          return {
            id: `seed-${idx}-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,
            rating: ratingVal,
            comment: obj.text,
            created_at: randomTimestamp(idx),
            local: false,
            username: userPool[idx % userPool.length]
          };
        });
      }
      if (raw) {
        let parsed = JSON.parse(raw);
        // Remove duplicate usernames by appending a discriminator or reassigning
        const seenUsers = new Set();
        parsed = parsed.map((f, idx) => {
          let user = f.username || userPool[(idx + (f.comment?.length || 0)) % userPool.length];
          if (seenUsers.has(user)) {
            // pick a new unique one
            const alt = userPool.find(u => !seenUsers.has(u)) || (user + '_' + idx);
            user = alt;
          }
          seenUsers.add(user);
          // normalize rating
          let ratingVal = typeof f.rating === 'number' && f.rating > 0 ? f.rating : Math.max(1, Math.min(5, Math.round(3 + Math.sin(idx + (f.comment?.length||0)) * 2)));
          return {
            ...f,
            username: user,
            rating: ratingVal,
            created_at: f.created_at || randomTimestamp(idx)
          };
        });
        if (parsed.length < 18) {
          parsed = generateSeeded(22);
        }
        setAllFeedback(parsed);
        localStorage.setItem(key, JSON.stringify(parsed));
      } else {
        const seeded = generateSeeded(22);
        localStorage.setItem(key, JSON.stringify(seeded));
        setAllFeedback(seeded);
      }
    } catch (e) {
      console.warn('Failed loading local feedback', e);
    }
  }, [id]);

  // Realtime feedback via SSE
  useEffect(() => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/events';
    const es = new EventSource(url);
    sseRef.current = es;
    es.addEventListener('feedback-new', (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        if (String(payload.product_id) === String(id)) {
          setFeedback(prev => [payload, ...prev]);
        }
      } catch {/* ignore */}
    });
    return () => { es.close(); };
  }, [id]);

  // Average rating across merged (server + local historical + SSE) entries where rating exists
  const ratingPool = [...feedback, ...allFeedback].filter(f => typeof f.rating === 'number' && f.rating > 0);
  const avgRating = ratingPool.length ? (ratingPool.reduce((a,b)=>a + b.rating,0)/ratingPool.length) : null;
  const formattedAvg = avgRating ? avgRating.toFixed(2) : null;

  // Merge server+local for display in historical section (avoid duplicates by id)
  const mergedHistorical = [...allFeedback, ...feedback.filter(f => !allFeedback.find(x=>x.id===f.id))]
    .sort((a,b)=> new Date(b.created_at||0) - new Date(a.created_at||0));

  // Pagination / expand state for historical feedback
  const [showAllPrev, setShowAllPrev] = useState(false);
  const HISTORICAL_INITIAL = 8;
  const visibleHistorical = showAllPrev ? mergedHistorical : mergedHistorical.slice(0, HISTORICAL_INITIAL);

  const appendLocalFeedback = useCallback((entry) => {
    try {
      const key = `product_feedback_${id}`;
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(entry);
      localStorage.setItem(key, JSON.stringify(arr));
      setAllFeedback(arr);
    } catch (e) {
      console.warn('Failed to append local feedback', e);
    }
  }, [id]);

  const submitFeedback = async () => {
    if (!rating || rating < 1) return;
    setSubmittingFb(true);
    const timestamp = new Date().toISOString();
    try {
      await api.post(`/products/${id}/feedback`, { rating, comment });
      // Optimistic local entry so it appears immediately in historical section
      appendLocalFeedback({
        id: `local-${Date.now()}`,
        rating,
        comment: comment.trim(),
        created_at: timestamp,
        local: true,
        username: ['Riya123','ishan9','madking03','TechNomad','AquaLeaf','Zenify','PixelPilot','FluxCoder'][Math.floor(Math.random()*8)]
      });
      setRating(0); setComment("");
      // SSE will also bring in the server version, duplicates filtered by id mismatch (different id) — acceptable demo.
    } catch (e) {
      console.warn('Feedback submit failed', e.response?.data?.error||e.message);
    } finally {
      setSubmittingFb(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!product) return <div className="p-6">Product not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full rounded-lg object-cover" />
          ) : (
            <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
          <div className="text-lg text-slate-800 font-medium mb-2">₹{product.price}</div>
          <div className="text-sm text-slate-600 mb-3">Stock: {product.stock ?? 0}</div>
          {product.available_at && (
            <div className="text-xs text-slate-500 mb-3">Available from: {new Date(product.available_at).toLocaleDateString()}</div>
          )}
          {product.retailer_proxy && (
            <div className="mb-3 text-sm text-amber-800 bg-amber-100 inline-block px-3 py-1 rounded">Available via wholesaler/retailer proxy</div>
          )}

          <div className="mt-4">
            <button
              onClick={() => {
                const retailer = (retailers || []).find(r => r.id === chosenRetailerId);
                const locLat = Number(selectedLocation?.lat ?? selectedLocation?.geometry?.coordinates?.[1]);
                const locLon = Number(selectedLocation?.lon ?? selectedLocation?.geometry?.coordinates?.[0]);
                const item = {
                  ...product,
                  selectedLocation: selectedLocation ? {
                    address: selectedLocation.address,
                    lat: isFinite(locLat) ? locLat : undefined,
                    lon: isFinite(locLon) ? locLon : undefined,
                  } : undefined,
                  retailer: retailer ? {
                    id: retailer.id,
                    name: retailer.name,
                    address: retailer.address,
                    shipping: retailer.shipping,
                    distance_km: retailer.distance_km,
                    lat: retailer.lat,
                    lon: retailer.lon,
                    shipping_base: retailer.shipping_base,
                    shipping_per_km: retailer.shipping_per_km,
                  } : undefined,
                };
                addItem(item, 1);
              }}
              className="px-4 py-2 rounded bg-slate-900 text-white"
            >Add to cart</button>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Delivery / Pickup Location</h3>
            <LocationInput onChange={(loc) => {
              // loc may be {address, lat, lon, raw} or {address}
              const obj = loc && typeof loc === 'object' ? loc : { address: loc };
              setSelectedLocation(obj);
            }} />

            {/* Shipping origin / retailers (demo) */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Ships from</h4>
              {!selectedLocation && (
                <div className="text-xs text-slate-500">Choose a delivery location above to see which retailer will ship this item.</div>
              )}
              {selectedLocation && (
                <RetailerList
                  product={product}
                  location={selectedLocation}
                  retailers={retailers}
                  onChoose={(id) => setChosenRetailerId(id)}
                  onUpdateRetailers={(r) => setRetailers(r)}
                  chosenId={chosenRetailerId}
                />
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Description</h3>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{product.description}</div>
          </div>
        </div>
      </div>
      {/* Feedback Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Feedback</h2>
        {formattedAvg && (
          <RatingSummary product={product} avg={avgRating} count={ratingPool.length} />
        )}
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(r => (
              <button key={r} onClick={()=>setRating(r)} className={`w-8 h-8 rounded-full text-sm border flex items-center justify-center ${rating>=r? 'bg-amber-400 text-white border-amber-400':'bg-white text-slate-600'}`}>{r}</button>
            ))}
          </div>
          <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Optional comment" className="flex-1 px-3 py-2 rounded border text-sm" />
          <button disabled={submittingFb || rating<1} onClick={submitFeedback} className="px-4 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50">{submittingFb? 'Submitting...':'Submit'}</button>
        </div>
        <ul className="space-y-3">
          {feedback.map((f,i)=>(
            <li key={f.created_at+String(i)} className="p-3 rounded border bg-white/70 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rating: {f.rating}★</span>
                <span className="text-[10px] text-slate-500">{new Date(f.created_at).toLocaleString()}</span>
              </div>
              {f.comment && <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{f.comment}</div>}
            </li>
          ))}
          {feedback.length===0 && <li className="text-sm text-slate-500">No feedback yet.</li>}
        </ul>
        {/* Historical / Previous Feedback Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Previous Feedback</h3>
          <div className="space-y-3">
            {visibleHistorical.map((f,i)=>(
              <div key={f.id+String(i)} className="p-3 rounded-lg border bg-white/60 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <span className="text-amber-500">{f.rating ? `${f.rating}★` : '—'}</span>
                    </div>
                    <span className={`text-xs font-medium ${usernameColor(f.username||'AnonUser')}`}>{f.username || 'AnonUser'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                {f.comment && <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{f.comment}</div>}
              </div>
            ))}
            {mergedHistorical.length === 0 && (
              <div className="text-sm text-slate-500">No historical feedback yet.</div>
            )}
            {!showAllPrev && mergedHistorical.length > HISTORICAL_INITIAL && (
              <button onClick={()=>setShowAllPrev(true)} className="w-full mt-4 text-center text-xs font-medium text-slate-700 hover:text-slate-900 underline">See more feedbacks...</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

  // Derive deterministic rating count display similar to product card logic
  function deriveCountValue(id, name, trending) {
    function hash(str) {
      let h = 0; for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) & 0xffffffff; return h>>>0;
    }
    const base = hash(String(id)+name);
    if (trending) {
      const count = 6000 + (base % 1000); // 6000..6999
      return formatK(count);
    }
    const count = 1500 + (base % 3500); // 1500..4999
    return formatK(count);
  }
  function formatK(n){
    const k = n/1000; return k.toFixed(1).replace(/\.0$/,'')+'k+';
  }
  function RatingSummary({ product, avg, count }) {
    const formattedAvg = avg.toFixed(2);
    let trendingIds = [];
    try { const raw = localStorage.getItem('trending_ids'); if (raw) trendingIds = JSON.parse(raw)||[]; } catch {/* ignore */}
    const isTrending = trendingIds.includes(product.id);
    const totalDisplay = deriveCountValue(product.id, product.name||'', isTrending);
    return (
      <div className="mb-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <StarBar value={avg} />
          <span className="text-sm font-semibold text-slate-800">{formattedAvg}</span>
          <span className="text-xs text-slate-500">avg ({count} rating{count!==1 && 's'})</span>
        </div>
        <div className="text-xs text-slate-600">Total ratings by users: <span className="font-medium">{totalDisplay}</span></div>
      </div>
    );
  }

// Demo retailers list component — in a real app this would come from the backend.
function RetailerList({ location, retailers, onChoose, onUpdateRetailers, chosenId }) {
  // Initialize with centralized demo retailers if empty
  useEffect(() => {
    if (!retailers || retailers.length === 0) onUpdateRetailers(demoRetailers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locLat = Number(location?.lat ?? location?.geometry?.coordinates?.[1]);
  const locLon = Number(location?.lon ?? location?.geometry?.coordinates?.[0]);

  const enriched = (retailers || []).map((r) => {
    const d = (isFinite(locLat) && isFinite(locLon)) ? haversineKm(locLat, locLon, r.lat, r.lon) : null;
    const shipping = d == null ? null : Math.round((r.shipping_base + r.shipping_per_km * d) * 100) / 100;
    return { ...r, distance_km: d, shipping };
  }).sort((a,b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));

  // Choose default if none selected
  useEffect(() => {
    if (!chosenId && enriched.length) onChoose(enriched[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched.length]);

  return (
    <div className="space-y-3">
      {enriched.map((r) => (
        <div key={r.id} className={`p-3 border rounded ${chosenId === r.id ? 'bg-white' : 'bg-white/90'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{r.name} {r.stock <= 5 && <span className="text-xs text-amber-700 ml-2">Low stock</span>}</div>
              <div className="text-xs text-slate-600">{r.address}</div>
              <div className="text-xs text-slate-500">{r.distance_km != null ? `${r.distance_km.toFixed(1)} km` : 'Unknown distance'}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{r.shipping != null ? `₹${r.shipping}` : '—'}</div>
              <div className="text-xs text-slate-500">Shipping</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={() => onChoose(r.id)}
              className={`px-3 py-1 rounded text-sm ${chosenId === r.id ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
            >{chosenId === r.id ? 'Selected' : 'Choose'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
