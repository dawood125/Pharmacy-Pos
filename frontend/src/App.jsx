import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./common/Toast.jsx";
import { SettingsProvider } from "./common/SettingsContext.jsx";

import Layout from "./common/Layout";
import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/Pos.jsx";
import InventoryManagement from "./pages/InventoryManagement.jsx";
import CustomerReturn from "./pages/CustomerReturn.jsx";
import Report from "./pages/Report.jsx";
import Login from "./pages/Login.jsx";
import Users from "./pages/Users.jsx";
import Settings from "./pages/Settings.jsx";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (wrapped in Layout) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <Layout>
                  <POS />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory-management"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventoryManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-management"
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerReturn />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Report />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </ToastProvider>
  );
}