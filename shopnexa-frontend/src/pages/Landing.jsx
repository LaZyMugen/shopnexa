import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../context/authContext";

const highlights = [
  { title: "Unified storefront", body: "Curate personalized collections, manage campaigns, and push instant updates from one canvas." },
  { title: "Intelligent logistics", body: "Realtime delivery insights, smart grouping, and location-aware shipping estimates." },
  { title: "Human touch", body: "Blend digital convenience with hyper-local context to delight every order." }
];

const stats = [
  { label: "Cities piloting", value: "12" },
  { label: "Vendors onboard", value: "280+" },
  { label: "Avg. delivery time", value: "1.8d" }
];

export default function Landing() {
  const { user } = useAuth();
  const aboutRef = useRef(null);
  const contactRef = useRef(null);
  const [showHeading, setShowHeading] = useState(false);
  const [showPara1, setShowPara1] = useState(false);
  const [showPara2, setShowPara2] = useState(false);
  const [showContactHeading, setShowContactHeading] = useState(false);
  const [showContactItems, setShowContactItems] = useState(false);
  const [contactInView, setContactInView] = useState(false);

  const handleAboutClick = useCallback(() => {
    const el = aboutRef.current || document.getElementById('about-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // kick off heading animation when About is explicitly clicked
      setShowHeading(true);
    }
  }, []);

  const handleContactClick = useCallback(() => {
    const el = contactRef.current || document.getElementById('contact-section');
    if (el) {
      // reset contact animation flags so it can replay
      setShowContactHeading(false);
      setShowContactItems(false);
      // trigger the heading animation immediately for click-driven replay
      // small timeout ensures class removal before re-adding to retrigger CSS
      setTimeout(() => setShowContactHeading(true), 20);
      // then scroll to the contact area
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Admin modal states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSsh, setAdminSsh] = useState("");
  const [adminError, setAdminError] = useState("");
  const navigate = useNavigate();

  const submitAdmin = (e) => {
    e?.preventDefault();
    setAdminError("");
    const okEmail = adminEmail.trim() === 'shaswatsahoo234@gmail.com';
    const okPass = adminPassword === 'shreesachi';
    const sshProvided = adminSsh.trim().length > 0;
    const okSsh = !sshProvided || adminSsh.trim() === '2310';
    if (!okEmail || !okPass || !okSsh) {
      setAdminError('Invalid admin credentials');
      return;
    }
  // success — mark admin-auth and navigate to admin panel
  setShowAdminModal(false);
  try { localStorage.setItem('admin_auth', 'true'); } catch (err) { console.warn('admin_auth persist failed', err); }
  navigate('/admin');
  };

  // Open admin modal when landing is visited with ?showAdmin=1 (used when non-admins
  // try to reach /admin — App redirects them here so they see the admin gate UI)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    try {
      if (searchParams.get('showAdmin') === '1') setShowAdminModal(true);
    } catch (err) {
      // ignore
    }
  }, [searchParams]);

  // Note: contact animations are only triggered on explicit click (handleContactClick)

  // watch contact section visibility to suppress dark background when contact is visible
  useEffect(() => {
    const el = contactRef.current || document.getElementById('contact-section');
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => setContactInView(e.isIntersecting));
    }, { threshold: 0.95 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`landing-page relative overflow-hidden ${contactInView ? 'contact-visible' : ''}`}>
      <div className="landing-aurora -left-24 -top-16" />
      <div className="landing-aurora landing-aurora--right" />
      <div className="landing-nebula" />

      <div className="relative z-10 min-h-screen flex flex-col px-6 md:px-12 lg:px-16 py-8 gap-6">
          <header className="w-full max-w-6xl mx-auto flex flex-col items-center text-white/80 pt-0 z-30 sticky top-4 relative">
            {/* absolute logout at the extreme right so layout stays centered */}
            <div className="absolute right-0 top-0">
              <LogoutButton />
            </div>
            <a href="/" aria-label="ShopNexa home" className="inline-block mb-0">
              <img src="/images-removebg-preview.svg" alt="ShopNexa" className="landing-logo mb-0" />
            </a>
            <nav className="flex items-center gap-3 text-sm uppercase tracking-wide -mt-2">
              <button onClick={handleAboutClick} className="hover:text-white">About</button>
              <button onClick={handleContactClick} className="hover:text-white text-xs">Contact</button>
            </nav>
          </header>

  <main className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center py-8 lg:py-12">
          <div className="space-y-8 lg:pl-0">
            <div>
              <p className="text-5xl md:text-6xl font-semibold leading-tight tracking-tight text-white text-left flex flex-wrap gap-3">
                <span className="hero-fade-1 inline-block">Welcome to</span>
                <span className="hero-fade-2 inline-block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">ShopNexa</span>
              </p>
              <p className="text-lg text-white/70 mt-5 max-w-2xl text-left hero-fade-2" style={{ animationDelay: '1.95s' }}>
                where customers are valued more than profits, sentiments more than revenue.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-start">
              <button onClick={() => setShowAdminModal(true)} className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-indigo-900/40">Enter control center</button>
              <Link to="/store" className="px-6 py-3 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white transition">Browse storefront</Link>
              {user && (user.role === 'retailer' || user.role === 'wholesaler') && (
                <Link to="/retailer/dashboard" className="px-6 py-3 rounded-full border border-white/30 text-white/80 hover:text-white hover:border-white transition">Sell products</Link>
              )}
            </div>
            <div className="flex gap-6 flex-wrap justify-start">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                  <div className="text-3xl font-semibold text-white">{stat.value}</div>
                  <div className="text-xs uppercase tracking-wide text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="landing-orbit">
              {[...Array(5)].map((_, idx) => (
                <span key={idx} />
              ))}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <p className="text-2xl font-semibold text-white">Commerce from home</p>
                <p className="text-sm text-white/60 mt-2 max-w-sm">Inventory heatmaps, channel velocity, and courier readiness—visualized in orbiting rings.</p>
              </div>
            </div>
          </div>
        </main>

        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Admin login</h2>
              <p className="text-sm text-white/70 mb-4">Enter admin credentials to access the control center.</p>
              {adminError && <div className="text-sm text-red-400 mb-2">{adminError}</div>}
              <form onSubmit={submitAdmin} className="space-y-3">
                <div>
                  <label className="text-sm text-white/80">Admin email</label>
                  <input className="w-full mt-1 p-2 rounded bg-white/10 border border-white/10 text-white" value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} placeholder="admin@example.com" type="email" required />
                </div>
                <div>
                  <label className="text-sm text-white/80">Admin password</label>
                  <input className="w-full mt-1 p-2 rounded bg-white/10 border border-white/10 text-white" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="password" type="password" required />
                </div>
                <div>
                  <label className="text-sm text-white/80">SSH key (optional)</label>
                  <input className="w-full mt-1 p-2 rounded bg-white/10 border border-white/10 text-white" value={adminSsh} onChange={(e)=>setAdminSsh(e.target.value)} placeholder="ssh key (optional)" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAdminModal(false)} className="px-3 py-2 rounded bg-slate-200 text-slate-900">Cancel</button>
                  <button type="submit" className="px-3 py-2 rounded bg-emerald-600 text-white">Enter control center</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="grid md:grid-cols-3 gap-6 text-white/80 pb-12">
          {highlights.map((item) => (
            <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-sm uppercase tracking-widest text-indigo-200">{item.title}</div>
              <p className="mt-3 text-base text-white/80">{item.body}</p>
            </div>
          ))}
        </section>
        
        
        
        {/* About + Contact continuous white panel */}
        <section className={`relative left-1/2 w-screen -translate-x-1/2 mt-0 bg-white z-20 min-h-screen flex flex-col`}>
          <div className="px-6 md:px-12 lg:px-16 xl:px-20 flex-1">
            <div className="max-w-6xl mx-auto flex-1 py-8 lg:py-12">
              <div className="flex flex-col gap-10 lg:gap-12">
                <h2
                  id="about-section"
                  ref={aboutRef}
                  className={`about-heading section-heading-small text-slate-900 text-left lg:text-left ${showHeading ? 'animate-about-1' : 'opacity-0'}`}
                  onAnimationEnd={() => {
                    // when heading finished animating, reveal first paragraph
                    setShowPara1(true);
                  }}
                >
                  About ShopNexa
                </h2>

                <div className="grid gap-8 items-start">
                  <p
                    className={`about-paragraph text-slate-800 max-w-7xl mx-auto mt-8 ${showPara1 ? 'animate-about-2' : 'opacity-0'}`}
                    onAnimationEnd={() => {
                      // when first paragraph finished animating, reveal second
                      setShowPara2(true);
                    }}
                  >
                    The rapid rise of e-commerce after the COVID-19 pandemic transformed how consumers shop and how retailers operate. Today, shoppers expect more than just an online storefront—they want intuitive interfaces, personalized suggestions, and seamless buying experiences. ShopNexa bridges this gap by connecting Customers, Retailers, and Wholesalers on a single, unified platform.
                  </p>

                  <p className={`about-paragraph text-slate-800 max-w-7xl mx-auto mt-6 ${showPara2 ? 'animate-about-3' : 'opacity-0'}`}>
                    Designed for Web, ShopNexa offers smart search, tailored recommendations, real-time stock visibility, and transparent pricing. It also promotes local businesses by highlighting region-specific products based on user location. With secure payments, easy order placement, and live order tracking, ShopNexa streamlines the entire shopping journey. Our mission is to empower users with convenience while helping local retailers grow in a digital-first world.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact area immediately after About, same white panel */}
            <div className="max-w-6xl mx-auto py-8 lg:py-12 mt-auto">
              <div className="text-slate-900">
                <h3 className={`about-heading section-heading-small font-bold text-slate-900 mb-6 ${showContactHeading ? 'animate-about-1' : 'opacity-0'}`} id="contact-section" ref={contactRef} onAnimationEnd={() => {
                    if (showContactHeading) setShowContactItems(true);
                  }}>
                  Contact
                </h3>
                <ul className="space-y-4">
                  <li className={`about-paragraph ${showContactItems ? 'animate-about-fast' : 'opacity-0'}`}>
                    Email: <a className="text-indigo-600 hover:underline" href="mailto:admin@shopnexa.com">admin@shopnexa.com</a>
                  </li>
                  <li className={`about-paragraph ${showContactItems ? 'animate-about-fast' : 'opacity-0'}`}>
                    GitHub: <a className="text-indigo-600 hover:underline" href="https://github.com/LaZyMugen" target="_blank" rel="noreferrer">github.com/LaZyMugen</a>
                  </li>
                  <li className={`about-paragraph ${showContactItems ? 'animate-about-fast' : 'opacity-0'}`}>
                    Business Phone: <a className="text-indigo-600 hover:underline" href="tel:+1234567890">+91 522 2671-890 (available 9am-9pm IST during weekdays)</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
