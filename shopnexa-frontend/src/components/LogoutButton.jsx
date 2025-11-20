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

  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className={`text-red-600 hover:text-red-700 font-semibold text-sm ${className}`}
      style={{ background: 'transparent', border: 'none', padding: 0 }}
    >
      Logout
    </button>
  );
}
