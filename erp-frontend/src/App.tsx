import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Inventory from "./pages/Inventory";
import BOM from "./pages/BOM";
import WorkOrders from "./pages/WorkOrders";
import Costing from "./pages/Costing";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Unauthorized from "./pages/Unauthorized";
import Signup from "./pages/Signup";
import Product from "./pages/Product";
import { Toaster } from "react-hot-toast";
import DyeingOrders from "./pages/DyeingOrders";
import DyeingSummary from "./pages/DyeingSummary";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-gray-950 text-black dark:text-white transition-all duration-300">
          {/* 🔔 Toast Notification Provider */}
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

          {/* 🔗 Navbar for authenticated users */}
          {isAuthenticated && <Navbar />}

          {/* 🔐 Routes */}
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/products" element={<Product />} />
            <Route
              path="/dyeing-orders"
              element={
                <PrivateRoute>
                  <DyeingOrders />
                </PrivateRoute>
              }
            />
            <Route
  path="/dyeing-summary"
  element={
    <PrivateRoute roles={["admin", "manager"]}>
      <DyeingSummary />
    </PrivateRoute>
  }
/>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={["admin", "manager"]}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <PrivateRoute roles={["admin", "manager", "operator"]}>
                  <Inventory />
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
              path="/bom"
              element={
                <PrivateRoute roles={["admin", "operator"]}>
                  <BOM />
                </PrivateRoute>
              }
            />
            <Route
              path="/workorders"
              element={
                <PrivateRoute roles={["admin", "operator"]}>
                  <WorkOrders />
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
            {/* 🔁 Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </ThemeProvider>
    </>
  );
};

export default App;
