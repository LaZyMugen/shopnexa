import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

function Signup() {
  const [email, setEmail] = useState("");
  
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { signup, loading, user, simulateLogin } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if user is logged in (after successful signup)
  useEffect(() => {
    if (user) {
  navigate("/landing");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const result = await signup(email, password);
      
      // Check if we got a session (auto-login)
      if (result?.session?.access_token) {
        // Auto-logged in - useEffect will handle redirect when user state updates
  setSuccess("Signup successful! Redirecting to admin...");
      } else {
        // No session - email confirmation likely required
        setSuccess("Signup successful! Please check your email to confirm your account, then login.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Signup failed");
      console.error("Signup error:", err.response?.data || err.message);
    }
  };

  // Google Sign-In (client-only demo)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // not configured

    // Load Google Identity Services script
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

    // helper removed: we don't decode JWT client-side in this flow

    function renderButton() {
      if (!window.google || !window.google.accounts || !document.getElementById('googleSignIn')) return;
      // prevent rendering multiple times
      if (document.getElementById('googleSignIn').children.length) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          // Send credential (id_token) to backend for verification
          try {
            const res = await api.post('/auth/google', { id_token: resp.credential });
            if (res.data?.success) {
              const payload = res.data.payload;
              const name = payload?.name || payload?.email || 'Google user';
              // Use demo simulateLogin to create a local session for now
              // Later we can exchange the verified Google identity for a real Supabase session
              const demoUser = { email: payload?.email, name, google_sub: payload?.sub, picture: payload?.picture };
              // create a local demo session so protected routes work during development
              try {
                simulateLogin(demoUser);
              } catch (e) {
                console.warn('simulateLogin failed', e);
              }
              alert(`Signed in with Google as ${name}`);
              navigate('/landing');
            } else {
              alert('Google verification failed on server');
            }
          } catch (err) {
            console.error('Google signin error', err.response || err);
            alert('Google sign-in failed');
          }
        }
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignIn'),
        { theme: 'outline', size: 'large', width: '280' }
      );
      // Optional: prompt One Tap
      // window.google.accounts.id.prompt();
    }
  }, [navigate, simulateLogin]);

  // Load a classy serif font for the ShopNexa mark (Playfair Display)
  useEffect(() => {
    const id = 'playfair-font';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left decorative panel */}
  <div className="relative hidden md:flex items-center justify-center auth-hero-bg p-0 overflow-hidden">
        {/* full-panel animated background */}
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

          {/* subtle noise / shimmer overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(227, 5, 5, 0.02), rgba(0,0,0,0.02))',
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
          }} />
        </div>

        <div className="max-w-md text-white relative z-10 flex flex-col items-center text-center p-8">
          {/* logo image - place file at public/images-removebg-preview.svg */}
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
            <h1 className="text-2xl font-bold text-center">Create your account</h1>
          </div>
          <p className="text-sm text-gray-500 mb-6 text-center">Sign up to access the ShopNexa portal</p>

          {error && <p className="text-red-500 mb-2">{error}</p>}
          {success && <p className="text-green-500 mb-2">{success}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              className="border p-3 rounded focus:ring-2 focus:ring-purple-300"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="border p-3 rounded focus:ring-2 focus:ring-purple-300"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-700 to-indigo-500 text-white py-3 rounded font-semibold hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Create account"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-400 my-4">or</div>

          <div id="googleSignIn" className="flex justify-center"></div>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
  