import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/cartContext";
import LocationInput from "../components/LocationInput";
// Centralized demo retailers & utilities
import { demoRetailers, haversineKm } from "../data/retailers";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      } catch (err) {
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
    </div>
  );
}

// Demo retailers list component — in a real app this would come from the backend.
function RetailerList({ product, location, retailers, onChoose, onUpdateRetailers, chosenId }) {
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
