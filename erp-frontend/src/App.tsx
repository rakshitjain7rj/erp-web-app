import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/PrivateRoute";
import LoadingSpinner from "./components/LoadingSpinner";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";

// Core Pages
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import BOM from "./pages/BOM";
import WorkOrders from "./pages/WorkOrders";
import Costing from "./pages/Costing";
import Reports from "./pages/Reports";
import DyeingOrders from "./pages/DyeingOrders";
import Product from "./pages/Product";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import DyeingSummary from "./pages/DyeingSummary"; // ✅ Correct import
import PartyMaster from "./pages/PartyMaster";
import ProductionJobs from "./pages/ProductionJobs";
import ASUUnit2 from "./pages/ASUUnit2";
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

  // Show loading spinner while authentication is being determined
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

        {shouldShowNavbar && <Navbar />}

        <Routes>
          {/* Auth Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
            } 
          />
          <Route path="/unauthorized" element={<Unauthorized />} />          {/* Public Product Page */}
          <Route path="/products" element={<Product />} />
          <Route path="/party-test" element={<PartyMaster />} />
          <Route path="/simple-test" element={<SimplePartyTest />} />
          <Route path="/raw-test" element={<RawDataTest />} />

          {/* Protected Role-Based Pages */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute roles={["admin", "manager", "storekeeper", "operator"]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute roles={["admin", "manager", "storekeeper"]}>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path="/bom"
            element={
              <PrivateRoute roles={["admin", "manager", "storekeeper"]}>
                <BOM />
              </PrivateRoute>
            }
          />
          <Route
            path="/workorders"
            element={
              <PrivateRoute roles={["admin", "manager", "storekeeper"]}>
                <WorkOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/costing"
            element={
              <PrivateRoute roles={["admin"]}>
                <Costing />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute roles={["admin", "manager"]}>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/dyeing-orders"
            element={
              <PrivateRoute roles={["admin", "manager"]}>
                <DyeingOrders />
              </PrivateRoute>
            }
          />          <Route
            path="/dyeing-summary"
            element={
              <PrivateRoute roles={["admin", "manager"]}>
                <DyeingSummary />
              </PrivateRoute>
            }
          />          <Route
            path="/party-master"
            element={
              <PrivateRoute roles={["admin", "manager"]}>
                <PartyMaster />
              </PrivateRoute>
            }
          />
          <Route
            path="/production-jobs"
            element={
              <PrivateRoute roles={["admin", "manager", "operator"]}>
                <ProductionJobs />
              </PrivateRoute>
            }
          />
          <Route
            path="/asu-unit2"
            element={
              <PrivateRoute roles={["admin", "manager", "operator"]}>
                <ASUUnit2 />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute roles={["admin"]}>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute roles={["admin"]}>
                <Settings />
              </PrivateRoute>
            }
          />

          <Route path="/api-test" element={<ApiTest />} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

export default App;
