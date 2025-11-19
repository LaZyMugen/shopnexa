import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Deprecated: dashboard now replaced by AdminDashboard (/admin)
export default function DashboardRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
  navigate("/landing", { replace: true });
  }, [navigate]);
  return null;
}
