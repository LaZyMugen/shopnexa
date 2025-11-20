/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true for initial check

  //signup (now supports client-side demo role-based signup)
  const signup = async (email, password, role = 'customer') => {
  try {
    setLoading(true);
      // Try server signup first; if backend unavailable or returns error, fall back to client-side demo
      try {
        const res = await api.post("/auth/signup", { email, password, role });
        const token = res.data?.session?.access_token || res.data?.token || res.data?.accessToken;
        const userData = res.data?.user || res.data?.session?.user;
        if (token) {
          localStorage.setItem("token", token);
          if (userData) setUser(userData);
        }
        return res.data;
      } catch (err) {
        console.warn('Signup fallback (server error)', err);
        // Fallback: persist a demo user in localStorage
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const id = `local-${Date.now()}`;
        const userObj = { id, email, role, createdAt: new Date().toISOString() };
        users.push(userObj);
        localStorage.setItem('demo_users', JSON.stringify(users));
        // Create a demo token and set user
        localStorage.setItem('token', `__demo_token__:${id}`);
        setUser(userObj);
        return { user: userObj, demo: true };
      }
  } catch (err) {
    console.error("Signup error:", err.response?.data || err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};


//login
 const login = async (email, password) => {
  try {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.session?.access_token || res.data?.token || res.data?.accessToken;
      const userData = res.data?.user || res.data?.session?.user;
      if (!token) throw new Error("No token returned from backend");
      localStorage.setItem("token", token);
      if (userData) setUser(userData);
      return res.data;
    } catch (err) {
      // Fallback: try to login against demo_users in localStorage
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const found = users.find(u => u.email === email);
      if (found) {
        const id = found.id;
        localStorage.setItem('token', `__demo_token__:${id}`);
        setUser(found);
        return { user: found, demo: true };
      }
      throw err;
    }
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    throw err;
  } finally {
    setLoading(false);
  }
};

 useEffect(() => {
  let mounted = true;
  const controller = new AbortController();

  const fetchUser = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      if (!mounted) return;
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // axios supports AbortController via `signal`
      const res = await api.get("/auth/me", { signal: controller.signal });
      if (!mounted) return;

      // If server returns 304 Not Modified it may return no body — don't treat that
      // as an auth failure. Keep token in storage and let the app stay mounted.
      if (res?.status === 304) {
        if (mounted) setLoading(false);
        return;
      }

      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        // No user in response — clear token and consider unauthenticated
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (err) {
      if (!mounted) return;
      // If request was aborted, don't modify state
      if (err?.name === "CanceledError" || err?.message === "canceled") {
        return;
      }
      console.error("Auth check failed:", err.response?.data || err.message);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  fetchUser();

  return () => {
    mounted = false;
    controller.abort();
  };
}, []);


  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    // For demo flows: simulate a logged-in user without a real token
    simulateLogin: (demoUser = { email: "demo@local", role: "demo" }) => {
      try {
        localStorage.setItem("token", "__demo_token__");
        setUser(demoUser);
      } catch (e) {
        console.error("simulateLogin failed", e);
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
