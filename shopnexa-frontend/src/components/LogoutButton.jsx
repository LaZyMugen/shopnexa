import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function LogoutButton({ className = "" }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    try { logout(); } catch (err) { console.warn('logout error', err); }
    try { localStorage.removeItem('demo_users'); localStorage.removeItem('admin_auth'); } catch (err) { console.warn('localStorage cleanup failed', err); }
    navigate('/signup');
  };

  // High-contrast pill so it's visible both on light and dark backgrounds.
  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-semibold ${className}`}
      aria-label="Logout"
    >
      Logout
    </button>
  );
}
