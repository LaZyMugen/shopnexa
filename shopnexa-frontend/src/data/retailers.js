// Demo retailer data shared across product details & cart logic.
// In a real app this would come from the backend per product or region.
export const demoRetailers = [
  { id: 'r1', name: 'Greenfield Grocers', address: 'MG Road, City Center', lat: 12.9718, lon: 77.5946, shipping_base: 20, shipping_per_km: 2, stock: 12 },
  { id: 'r2', name: "Raj's Wholesale", address: 'Industrial Area', lat: 12.9352, lon: 77.6245, shipping_base: 15, shipping_per_km: 1.5, stock: 50 },
  { id: 'r3', name: 'Neighborhood Store', address: 'Sector 7', lat: 12.9611, lon: 77.6387, shipping_base: 25, shipping_per_km: 2.5, stock: 2 },
];

// Approximate coordinates for common regions used in product demo data.
// This lets the storefront compute per-product distances when `product.region` is present.
export const regionCoords = {
  'Delhi': { lat: 28.7041, lon: 77.1025 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Bengaluru': { lat: 12.9716, lon: 77.5946 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  'Chandigarh': { lat: 30.7333, lon: 76.7794 },
  'Agra': { lat: 27.1767, lon: 78.0081 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Kashmir': { lat: 34.0837, lon: 74.7973 },
  'Ajmer': { lat: 26.4499, lon: 74.6399 },
  'Jodhpur': { lat: 26.2389, lon: 73.0243 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Surat': { lat: 21.1702, lon: 72.8311 },
  'Indore': { lat: 22.7196, lon: 75.8577 },
  'Bhopal': { lat: 23.2599, lon: 77.4126 },
  'Kochi': { lat: 9.9312, lon: 76.2673 },
  'Coimbatore': { lat: 11.0168, lon: 76.9558 },
  'Patna': { lat: 25.5941, lon: 85.1376 },
  'Ranchi': { lat: 23.3441, lon: 85.3096 },
  'Bhubaneswar': { lat: 20.2961, lon: 85.8245 },
  'Varanasi': { lat: 25.3176, lon: 82.9739 },
  'Kanpur': { lat: 26.4499, lon: 80.3319 },
  'Amritsar': { lat: 31.6330, lon: 74.8723 },
  'Ludhiana': { lat: 30.9000, lon: 75.8573 },
  'Shimla': { lat: 31.1048, lon: 77.1734 },
  'Dehradun': { lat: 30.3165, lon: 78.0322 },
  'Udaipur': { lat: 24.5854, lon: 73.7125 },
  'Kota': { lat: 25.2138, lon: 75.8648 },
  'Meerut': { lat: 28.9845, lon: 77.7064 },
  'Ghaziabad': { lat: 28.6692, lon: 77.4538 },
  'Noida': { lat: 28.5355, lon: 77.3910 },
  'Gurgaon': { lat: 28.4595, lon: 77.0266 },
  'Gurugram': { lat: 28.4595, lon: 77.0266 },
};

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
