import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [categories, setCategories] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If user already has a saved profile, prefill
    try {
      const all = JSON.parse(localStorage.getItem('retailer_profiles') || '[]');
      const me = all.find(r => r.retailerId === user?.id);
      if (me) {
        setBusinessName(me.businessName || "");
        setGstin(me.gstin || "");
        setAddress(me.address || "");
        setPincode(me.pincode || "");
        setCategories((me.categories || []).join(", "));
        setPhone(me.phone || "");
      }
  } catch (err) { console.warn('prefill onboarding failed', err); }
  }, [user]);

  const handleSave = (e) => {
    e?.preventDefault();
    if (!user || !user.id) {
      // Try to derive id from token
      const token = localStorage.getItem('token') || '';
      const maybeId = token.startsWith('__demo_token__:') ? token.split(':')[1] : null;
      if (!maybeId) return alert('No authenticated user found.');
    }

    setSaving(true);
    const retailerId = user?.id || (localStorage.getItem('token') || '').split(':')[1] || `local-${Date.now()}`;
    // Validate required fields: businessName, address, categories, pincode
    if (!businessName.trim() || !address.trim() || !categories.trim() || !pincode.trim()) {
      alert('Please fill Business name, Address, Categories and Pincode before continuing.');
      setSaving(false);
      return;
    }

    const profile = {
      id: `rp_${retailerId}`,
      retailerId,
      businessName: businessName.trim(),
      gstin: gstin.trim(),
      address: address.trim(),
      pincode: pincode.trim(),
      categories: categories.split(',').map(s => s.trim()).filter(Boolean),
      phone: phone.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const all = JSON.parse(localStorage.getItem('retailer_profiles') || '[]');
      const idx = all.findIndex(r => r.retailerId === retailerId);
      if (idx >= 0) all[idx] = { ...all[idx], ...profile };
      else all.push(profile);
      localStorage.setItem('retailer_profiles', JSON.stringify(all));
      setTimeout(() => {
        setSaving(false);
        // After successful onboarding, go to landing per demo flow
        navigate('/landing');
      }, 300);
    } catch (err) {
      console.error('Save onboarding failed', err);
      setSaving(false);
      alert('Failed to save profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Retailer Onboarding</h1>
        <p className="text-sm text-gray-600 mb-4">Fill basic business details to complete onboarding for the demo.</p>

  <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700">Business name</label>
            <input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} className="w-full border p-2 rounded mt-1" required />
          </div>

          <div>
            <label className="text-sm text-gray-700">Contact phone</label>
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border p-2 rounded mt-1" />
          </div>

          <div>
            <label className="text-sm text-gray-700">GSTIN (optional)</label>
            <input value={gstin} onChange={(e)=>setGstin(e.target.value)} className="w-full border p-2 rounded mt-1" />
          </div>

          <div>
            <label className="text-sm text-gray-700">Pincode</label>
            <input value={pincode} onChange={(e)=>setPincode(e.target.value)} className="w-full border p-2 rounded mt-1" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Address</label>
            <textarea value={address} onChange={(e)=>setAddress(e.target.value)} className="w-full border p-2 rounded mt-1" rows={3} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Categories (comma separated)</label>
            <input value={categories} onChange={(e)=>setCategories(e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="grocery, beverages, stationery" />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white" disabled={saving}>{saving ? 'Saving...' : 'Save & Continue'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
