import { useEffect, useRef, useState } from "react";

export default function LocationInput({ onChange, className = "", inputClassName = "" }) {
  const [value, setValue] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const wrapperRef = useRef(null);
  const key = import.meta.env.VITE_GEOAPIFY_API_KEY;

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    // If no key provided, try browser geolocation once to help user
    if (!key) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const txt = `Lat:${pos.coords.latitude.toFixed(4)},Lng:${pos.coords.longitude.toFixed(4)}`;
          setValue(txt);
          onChange?.({ address: txt, lat: pos.coords.latitude, lon: pos.coords.longitude });
        }, () => {});
      }
    }
  }, [key, onChange]);

  async function fetchSuggestions(q) {
    if (!q || !key) {
      setItems([]);
      return;
    }
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&limit=6&apiKey=${key}`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.features || []);
      setOpen(true);
    } catch (e) {
      console.warn('Geoapify autocomplete failed', e);
      setItems([]);
    }
  }

  function onInput(e) {
    const v = e.target.value;
    setValue(v);
    onChange?.({ address: v });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(v), 300);
  }

  function onSelectFeature(f) {
    const addr = f.properties?.formatted || f.properties?.name || '';
    const lat = f.properties?.lat ?? (f.geometry?.coordinates?.[1]);
    const lon = f.properties?.lon ?? (f.geometry?.coordinates?.[0]);
    setValue(addr);
    setItems([]);
    setOpen(false);
    onChange?.({ address: addr, lat, lon, raw: f });
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        value={value}
        onChange={onInput}
        onFocus={() => { if (items.length) setOpen(true); }}
        placeholder="Enter delivery address"
        className={inputClassName || "w-full border p-2 rounded"}
        aria-autocomplete="list"
      />

      {open && items.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 bg-white border rounded mt-1 max-h-56 overflow-auto shadow dark:bg-slate-800 dark:border-slate-700"> 
          {items.map((f) => {
            const id = f.properties?.place_id || f.properties?.formatted || JSON.stringify(f.properties || {});
            const addr = f.properties?.formatted || f.properties?.name || '';
            return (
              <li key={id} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer" onClick={() => onSelectFeature(f)}>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{addr}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{f.properties?.country || ''}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
