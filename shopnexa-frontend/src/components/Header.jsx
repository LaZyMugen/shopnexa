import { Search, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/authContext";

export default function Header() {
  const { user } = useAuth();
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [jingle, setJingle] = useState(false);
  const [toastText, setToastText] = useState("");
  const [toastVariant, setToastVariant] = useState("on"); // 'on' | 'off'

  const handleBellClick = () => {
    setNotificationsOn((prev) => {
      const next = !prev;
      setToastText(next ? "Notifications turned on!" : "Notifications turned off");
      setToastVariant(next ? "on" : "off");
      setJingle(true);
      setShowToast(true);
      // stop jingle animation after a short duration
      setTimeout(() => setJingle(false), 600);
      // hide toast after a moment
      setTimeout(() => setShowToast(false), 2000);
      return next;
    });
  };

  return (
    <header className="w-full p-4 border-b border-white/20 bg-white/20 backdrop-blur-md">
      <div className="max-w-[1300px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              placeholder="Search products, orders..."
              className="pl-10 pr-4 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-white/10 text-sm outline-none w-72 focus:ring-2 focus:ring-sky-200"
            />
            <div className="absolute left-3 top-2.5 text-slate-700">
              <Search size={16} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-white text-xs shadow opacity-0 group-hover:opacity-100 transition">
              {notificationsOn ? "Turn off notifications?" : "Turn on notifications?"}
            </div>
            <button
              onClick={handleBellClick}
              className="p-2 rounded-lg bg-white/30 hover:bg-white/40 transition"
              aria-label="Notifications"
              aria-pressed={notificationsOn}
              title="Notifications"
            >
              <Bell size={18} className={`${notificationsOn ? 'text-green-700' : 'text-slate-700'} ${jingle ? 'animate-bell-jingle' : ''}`} />
            </button>
          </div>

          <div
            className="flex items-center gap-3"
            title={user?.email || user?.name || 'Admin'}
            aria-label={user?.email || user?.name || 'Admin'}
            tabIndex={0}
          >
            <div className="text-sm text-slate-800">
              <div className="font-medium">{user?.name || user?.email || "Admin"}</div>
              <div className="text-xs text-slate-600">Administrator</div>
            </div>
            {/* Profile avatar removed as requested */}
          </div>
        </div>
      </div>
      {/* Toast */}
      {showToast && (
        <div
          className={`fixed top-16 right-4 z-50 ${toastVariant === 'on' ? 'bg-green-600' : 'bg-rose-600'} text-white text-sm px-4 py-2 rounded-md shadow-lg`}
          role="status"
          aria-live="polite"
        >
          {toastText}
        </div>
      )}
    </header>
  );
}
