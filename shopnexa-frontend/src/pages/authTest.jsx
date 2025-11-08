import { useState } from "react";
import { useAuth } from "../context/authContext";

export default function AuthTest() {
  const { signup, login, user, logout, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await signup(email, password);
      console.log("Signup success:", res);
      setSuccess("Signup successful! Check console for details.");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Signup failed";
      setError(errorMsg);
      console.error("Signup error:", err);
    }
  };

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await login(email, password);
      console.log("Login success:", res);
      setSuccess("Login successful! Check console for details.");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Login failed";
      setError(errorMsg);
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-white bg-gray-900 p-4">
      <h1 className="text-2xl font-bold">Auth Test</h1>
      
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-300 max-w-md text-center">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-500/20 border border-green-500 rounded text-green-300 max-w-md text-center">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          className="p-2 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSignup}
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !email || !password}
        >
          {loading ? "Loading..." : "Signup"}
        </button>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !email || !password}
        >
          {loading ? "Loading..." : "Login"}
        </button>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 disabled:opacity-50"
          disabled={!user}
        >
          Logout
        </button>
      </div>

      {user ? (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded">
          <p className="text-green-300 font-semibold">Logged in as:</p>
          <p className="text-green-200">{user.email || user.id || "Unknown"}</p>
          {user.id && <p className="text-gray-400 text-sm mt-1">ID: {user.id}</p>}
        </div>
      ) : (
        <div className="mt-4 text-gray-400">No user logged in</div>
      )}
    </div>
  );
}
    