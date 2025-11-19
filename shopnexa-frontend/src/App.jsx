import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import AuthTest from "./pages/authTest";
import { useAuth } from "./context/authContext";
import AdminDashboard from "./pages/AdminDashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import Storefront from "./pages/Storefront";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";
import SupportButton from "./components/SupportButton";
import ProfileButton from "./components/ProfileButton";
import { ThemeProvider } from "./context/themeContext";
import { CartProvider } from "./context/cartContext";
import ManageProducts from "./pages/manageProducts";
import ManageCategories from "./pages/ManageCategories";
import ManageOrders from "./pages/ManageOrders";
import ManageUsers from "./pages/ManageUsers";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import OrderSummary from "./pages/OrderSummary";
import Payment from "./pages/Payment";


// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // If there's a token stored, allow the route to render while auth validation
  // completes. This prevents an immediate redirect to /login when the server
  // responds with 304 or other cache responses.
  const token = localStorage.getItem("token");

  if (user) return children;
  if (token) return children;

  return <Navigate to="/login" replace />;
};

// Public Route (block when logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // If a token exists, consider the user effectively 'logged in' for routing
  // purposes — the AuthProvider will clear it if it's invalid and trigger
  // a redirect later. This avoids flicker/redirects when /auth/me returns 304.
  const token = localStorage.getItem("token");
  return user || token ? <Navigate to="/landing" replace /> : children;
};

function App() {
  return (
    <Router>
    <ErrorBoundary>
  <ThemeProvider>
  <SupportButton />
  {/* Hide profile button on the landing page */}
  {window?.location?.pathname !== "/landing" && <ProfileButton />}
  <CartProvider>
    <Routes>

  {/* Root → landing */}
  <Route path="/" element={<Navigate to="/landing" replace />} />
  <Route path="/landing" element={<ProtectedRoute><Landing /></ProtectedRoute>} />

        {/* Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* (removed /dashboard) root now points to /admin */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><ManageProducts /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><ManageCategories /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><ManageOrders /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Public Storefront for demo */}
  <Route path="/store" element={<Storefront />} />
    <Route path="/product/:id" element={<ProductDetails />} />
    <Route path="/feedback" element={<Feedback />} />
    <Route path="/checkout" element={<Checkout />} />
  <Route path="/order-summary/:orderId" element={<OrderSummary />} />
  <Route path="/payment/:orderId" element={<Payment />} />
    <Route path="/profile" element={<Profile />} />

        {/* Temporary auth test */}
        <Route path="/test" element={<AuthTest />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <Link to="/admin" className="text-blue-600 hover:underline">
                  Go to Admin
                </Link>
              </div>
            </div>
          }
        />
        </Routes>
        </CartProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
