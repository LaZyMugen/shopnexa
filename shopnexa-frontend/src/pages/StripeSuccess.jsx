import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function StripeSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSession() {
      if (!sessionId) return;
      try {
        const resp = await fetch(`http://localhost:5000/api/stripe/session/${sessionId}`);
        if (!resp.ok) throw new Error('Unable to fetch session');
        const data = await resp.json();
        setSession(data);
      } catch (e) { setError(e.message); }
    }
    fetchSession();
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto p-8">
      <div className="bg-white border rounded-xl p-8 shadow">
        <h1 className="text-2xl font-semibold mb-2 text-emerald-600">Payment Successful</h1>
        <p className="text-sm text-slate-600 mb-4">Your Stripe test payment has been simulated.</p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {session && (
          <div className="text-xs text-slate-700 space-y-1 mb-4">
            <div><span className="font-medium">Session:</span> {session.id}</div>
            <div><span className="font-medium">Status:</span> {session.payment_status}</div>
            <div><span className="font-medium">Amount:</span> ₹{(session.amount_total/100).toFixed(2)}</div>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <Link to="/orders" className="px-4 py-2 rounded bg-emerald-600 text-white text-sm">View Orders</Link>
          <Link to="/store" className="px-4 py-2 rounded border text-sm">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
