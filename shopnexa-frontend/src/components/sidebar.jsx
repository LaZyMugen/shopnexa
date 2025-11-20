import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  ArrowLeft,
  FolderTree,
} from "lucide-react";

export default function AdminSidebar() {
  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-[#111] !bg-black shadow-2xl text-gray-200 flex flex-col border-r border-gray-800">
      
      {/* Logo */}
      <div className="h-28 flex flex-col items-center justify-center px-6 border-b border-gray-800">
        <NavLink to="/admin" className="flex items-center flex-col">
          <img src="/images-removebg-preview.svg" alt="ShopNexa logo" className="h-12 mt-0 cursor-pointer" />
          <div className="text-xs text-gray-400 mt-2">Admin Panel</div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <SidebarItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" />
        <SidebarItem to="/retailer/dashboard" icon={<ArrowLeft />} label="Retailer dashboard" />
        <SidebarItem to="/admin/products" icon={<Package />} label="Products" />
        <SidebarItem to="/admin/categories" icon={<FolderTree />} label="Categories" />
        <SidebarItem to="/admin/orders" icon={<ShoppingCart />} label="Orders" />
        <SidebarItem to="/admin/users" icon={<Users />} label="Users" />
        <SidebarItem to="/admin/analytics" icon={<BarChart2 />} label="Analytics" />
        <div className="mt-6 mb-2 px-6 text-[10px] tracking-wide uppercase text-gray-500">Public</div>
        <div className="px-2">
          <SidebarItem to="/store" icon={<Package />} label="Storefront" />
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        {/* Prominent Return to Landing button placed above settings/logout for visibility */}
        <div className="mb-3 px-2">
          <a href="/landing" className="block w-full text-center px-6 py-3 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600">Return to Landing</a>
        </div>
        <SidebarItem to="/admin/settings" icon={<Settings />} label="Settings" />
        <SidebarItem to="/logout" icon={<LogOut />} label="Logout" />
      </div>
    </div>
  );
}

// Reusable Component
function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-3 my-1 rounded-lg transition ${
          isActive
            ? "bg-blue-600 text-white shadow-lg"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`
      }
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}
