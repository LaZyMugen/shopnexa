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
import Onboarding from "./pages/onboarding";
import RetailerDashboard from "./pages/retailerDashboard";
import { ThemeProvider } from "./context/themeContext";
import { CartProvider } from "./context/cartContext";
import ManageProducts from "./pages/manageProducts";
import ManageMyProducts from "./pages/manageMyProducts";
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

// Admin Route: allows only verified admin users (via admin_auth flag or admin email)
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const adminFlag = localStorage.getItem('admin_auth') === 'true';
  const isAdminUser = user && (user.email === 'shaswatsahoo234@gmail.com');

  if (adminFlag || isAdminUser) return children;
  // If not authorized, send user to the landing page and trigger the admin modal there
  // Landing will open the admin login box when `showAdmin=1` is present in the query string.
  return <Navigate to="/landing?showAdmin=1" replace />;
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
  // If there's no authenticated user, render the public children.
  if (!user) return children;

  // If we have a user, decide where to redirect. For retailer/wholesaler
  // roles we must ensure onboarding is complete before sending to landing.
  try {
    if (user.role === 'retailer' || user.role === 'wholesaler') {
      const all = JSON.parse(localStorage.getItem('retailer_profiles') || '[]');
      const profile = all.find(p => p.retailerId === user.id);
      const needsOnboarding = !profile || !profile.businessName || !profile.address || !profile.pincode || !profile.categories || profile.categories.length === 0;
      if (needsOnboarding) return <Navigate to="/onboarding" replace />;
    }
  } catch (e) {
    // If reading localStorage fails for any reason, conservatively send to onboarding
    console.warn('PublicRoute localStorage read failed', e);
    if (user.role === 'retailer' || user.role === 'wholesaler') return <Navigate to="/onboarding" replace />;
  }

  // Default for authenticated users: landing
  return <Navigate to="/landing" replace />;
};

function App() {
  return (
    <Router>
    <ErrorBoundary>
      
  <ThemeProvider>
  <SupportButton />
  {/* Profile floating button removed per design — no floating profile in header/side */}
  <CartProvider>
    <Routes>

  {/* Root → signup for unauthenticated users (logged-in users will be routed by PublicRoute) */}
  <Route path="/" element={<Navigate to="/signup" replace />} />
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

        {/* Retailer onboarding (demo) */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/retailer/dashboard" element={<ProtectedRoute><RetailerDashboard /></ProtectedRoute>} />
  <Route path="/manage-products" element={<ProtectedRoute><ManageMyProducts /></ProtectedRoute>} />

        {/* (removed /dashboard) root now points to /admin */}
  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
  <Route path="/admin/products" element={<AdminRoute><ManageProducts /></AdminRoute>} />
  <Route path="/admin/categories" element={<AdminRoute><ManageCategories /></AdminRoute>} />
  <Route path="/admin/orders" element={<AdminRoute><ManageOrders /></AdminRoute>} />
  <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
  <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
  <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

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
