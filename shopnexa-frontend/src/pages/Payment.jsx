import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function loadOrder(id) {
  try {
    const all = JSON.parse(localStorage.getItem('order_summaries') || '[]');
    return all.find(o => o.id === id) || null;
  } catch { return null; }
}

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [method, setMethod] = useState(null); // 'card' | 'upi' | 'emi'
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  // UPI modal state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiTimeLeft, setUpiTimeLeft] = useState(120);
  const upiDuration = 120;
  // Static UPI QR (replaces generated QR code)
  const upiQrPath = encodeURI('/Screenshot 2025-11-20 231910.svg');
  // Card modal state
  const [showCardModal, setShowCardModal] = useState(false);
  // EMI modal state
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [selectedEmiId, setSelectedEmiId] = useState(null);
  const [showEmiSetupModal, setShowEmiSetupModal] = useState(false);
  // Payment issues / contact modal state
  const [showPaymentIssueModal, setShowPaymentIssueModal] = useState(false);
  const [issueName, setIssueName] = useState('');
  const [issueProblem, setIssueProblem] = useState('');
  const [issueContact, setIssueContact] = useState('');
  const [issueScreenshot, setIssueScreenshot] = useState(null); // base64

  const formatINR = (v) => `₹${(v || 0).toFixed(2)}`;

  // Compute totals early so other hooks (like EMI plans) can safely reference it
  const totals = useMemo(() => {
    if (!order) return { items: 0, shipping: 0, total: 0, finalTotal: 0 };
    const base = order.totals?.total || 0;
    const finalTotal = Math.max(0, Math.round((base - discount) * 100) / 100);
    return { ...order.totals, finalTotal };
  }, [order, discount]);

  const emiPlans = useMemo(() => {
    const P = totals.finalTotal || 0;
    const plans = [
      { id: '6m', months: 6, apr: 0.12 },
      { id: '12m', months: 12, apr: 0.14 },
      { id: '24m', months: 24, apr: 0.16 },
    ].map(p => {
      const r = p.apr / 12; // monthly rate
      const n = p.months;
      const perMonth = P > 0 && r > 0
        ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : (P / n);
      const totalPayable = perMonth * n;
      const interest = Math.max(0, totalPayable - P);
      return { ...p, perMonth, totalPayable, interest };
    });
    // Recommend based on price thresholds for practicality
    let recommended = '6m';
    if (P > 15000 && P <= 50000) recommended = '12m';
    if (P > 50000) recommended = '24m';
    return { plans, recommended };
  }, [totals.finalTotal]);
  const selectedEmi = useMemo(() => emiPlans.plans.find(p => p.id === selectedEmiId) || null, [emiPlans, selectedEmiId]);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [rememberCard, setRememberCard] = useState(false);
  const [cvv, setCvv] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const percentApplied = useMemo(() => {
    if (!order) return 0;
    const itemsTotal = order.totals?.items || 0;
    if (itemsTotal <= 0) return 0;
    return Math.round((discount / itemsTotal) * 1000) / 10; // one decimal place
  }, [order, discount]);
  // Available promo codes displayed in random order with random percent offers (multiples of 7.5 < 30)
  const [codeOffers] = useState(() => {
    const codes = ["MUGENCLUTCH", "BPHC25", "POELITE", "CGLITE", "PANDASIRISGENIUS"]; // randomize order
    const shuffled = [...codes].sort(() => Math.random() - 0.5);
    const percOptions = [7.5, 15, 22.5];
    return shuffled.map(code => ({
      code,
      percent: code === 'PANDASIRISGENIUS' ? 50 : percOptions[Math.floor(Math.random()*percOptions.length)]
    }));
  });

  useEffect(() => { setOrder(loadOrder(orderId)); }, [orderId]);

  

  const applyPromo = () => {
    if (!promoCode || !order) return;
    const code = promoCode.trim().toUpperCase();
    const itemsTotal = order.totals?.items || 0;
    // Special trigger code applies 50% on items
    if (code === 'PANDASIRISGENIUS') {
      const d = Math.round(itemsTotal * 0.50 * 100) / 100;
      setDiscount(d);
      setSelectedCode('PANDASIRISGENIUS');
      setMessage(`Available offers: ${codeOffers.map(o=>`${o.code} (${o.percent}%)`).join(' · ')} | 50% applied`);
      setTimeout(()=> setMessage(''), 5000);
      return;
    }
    // If user enters one of the shown codes, apply its assigned percentage
    const found = codeOffers.find(o => o.code === code);
    if (found) {
      const d = Math.round(itemsTotal * (found.percent/100) * 100) / 100;
      setDiscount(d);
      setMessage(`${found.code} applied: ${found.percent}% off items`);
      setSelectedCode(found.code);
      setTimeout(()=> setMessage(''), 4000);
      return;
    }
    setDiscount(0);
    setMessage('Invalid promo code');
    setTimeout(()=> setMessage(''), 2500);
  };

  const applyOfferDirect = (offer) => {
    if (!order) return;
    const itemsTotal = order.totals?.items || 0;
    const percent = offer.code === 'PANDASIRISGENIUS' ? 50 : offer.percent;
    const d = Math.round(itemsTotal * (percent/100) * 100) / 100;
    setDiscount(d);
    setSelectedCode(offer.code);
    setPromoCode(offer.code);
    setPromoOpen(true);
    setMessage(`${offer.code} applied: ${percent}% off items`);
    setTimeout(()=> setMessage(''), 4000);
  };

  // Handle Pay Now behavior; for UPI we show a modal with QR & timer
  const payNow = () => {
    if (!method || !order) return;
    if (method === 'upi') {
      setShowUpiModal(true);
      setUpiTimeLeft(upiDuration);
      return;
    }
    if (method === 'card') {
      setShowCardModal(true);
      return;
    }
    if (method === 'emi') {
      if (!selectedEmi) {
        setMessage('Please choose an EMI plan.');
        setShowEmiModal(true);
        return;
      }
      // Open EMI setup modal instead of immediate persist
      setShowEmiSetupModal(true);
      return;
    }
    setProcessing(true);
    try {
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      payments.push({ id: `pay-${Date.now()}`, orderId, method, discount, totalPaid: totals.finalTotal, created: new Date().toISOString() });
      localStorage.setItem('payments', JSON.stringify(payments));
      setMessage('Payment successful.');
      setTimeout(() => navigate('/store'), 1200);
    } catch {
      setMessage('Failed to persist payment.');
    } finally {
      setProcessing(false);
    }
  };

  // UPI countdown timer and timeout behavior
  useEffect(() => {
    if (!showUpiModal) return;
    if (upiTimeLeft <= 0) return;
    const id = setInterval(() => {
      setUpiTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [showUpiModal, upiTimeLeft]);

  useEffect(() => {
    if (showUpiModal && upiTimeLeft === 0) {
      setMessage('Time ran out for UPI payment.');
      setShowUpiModal(false);
    }
  }, [showUpiModal, upiTimeLeft]);

  // Removed dynamic QR generation; using static SVG asset instead

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg p-8 border text-center">
          <h2 className="text-2xl font-semibold mb-2">Payment</h2>
          <p className="text-slate-600 mb-4">Order not found.</p>
          <Link to="/store" className="px-4 py-2 rounded bg-indigo-600 text-white inline-block">Go to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl border p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Payment</h1>
        <p className="text-sm text-emerald-600 mb-6">Enjoy instant cashback with your HDFC Bank credit card.</p>
        {/* Alerts */}
        {message && message.toLowerCase().includes('time ran out') && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-start justify-between">
            <span>{message}</span>
            <button className="ml-4 text-red-600" onClick={()=>setMessage('')}>Dismiss</button>
          </div>
        )}

        {/* Pay in full */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pay in full</h2>
          <div className="space-y-3">
            <button onClick={()=>setMethod('card')} className={`w-full flex items-center gap-4 rounded-lg border px-5 py-4 text-left transition ${method==='card'?'border-indigo-500 bg-indigo-50':'border-slate-200 hover:border-slate-300 bg-white'}`}>
              {/* Reverted to simple inline image sizing */}
              <img src="/file.svg" alt="Visa / Card Payments" className="h-10 w-auto" />
              <div className="flex-1">
                <div className="font-medium">Credit or debit card</div>
                <div className="text-xs text-slate-500">Visa, Mastercard, RuPay supported</div>
              </div>
            </button>
            <button onClick={()=>setMethod('upi')} className={`w-full flex items-center gap-4 rounded-lg border px-5 py-4 text-left transition ${method==='upi'?'border-indigo-500 bg-indigo-50':'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <img src="/upi-logo.svg" alt="UPI Unified Payments Interface" className="h-10 w-auto" />
              <div className="flex-1">
                <div className="font-medium">Pay with UPI</div>
                <div className="text-xs text-slate-500">GPay / PhonePe / Paytm</div>
              </div>
            </button>
          </div>
        </div>

        {/* Pay in installments */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pay in installments</h2>
          <div className="space-y-3">
            <button onClick={()=>setMethod('emi')} className={`w-full flex items-center gap-4 rounded-lg border px-5 py-4 text-left transition ${method==='emi'?'border-indigo-500 bg-indigo-50':'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <span className="text-xl">🗓️</span>
              <div className="flex-1">
                <div className="font-medium">Credit card EMI</div>
                {method==='emi' && selectedEmi ? (
                  <>
                    <div className="text-xs text-emerald-700">
                      Selected: {selectedEmi.months}m · {formatINR(selectedEmi.perMonth)} / mo · APR {(selectedEmi.apr*100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-600">Total payable: {formatINR(selectedEmi.totalPayable)}</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500">No-cost EMIs of up to 24 months</div>
                )}
              </div>
              <span className="text-xs text-indigo-600 underline cursor-pointer" onClick={(e)=>{e.stopPropagation(); setShowEmiModal(true);}}>{method==='emi' && selectedEmi ? 'Change' : 'Explore EMIs'}</span>
            </button>
          </div>
        </div>

        {/* Promo code */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Have a promo code?</span>
            <button onClick={()=>setPromoOpen(o=>!o)} className="text-sm text-indigo-600 hover:underline">{promoOpen?'Hide':'Add'}</button>
          </div>
          {promoOpen && (
            <div className="flex gap-2 mt-2">
              <input value={promoCode} onChange={(e)=>setPromoCode(e.target.value)} placeholder="Enter code" className="flex-1 px-3 py-2 rounded border border-slate-300 text-sm" />
              <button onClick={applyPromo} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">Apply</button>
            </div>
          )}
          {discount > 0 && (
            <div className="text-xs text-emerald-600 mt-1">Discount applied: {percentApplied}%</div>
          )}
          {/* Show available promo codes with their randomly assigned percentages */}
          <div className="mt-3 text-xs text-slate-600">
            <div className="mb-1 font-medium text-slate-700">Available offers today</div>
            <div className="flex flex-wrap gap-2">
              {codeOffers.map((o) => {
                const active = selectedCode === o.code;
                return (
                  <button
                    key={o.code}
                    type="button"
                    onClick={()=>applyOfferDirect(o)}
                    className={`px-2 py-1 rounded border text-left transition ${active ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-300 hover:border-slate-400'}`}
                    aria-pressed={active}
                    title={`Apply ${o.code}`}
                  >
                    <span className="font-mono">{o.code}</span>
                    <span className="ml-1 text-emerald-600">({o.percent}% off)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-lg p-5 mb-6 border border-slate-200">
          <div className="flex justify-between text-sm mb-2">
            <span>Items</span>
            {discount>0 ? (
              <span className="flex flex-col text-right">
                <span className="line-through text-slate-400">₹{(order.totals.items).toFixed(2)}</span>
                <span className="text-emerald-600 font-semibold">₹{(order.totals.items - discount).toFixed(2)}</span>
              </span>
            ) : (
              <span>₹{(order.totals.items).toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between text-sm mb-2"><span>Shipping</span><span>₹{(order.totals.shipping).toFixed(2)}</span></div>
          {method === 'emi' && selectedEmi ? (
            <div className="mt-3 border-t pt-3">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total to Pay (EMI)</span>
                <span>{formatINR(selectedEmi.totalPayable)}</span>
              </div>
              <div className="flex items-center justify-between text-sm"><span>EMI per month</span><span className="font-semibold text-emerald-700">{formatINR(selectedEmi.perMonth)}</span></div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1"><span>Tenure</span><span>{selectedEmi.months} months</span></div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1"><span>APR</span><span>{(selectedEmi.apr*100).toFixed(1)}%</span></div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1"><span>Total payable</span><span>{formatINR(selectedEmi.totalPayable)}</span></div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1"><span>Total interest</span><span>{formatINR(selectedEmi.interest)}</span></div>
              <div className="flex items-center justify-between text-sm font-semibold mt-3"><span>Principal</span><span>₹{totals.finalTotal.toFixed(2)}</span></div>
            </div>
          ) : (
            <div className="flex justify-between text-base font-semibold border-t pt-3"><span>Total to Pay</span><span>₹{totals.finalTotal.toFixed(2)}</span></div>
          )}
        </div>

        {/* Action */}
        <button
          disabled={!method || processing}
          onClick={payNow}
          className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition ${method && !processing ? 'bg-indigo-600 hover:bg-indigo-500 text-white':'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
        >{processing ? 'Processing...' : method ? `Pay Now (${method.toUpperCase()})` : 'Select a payment method'}</button>
        {message && <div className="mt-3 text-sm text-indigo-600">{message}</div>}
      
      {/* Issues CTA */}
      <div className="mt-4 text-center">
        <div className="text-sm text-slate-600 mb-2">Issues with payment?</div>
        <button onClick={()=>setShowPaymentIssueModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded">Contact us</button>
      </div>
      </div>

      {/* UPI Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowUpiModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Scan the below QR code and pay <span className="text-emerald-600">₹{totals.finalTotal.toFixed(2)}</span>
                </h3>
                <button onClick={()=>setShowUpiModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              {/* Static QR SVG from public folder */}
              <div className="mx-auto w-48 h-48 rounded-md bg-white border flex items-center justify-center overflow-hidden">
                <img src={upiQrPath} alt="UPI QR Code" className="w-full h-full object-contain" />
              </div>
              {/* Timer ring */}
              <div className="mt-5 flex flex-col items-center">
                <div className="relative w-24 h-24">
                  {(() => {
                    const r = 48; // smaller radius
                    const c = 2 * Math.PI * r; // circumference
                    const frac = Math.max(0, Math.min(1, upiTimeLeft / upiDuration));
                    const offset = c * (1 - frac);
                    return (
                      <svg viewBox="0 0 128 128" className="w-24 h-24">
                        <circle cx="64" cy="64" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        <circle
                          cx="64"
                          cy="64"
                          r={r}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={c}
                          strokeDashoffset={offset}
                        />
                      </svg>
                    );
                  })()}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-sm font-medium text-slate-700">{upiTimeLeft}s</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">Complete the payment within the above time</div>
              </div>
              {/* Payment app logos */}
              <div className="mt-6">
                <div className="text-sm text-slate-700 mb-2">Pay with any of the below</div>
                <div className="flex items-center justify-center gap-8">
                  <img src="/paytm_logo.svg" alt="Paytm Logo" className="h-10 w-auto select-none" draggable="false" />
                  <img src="/google_pay.svg" alt="Google Pay Logo" className="h-12 w-auto select-none" draggable="false" />
                  <img src="/phonepe.svg" alt="PhonePe Logo" className="h-12 w-auto select-none" draggable="false" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMI Plans Modal */}
      {showEmiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowEmiModal(false)} />
          <div className="relative z-10 w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">EMI plans</h3>
                  <p className="text-xs text-slate-500">Calculated on {formatINR(totals.finalTotal)} principal</p>
                </div>
                <button onClick={()=>setShowEmiModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emiPlans.plans.map(p => {
                  const isRec = emiPlans.recommended === p.id;
                  const isSelected = selectedEmiId === p.id;
                  return (
                    <div key={p.id} className={`rounded-lg border p-4 ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>
                      {isSelected ? (
                        <div className="text-emerald-700 text-xs font-medium mb-2">Selected</div>
                      ) : isRec ? (
                        <div className="text-emerald-700 text-xs font-medium mb-2">Recommended</div>
                      ) : null}
                      <div className="text-sm text-slate-600">{p.months} months</div>
                      <div className="text-lg font-semibold">{formatINR(p.perMonth)} / mo</div>
                      <div className="mt-2 text-xs text-slate-500">Interest: {(p.apr*100).toFixed(1)}% p.a.</div>
                      <div className="mt-1 text-xs text-slate-500">Total interest: {formatINR(p.interest)}</div>
                      <div className="mt-1 text-xs text-slate-500">Total payable: {formatINR(p.totalPayable)}</div>
                      <button
                        className={`mt-3 w-full px-3 py-2 rounded text-sm border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 hover:border-slate-400'}`}
                        onClick={() => {
                          setSelectedEmiId(p.id);
                          setMethod('emi');
                          setMessage(`Selected ${p.months} months EMI @ ${(p.apr*100).toFixed(1)}% APR`);
                          setTimeout(()=>setMessage(''), 3000);
                        }}
                      >
                        {isSelected ? 'Selected' : `Choose ${p.months}m plan`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-slate-500">EMI amounts are indicative and may vary based on issuing bank policies.</div>
            </div>
          </div>
        </div>
      )}

      {/* Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowCardModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Enter your card details to pay <span className="text-emerald-600">₹{totals.finalTotal.toFixed(2)}</span>
                </h3>
                <button onClick={()=>setShowCardModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Cardholder Name</label>
                  <input value={cardName} onChange={e=>setCardName(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="Name on card" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Card Number</label>
                  <input value={cardNumber} onChange={e=>setCardNumber(e.target.value.replace(/[^0-9 ]/g,''))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-600 mb-1">Expiry (MM)</label>
                    <input value={expiryMonth} onChange={e=>setExpiryMonth(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="MM" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-600 mb-1">Expiry (YY)</label>
                    <input value={expiryYear} onChange={e=>setExpiryYear(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="YY" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-600 mb-1">CVV (3 digits)</label>
                    <input type="password" value={cvv} onChange={e=>setCvv(e.target.value.replace(/[^0-9]/g,'').slice(0,3))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm tracking-widest" placeholder="***" />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input id="rememberCard" type="checkbox" checked={rememberCard} onChange={e=>setRememberCard(e.target.checked)} className="mt-0.5" />
                  <label htmlFor="rememberCard" className="text-sm text-slate-700">Remember this card for faster checkout</label>
                </div>
                {rememberCard && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    Only card number and name will be saved for future transactions
                  </div>
                )}
                {/* Supported Banks */}
                <div className="pt-2">
                  <div className="text-xs text-slate-600 mb-1">Supported banks</div>
                  <div className="flex flex-wrap gap-2">
                    {['HDFC Bank','SBI Bank','IDFC Bank','ICICI Bank','PNB','Bank of Baroda'].map(b=> (
                      <span key={b} className="px-2 py-1 rounded border border-slate-300 text-xs">{b}</span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      // Basic minimal validation
                      if (!cardName || cardNumber.replace(/\s/g,'').length < 16 || cvv.length !== 3) {
                        setMessage('Please enter valid card details.');
                        return;
                      }
                      try {
                        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
                        payments.push({ id: `pay-${Date.now()}`, orderId, method: 'card', discount, totalPaid: totals.finalTotal, created: new Date().toISOString() });
                        localStorage.setItem('payments', JSON.stringify(payments));
                        setShowCardModal(false);
                        setMessage('Payment successful.');
                        setTimeout(() => navigate('/store'), 1200);
                      } catch {
                        setMessage('Failed to persist payment.');
                      }
                    }}
                    className="px-4 py-2 rounded bg-indigo-600 text-white text-sm"
                  >
                    Pay Now
                  </button>
                  <button onClick={()=>setShowCardModal(false)} className="px-4 py-2 rounded border border-slate-300 text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Issues Modal (black / white) */}
      {showPaymentIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowPaymentIssueModal(false)} />
          <div className="relative z-10 w-full max-w-lg mx-auto">
            <div className="bg-black/40 backdrop-blur-sm text-white rounded-xl shadow-lg border border-white/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">Report a payment issue</h3>
                <button onClick={()=>setShowPaymentIssueModal(false)} className="text-white/80 hover:text-white">✕</button>
              </div>
              <form onSubmit={(e)=>{e.preventDefault();
                // basic validation
                if (!issueName.trim() || !issueProblem.trim()) { setMessage('Please provide your name and a brief description of the problem.'); return; }
                try {
                  const saved = JSON.parse(localStorage.getItem('payment_issues') || '[]');
                  saved.push({ name: issueName, problem: issueProblem, contact: issueContact, screenshot: issueScreenshot, created: new Date().toISOString() });
                  localStorage.setItem('payment_issues', JSON.stringify(saved));
                  setMessage('Thanks — your issue has been submitted. We will contact you soon.');
                  setIssueName(''); setIssueProblem(''); setIssueContact(''); setIssueScreenshot(null);
                  setShowPaymentIssueModal(false);
                } catch (err) {
                  console.warn(err);
                  setMessage('Failed to save your issue.');
                }
              }} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Your name</label>
                  <input value={issueName} onChange={e=>setIssueName(e.target.value)} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Problem faced in transaction</label>
                  <textarea value={issueProblem} onChange={e=>setIssueProblem(e.target.value)} rows={5} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Describe what went wrong" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Screenshot or details (optional)</label>
                  <input type="file" accept="image/*" onChange={(e)=>{
                    const f = e.target.files?.[0];
                    if (!f) return setIssueScreenshot(null);
                    const reader = new FileReader();
                    reader.onload = () => setIssueScreenshot(reader.result);
                    reader.readAsDataURL(f);
                  }} className="w-full text-sm text-white/80" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact details (email or phone)</label>
                  <input value={issueContact} onChange={e=>setIssueContact(e.target.value)} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Email or phone" />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className="px-4 py-2 bg-white text-black rounded">Submit</button>
                  <button type="button" onClick={()=>setShowPaymentIssueModal(false)} className="px-4 py-2 border border-white/20 rounded text-white">Cancel</button>
                </div>
                <div className="text-xs text-white/80">Provide contact details for better engagement — our support team will reach out.</div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EMI Setup Modal */}
      {showEmiSetupModal && selectedEmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowEmiSetupModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Set up EMI: <span className="text-emerald-600">{formatINR(selectedEmi.perMonth)}</span> / mo for {selectedEmi.months} months
                </h3>
                <button onClick={()=>setShowEmiSetupModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="text-xs text-slate-600 mb-3">
                This amount will be auto-deducted monthly from your selected card, including interest (APR {(selectedEmi.apr*100).toFixed(1)}%).
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Cardholder Name</label>
                  <input value={cardName} onChange={e=>setCardName(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="Name on card" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Card Number</label>
                  <input value={cardNumber} onChange={e=>setCardNumber(e.target.value.replace(/[^0-9 ]/g,''))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-600 mb-1">Expiry (MM)</label>
                    <input value={expiryMonth} onChange={e=>setExpiryMonth(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="MM" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-600 mb-1">Expiry (YY)</label>
                    <input value={expiryYear} onChange={e=>setExpiryYear(e.target.value.replace(/[^0-9]/g,'').slice(0,2))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="YY" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-600 mb-1">CVV (3 digits)</label>
                    <input type="password" value={cvv} onChange={e=>setCvv(e.target.value.replace(/[^0-9]/g,'').slice(0,3))} className="w-full px-3 py-2 rounded border border-slate-300 text-sm tracking-widest" placeholder="***" />
                  </div>
                </div>
                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (!selectedEmi) { setMessage('Please choose an EMI plan.'); return; }
                      if (!cardName || cardNumber.replace(/\s/g,'').length < 16 || cvv.length !== 3) {
                        setMessage('Please enter valid card details.');
                        return;
                      }
                      try {
                        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
                        payments.push({
                          id: `pay-${Date.now()}`,
                          orderId,
                          method: 'emi',
                          discount,
                          totalPaid: totals.finalTotal,
                          emi: {
                            id: selectedEmi.id,
                            months: selectedEmi.months,
                            apr: selectedEmi.apr,
                            perMonth: selectedEmi.perMonth,
                            totalPayable: selectedEmi.totalPayable,
                            interest: selectedEmi.interest,
                          },
                          created: new Date().toISOString()
                        });
                        localStorage.setItem('payments', JSON.stringify(payments));
                        setShowEmiSetupModal(false);
                        setMessage('EMI set up successful.');
                        setTimeout(() => navigate('/store'), 1200);
                      } catch {
                        setMessage('Failed to persist payment.');
                      }
                    }}
                    className="px-4 py-2 rounded bg-indigo-600 text-white text-sm"
                  >
                    Set up EMI
                  </button>
                  <button onClick={()=>setShowEmiSetupModal(false)} className="px-4 py-2 rounded border border-slate-300 text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
