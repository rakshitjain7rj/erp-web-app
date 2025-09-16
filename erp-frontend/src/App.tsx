import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import LoadingSpinner from "./components/LoadingSpinner";

// PWA Components
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAInstallBanner from "./components/PWAInstallBanner";
import OfflineIndicator from "./components/OfflineIndicator";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";

// Core Pages
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import Inventory from "./pages/Inventory";
// Removed unused pages: BOM, WorkOrders, Costing
// Removed: Reports
import DyeingOrders from "./pages/DyeingOrders";
import Product from "./pages/Product";
// Removed: Users
// Removed: Settings
import PartyMaster from "./pages/PartyMaster";
import ArchivedParties from "./pages/ArchivedParties";
import ASUUnit1Page from "./pages/ASUUnit1Page";
import CountProductOverview from "./pages/CountProductOverview";
import ASUUnit2Page from "./pages/ASUUnit2Page";
import ASUAuthTest from "./components/ASUAuthTest";
import ApiTest from "./components/ApiTest";
import SimplePartyTest from "./components/SimplePartyTest";
import RawDataTest from "./components/RawDataTest";

import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const hideNavbarRoutes = ["/login", "/register", "/signup"];
  const shouldShowNavbar = isAuthenticated && !hideNavbarRoutes.includes(location.pathname);

  if (isLoading) {
    return (
      <ThemeProvider>
        <LoadingSpinner text="Checking authentication..." />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen text-black transition-all duration-300 bg-white dark:bg-gray-950 dark:text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "10px",
              padding: "12px 16px",
              background: "#ffffff",
              color: "#1f2937",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ecfdf5",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fee2e2",
              },
            },
          }}
        />

        {/* Routes without Navbar (Auth pages) */}
        {!shouldShowNavbar && (
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/products" element={<Product />} />
            <Route path="/party-test" element={<PartyMaster />} />
            <Route path="/archived-parties" element={<ArchivedParties />} />
            <Route path="/count-product-overview" element={<CountProductOverview />} />
            <Route path="/simple-test" element={<SimplePartyTest />} />
            <Route path="/raw-test" element={<RawDataTest />} />
            <Route path="/api-test" element={<ApiTest />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}

        {/* Routes with Navbar (Protected App) */}
        {shouldShowNavbar && (
          <>
            <Navbar />

            <div className="px-4 pt-16">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute roles={["superadmin", "admin", "manager"]}>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <PrivateRoute roles={["superadmin", "admin", "manager"]}>
                      <Inventory />
                    </PrivateRoute>
                  }
                />
                {/** BOM removed */}
                {/** Work Orders removed */}
                {/** Costing removed */}
                {/** Reports removed */}
                <Route
                  path="/dyeing-orders"
                  element={
                    <PrivateRoute roles={["superadmin", "admin"]}>
                      <DyeingOrders />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/party-master"
                  element={
                    <PrivateRoute roles={["superadmin", "admin"]}>
                      <PartyMaster />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/production/asu-unit-1"
                  element={
                    <PrivateRoute roles={["superadmin", "admin", "manager"]}>
                      <ASUUnit1Page />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/production/asu-unit-2"
                  element={
                    <PrivateRoute roles={["superadmin", "admin", "manager"]}>
                      <ASUUnit2Page />
                    </PrivateRoute>
                  }
                />
                {/* ASUMachineManagerPage route removed - functionality now in ASUUnit1Page */}
                <Route
                  path="/test/asu-auth"
                  element={
                    <PrivateRoute roles={["superadmin", "admin", "manager"]}>
                      <ASUAuthTest />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <PrivateRoute roles={["superadmin", "admin"]}>
                      <UsersPage />
                    </PrivateRoute>
                  }
                />
                {/** Users removed */}
                {/** Settings removed */}
                <Route path="/products" element={<Product />} />
                <Route path="/party-test" element={<PartyMaster />} />
                <Route path="/archived-parties" element={<ArchivedParties />} />
                <Route path="/count-product-overview" element={<CountProductOverview />} />
                <Route path="/simple-test" element={<SimplePartyTest />} />
                <Route path="/raw-test" element={<RawDataTest />} />
                <Route path="/api-test" element={<ApiTest />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </>
        )}
        
        {/* PWA Components - always available */}
        <PWAInstallBanner />
        <PWAInstallPrompt />
        <OfflineIndicator />
      </div>
    </ThemeProvider>
  );
};

export default App;
