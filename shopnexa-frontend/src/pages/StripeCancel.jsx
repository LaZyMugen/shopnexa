import { Link } from 'react-router-dom';

export default function StripeCancel() {
  return (
    <div className="max-w-xl mx-auto p-8">
      <div className="bg-white border rounded-xl p-8 shadow text-center">
        <h1 className="text-2xl font-semibold mb-3 text-red-600">Payment Canceled</h1>
        <p className="text-sm text-slate-600 mb-6">You canceled the Stripe checkout. No charges were made.</p>
        <div className="flex justify-center gap-3">
          <Link to="/payment" className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">Try Again</Link>
          <Link to="/store" className="px-4 py-2 rounded border text-sm">Back to Store</Link>
        </div>
      </div>
    </div>
  );
}
