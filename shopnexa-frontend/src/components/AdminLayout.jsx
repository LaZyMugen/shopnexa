import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Box, Layers, ShoppingCart, Users, Settings, BarChart2, Package, ArrowLeft } from "lucide-react";
import Header from "./Header";

// Consolidated admin navigation matching /admin/* routes defined in App.jsx
const MENU = [
  { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
  { name: "Products", path: "/admin/products", icon: <Box size={18} /> },
  { name: "Categories", path: "/admin/categories", icon: <Layers size={18} /> },
  { name: "Orders", path: "/admin/orders", icon: <ShoppingCart size={18} /> },
  { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
  { name: "Analytics", path: "/admin/analytics", icon: <BarChart2 size={18} /> },
  { name: "Settings", path: "/admin/settings", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/80 via-sky-50 to-white/60">
      {/* Sidebar (black background enforced) */}
      <aside className="w-72 p-5 sticky top-0 h-screen z-40 bg-black text-gray-200">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-black border border-white/10 p-4 shadow-xl flex flex-col items-center text-center">
            {/* Brand title + logo */}
            <img src="/images-removebg-preview.svg" alt="ShopNexa logo" className="h-10 my-2 mx-auto" />
            <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
          </div>

          <nav className="space-y-2">
            {MENU.map((it) => {
              const active = location.pathname === it.path;
              return (
                <NavLink
                  key={it.path}
                  to={it.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-white text-sm transition-all ${
                    active ? "bg-gray-800 shadow-md ring-1 ring-white/30" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="text-gray-400">{it.icon}</span>
                  <span>{it.name}</span>
                </NavLink>
              );
            })}

            {/* Retailer dashboard link for admin control center */}
            <NavLink
              to="/retailer/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-white text-sm transition-all ${
                location.pathname === "/retailer/dashboard" ? "bg-gray-800 shadow-md ring-1 ring-white/30" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-gray-400"><ArrowLeft size={18} /></span>
              <span>Retailer dashboard</span>
            </NavLink>

            {/* Public section */}
            <div className="mt-6 mb-2 px-3 text-[10px] tracking-wide uppercase text-gray-500">Public</div>
            <NavLink
              to="/store"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-white text-sm transition-all ${
                location.pathname === "/store" ? "bg-gray-800 shadow-md ring-1 ring-white/30" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-gray-400"><Package size={18} /></span>
              <span>Storefront</span>
            </NavLink>

            {/* Return to Landing */}
            <NavLink
              to="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-white text-sm transition-all ${
                location.pathname === "/" ? "bg-gray-800 shadow-md ring-1 ring-white/30" : "hover:bg-gray-700"
              }`}
            >
              <span className="text-gray-400"><ArrowLeft size={18} /></span>
              <span>Return to Landing</span>
            </NavLink>
          </nav>

          <div className="mt-auto">
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
              className="w-full text-sm rounded-lg py-2 bg-gray-800 hover:bg-gray-700 text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-h-screen flex flex-col">
        <Header />
        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
