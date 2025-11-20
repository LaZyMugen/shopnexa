import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="fixed right-6 top-6 z-50">
      <div className="rounded bg-emerald-500 text-white px-4 py-2 shadow">{message}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, _setSuccess] = useState("");
  const { login, loading, simulateLogin, user: authUser } = useAuth();
  const navigate = useNavigate();

  // Demo forgot-password modal states
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState("enter"); // enter, otp
  const [fpPhone, setFpPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [toast, setToast] = useState("");
  const [showMask, setShowMask] = useState(false);
  const [showLastIdx, setShowLastIdx] = useState(-1);
  const lastRevealTimerRef = useRef({});
  const otpRefs = useRef([]);

  function maskContact(raw) {
    if (!raw) return "";
    const trimmed = String(raw).trim();
    if (trimmed.includes("@")) {
      const [local, domain] = trimmed.split("@");
      if (!local) return `*@${domain}`;
      if (local.length <= 2) return `*@${domain}`;
      const first = local[0];
      const last = local[local.length - 1];
      return `${first}${"*".repeat(Math.max(1, local.length - 2))}${last}@${domain}`;
    }
    // Phone-like: keep last 2 digits, mask the rest
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length <= 2) return "**" + digits;
    const last = digits.slice(-2);
    const masked = "*".repeat(Math.max(2, digits.length - 2));
    return masked + last;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      // determine the logged in user object
      const u = (res && (res.user || res)) || authUser;

      // If retailer/wholesaler, check if onboarding profile exists and is complete
      if (u && (u.role === 'retailer' || u.role === 'wholesaler')) {
        try {
          const all = JSON.parse(localStorage.getItem('retailer_profiles') || '[]');
          const profile = all.find(p => p.retailerId === u.id);
          const needsOnboarding = !profile || !profile.businessName || !profile.address || !profile.pincode || !profile.categories || profile.categories.length === 0;
          if (needsOnboarding) {
            navigate('/onboarding');
            return;
          }
        } catch (e) {
          // If any error reading localStorage, fall back to onboarding
          navigate('/onboarding');
          return;
        }
      }

      navigate('/landing');
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Login failed");
      console.error("Login error:", err.response?.data || err.message);
    }
  };

  // Demo: send OTP -> just move to OTP step and show small note
  const sendOtp = (e) => {
    e?.preventDefault();
    if (!fpPhone.trim()) {
      setToast("Enter phone or email to send OTP");
      return;
    }
  // In demo we don't call backend. Move to OTP step.
    setOtpDigits(["", "", "", ""]);
    setFpStep("otp");
    setToast(`OTP sent to ${fpPhone}`);
    // focus first OTP box after it appears
    setTimeout(() => otpRefs.current[0]?.focus(), 120);
  };

  // animate mask when otp step appears
  useEffect(() => {
    if (fpStep === "otp") {
      setShowMask(false);
      const t = setTimeout(() => setShowMask(true), 60);
      return () => clearTimeout(t);
    }
    setShowMask(false);
  }, [fpStep]);

  // cleanup reveal timer on unmount
  useEffect(() => {
    return () => {
      if (lastRevealTimerRef.current) {
        clearTimeout(lastRevealTimerRef.current);
        lastRevealTimerRef.current = null;
      }
    };
  }, [navigate, simulateLogin]);

  // Google Sign-In (client-side) for Login page (reuses same flow as signup)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // not configured

    const id = "google-client-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.id = id;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
      s.onload = () => renderButton();
    } else {
      renderButton();
    }

    // removed unused decodeJwtPayload helper

    function renderButton() {
      if (!window.google || !window.google.accounts || !document.getElementById('googleSignIn')) return;
      if (document.getElementById('googleSignIn').children.length) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            const res = await api.post('/auth/google', { id_token: resp.credential });
            if (res.data?.success) {
              const payload = res.data.payload;
              const name = payload?.name || payload?.email || 'Google user';
              const demoUser = { email: payload?.email, name, google_sub: payload?.sub, picture: payload?.picture };
              try { simulateLogin(demoUser); } catch (e) { console.warn('simulateLogin failed', e); }
              setToast(`Signed in with Google as ${name}`);
              // If the Google-identified user has a retailer/wholesaler role, send to onboarding
              const gRole = demoUser.role || res.data?.user?.role;
              if (gRole === 'retailer' || gRole === 'wholesaler') navigate('/onboarding');
              else navigate('/landing');
            } else {
              setToast('Google verification failed on server');
            }
          } catch (err) {
            console.error('Google signin error', err);
            setToast('Google sign-in failed');
          }
        }
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignIn'),
        { theme: 'outline', size: 'large', width: '280' }
      );
    }
  }, []);

  // Demo: verify OTP -> accept any code and show green success hover
  const verifyOtp = (e) => {
    e?.preventDefault();
    // Require 4 digits before proceeding
    const code = otpDigits.join('');
    if (code.length !== otpDigits.length) {
      setToast("Please enter the 4-digit OTP");
      const firstEmpty = otpDigits.findIndex((d) => !d);
      if (firstEmpty >= 0) otpRefs.current[firstEmpty]?.focus();
      return;
    }
    // Accept any 4-digit input as valid for demo
    setToast("User verified!");
    // Close modal and redirect to main admin page for now; user dashboard placeholder will be created later
    setShowForgot(false);
  setFpStep("enter");
  setFpPhone("");
    setOtpDigits(["", "", "", ""]);
    try {
      // Use the entered contact (email/phone) as the demo user's email so header shows the real entered value
      const contact = fpPhone || '';
      const demoUser = { email: contact, name: contact };
      simulateLogin(demoUser);
    } catch (err) { console.warn('simulateLogin failed', err); }
  setTimeout(() => navigate("/landing"), 250);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left decorative panel (same as signup) */}
  <div className="relative hidden md:flex items-center justify-center auth-hero-bg p-0 overflow-hidden">
        <style>{`@keyframes floatY { 0% { transform: translateY(0px); } 50% { transform: translateY(-18px); } 100% { transform: translateY(0px); } } @keyframes drift { 0% { transform: translateX(-8px) translateY(0) scale(1); opacity: .95 } 50% { transform: translateX(8px) translateY(-8px) scale(1.03); opacity: .75 } 100% { transform: translateX(-8px) translateY(0) scale(1); opacity: .95 } }`}</style>

        <div className="absolute inset-0 -z-10">
          <div style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            right: '-10%',
            bottom: '-10%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(236,72,153,0.5), rgba(236,72,153,0.12) 40%, transparent 60%)',
            filter: 'blur(120px)',
            animation: 'floatY 6s ease-in-out infinite'
          }} />

          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: '-8%',
            top: '-6%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 60% 40%, rgba(79,70,229,0.2), rgba(79,70,229,0.05) 50%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'drift 9s ease-in-out infinite'
          }} />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(227, 5, 5, 0.02), rgba(0,0,0,0.02))',
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
          }} />
        </div>

        <div className="max-w-md text-white relative z-10 flex flex-col items-center text-center p-8">
          <div className="mb-4">
            <img src="/images-removebg-preview.svg" alt="ShopNexa" className="h-20 w-auto mx-auto" />
          </div>

          <h2 className="text-4xl font-extrabold mb-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 300 }}>Welcome to ShopNexa</h2>
          <p className="text-white/90 mb-6" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 300 }}>Your local marketplace, personalized and delivered at your fingertips.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center gap-2 mb-4">
            <img src="/images-removebg-preview.svg" alt="ShopNexa" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-center">Login into your account</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6 text-center">Sign in to access the ShopNexa portal</p>

          {error && <p className="text-red-500 mb-2">{error}</p>}
          {success && <p className="text-green-500 mb-2">{success}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className="border p-3 rounded focus:ring-2 focus:ring-indigo-300"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="border p-3 rounded focus:ring-2 focus:ring-indigo-300"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setShowForgot(true); setFpStep("enter"); }}
                className="text-indigo-600 hover:underline"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white py-2 rounded hover:opacity-95 disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <div className="text-center text-sm text-gray-400 my-4">or</div>

          <div id="googleSignIn" className="flex justify-center"></div>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>

      {/* Forgot password modal (demo) */}
      {showForgot && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Forgot Password</h2>
            {fpStep === "enter" && (
              <form onSubmit={sendOtp} className="space-y-3">
                <p className="text-sm text-slate-600">Enter your phone number or email to receive an OTP (demo).</p>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="+91 98765 43210 or email@example.com"
                  value={fpPhone}
                  onChange={(e) => setFpPhone(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForgot(false)} className="px-3 py-1 rounded bg-slate-200">Cancel</button>
                  <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">Send OTP</button>
                </div>
              </form>
            )}

            {fpStep === "otp" && (
              <form onSubmit={verifyOtp} className="space-y-3">
                <p className="text-sm text-slate-600">
                  Enter the OTP sent to
                  <strong className="ml-1 inline-block">
                    <span className={`inline-block transition-opacity duration-300 ${showMask ? 'opacity-100' : 'opacity-0'}`}>
                      {maskContact(fpPhone)}
                    </span>
                    <span className={`inline-block transition-opacity duration-200 ${showMask ? 'opacity-0' : 'opacity-100'}`}>
                      {fpPhone}
                    </span>
                  </strong>
                </p>
                <div className="flex gap-2 justify-center">
                  {otpDigits.map((d, idx) => (
                    <div key={idx} className="relative">
                      <input
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-14 h-14 text-center border rounded-md text-transparent bg-white caret-black"
                        value={d}
                        onChange={(e) => {
                          const ch = (e.target.value || "").replace(/\D/g, "").slice(-1);
                          const next = [...otpDigits];
                          next[idx] = ch;
                          setOtpDigits(next);
                          // reveal this index briefly
                          setShowLastIdx(idx);
                          if (lastRevealTimerRef.current[idx]) clearTimeout(lastRevealTimerRef.current[idx]);
                          lastRevealTimerRef.current[idx] = setTimeout(() => {
                            setShowLastIdx((cur) => (cur === idx ? -1 : cur));
                            lastRevealTimerRef.current[idx] = null;
                          }, 600);
                          if (ch && idx < otpDigits.length - 1) {
                            otpRefs.current[idx + 1]?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace") {
                            e.preventDefault();
                            const next = [...otpDigits];
                            if (next[idx]) {
                              next[idx] = "";
                              setOtpDigits(next);
                            } else if (idx > 0) {
                              otpRefs.current[idx - 1]?.focus();
                              const prev = [...otpDigits];
                              prev[idx - 1] = "";
                              setOtpDigits(prev);
                            }
                          } else if (e.key === "ArrowLeft" && idx > 0) {
                            otpRefs.current[idx - 1]?.focus();
                          } else if (e.key === "ArrowRight" && idx < otpDigits.length - 1) {
                            otpRefs.current[idx + 1]?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const paste = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
                          if (!paste) return;
                          const next = [...otpDigits];
                          for (let i = 0; i < paste.length; i++) next[i] = paste[i];
                          setOtpDigits(next);
                          const focusIdx = Math.min(paste.length, otpDigits.length - 1);
                          otpRefs.current[focusIdx]?.focus();
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-lg text-slate-700">
                        {d ? (showLastIdx === idx ? d : "*") : ""}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <button type="button" onClick={() => { setFpStep("enter"); }} className="text-xs text-slate-500 hover:underline">Change number</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowForgot(false)} className="px-3 py-1 rounded bg-slate-200">Close</button>
                    <button type="submit" className="px-3 py-1 rounded bg-emerald-600 text-white">Verify OTP</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}

export default Login;
    