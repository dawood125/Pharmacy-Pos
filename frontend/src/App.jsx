import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./common/Layout";
import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/Pos.jsx";
import InventoryManagement from "./pages/InventoryManagement.jsx";
import CustomerReturn from "./pages/CustomerReturn.jsx";
import Report from "./pages/Report.jsx";
import Login from "./pages/Login.jsx";
import Users from "./pages/Users.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes (wrapped in Layout) */}
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/pos"
        element={
          <Layout>
            <POS />
          </Layout>
        }
      />
      <Route
        path="/inventory-management"
        element={
          <Layout>
            <InventoryManagement />
          </Layout>
        }
      />
      <Route
        path="/customer-management"
        element={
          <Layout>
            <CustomerReturn />
          </Layout>
        }
      />
      <Route
        path="/reports"
        element={
          <Layout>
            <Report />
          </Layout>
        }
      />
      <Route
        path="/users"
        element={
          <Layout>
            <Users />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}