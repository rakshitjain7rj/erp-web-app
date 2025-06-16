import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Inventory from "./pages/Inventory";
import BOM from "./pages/BOM";
import WorkOrders from "./pages/WorkOrders";
import Costing from "./pages/Costing";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";

const App = () => {
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;

  return (
    <Router>
      {isAuthenticated && <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {isAuthenticated ? (
          <>
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/bom" element={<BOM />} />
            <Route path="/workorders" element={<WorkOrders />} />
            <Route path="/costing" element={<Costing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
