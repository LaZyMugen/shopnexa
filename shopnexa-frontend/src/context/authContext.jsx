import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true for initial check

  // Register
  const signup = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/signup", { email, password });
      console.log("Signup success:", res.data);
      
      // Check for session token (indicates auto-login is possible)
      const token = res.data.session?.access_token;
      const userData = res.data.user || res.data.session?.user;
      
      if (token) {
        // Session exists - auto-login the user
        localStorage.setItem("token", token);
        if (userData) {
          setUser(userData);
        } else {
          // If we have token but no userData, fetch user info
          try {
            const userRes = await api.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.data?.user) {
              setUser(userRes.data.user);
            }
          } catch (fetchErr) {
            console.error("Failed to fetch user after signup:", fetchErr);
          }
        }
      } else {
        // No session - email confirmation likely required
        // Don't set user, but return success so UI can show appropriate message
        // User will need to confirm email and then login
        console.log("Signup successful but no session - email confirmation may be required");
      }
      
      return res.data;
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.session?.access_token;
      if (token) {
        localStorage.setItem("token", token);
        const userData = res.data.user || res.data.session?.user;
        if (userData) {
          setUser(userData);
        } else {
          // If no user data in response, fetch it
          try {
            const userRes = await api.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.data?.user) {
              setUser(userRes.data.user);
            }
          } catch (fetchErr) {
            console.error("Failed to fetch user after login:", fetchErr);
          }
        }
      }
      return res.data;
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-load user if token exists
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Clear user state immediately while validating
      setUser(null);

      try {
        // Explicitly attach token to ensure it's sent (interceptor also handles this, but being explicit here)
        const res = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Only set user if we got a valid response
        if (res.data?.user) {
          setUser(res.data.user);
        } else {
          // Invalid response, clear token
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (err) {
        // Token is invalid or expired
        console.error("Auth check failed:", err.response?.data || err.message);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
    