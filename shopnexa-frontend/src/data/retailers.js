// Demo retailer data shared across product details & cart logic.
// In a real app this would come from the backend per product or region.
export const demoRetailers = [
  { id: 'r1', name: 'Greenfield Grocers', address: 'MG Road, City Center', lat: 12.9718, lon: 77.5946, shipping_base: 20, shipping_per_km: 2, stock: 12 },
  { id: 'r2', name: "Raj's Wholesale", address: 'Industrial Area', lat: 12.9352, lon: 77.6245, shipping_base: 15, shipping_per_km: 1.5, stock: 50 },
  { id: 'r3', name: 'Neighborhood Store', address: 'Sector 7', lat: 12.9611, lon: 77.6387, shipping_base: 25, shipping_per_km: 2.5, stock: 2 },
];

export function haversineKm(aLat, aLon, bLat, bLon) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const la = toRad(aLat);
  const lb = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function estimateDays(distanceKm) {
  if (!isFinite(distanceKm)) return 5;
  if (distanceKm < 20) return 1;
  if (distanceKm < 100) return 2;
  return Math.min(10, Math.ceil(distanceKm / 200) + 2);
}
