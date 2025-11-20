import { useState } from "react";
import LocationInput from "../components/LocationInput";
import api from "../api/axios";

export default function Feedback() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      // Try to post to backend if endpoint exists; fallback to localStorage
      try {
        await api.post('/support/feedback', { subject, message, contact, location });
        setSuccess('Feedback submitted — thank you!');
      } catch (err) {
        console.warn('feedback submit failed, saving locally', err);
        const saved = JSON.parse(localStorage.getItem('feedback') || '[]');
        saved.push({ subject, message, contact, location, created: new Date().toISOString() });
        localStorage.setItem('feedback', JSON.stringify(saved));
        setSuccess('Saved locally (demo).');
      }
      setSubject(''); setMessage(''); setContact(''); setLocation('');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-3">Contact / Feedback</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject" className="w-full border p-2 rounded" />
        <textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Message" className="w-full border p-2 rounded" rows={6} />
        <input value={contact} onChange={(e)=>setContact(e.target.value)} placeholder="Your email or phone" className="w-full border p-2 rounded" />
        <div>
          <label className="text-sm">Location (optional)</label>
          <LocationInput onChange={setLocation} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-slate-900 text-white">{loading ? 'Sending...' : 'Send'}</button>
          {success && <div className="text-sm text-emerald-600">{success}</div>}
        </div>
      </form>
    </div>
  );
}
