import { Routes, Route } from "react-router-dom";

import Layout from "./common/Layout";
import Dashboard from "./pages/Dashboard.jsx";
import POS from "./pages/Pos.jsx";
import InventoryManagement from "./pages/InventoryManagement.jsx";
import CustomerReturn from "./pages/CustomerReturn.jsx";
import Report from "./pages/Report.jsx";

export default function App() {
  return (
    <Routes>

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

    </Routes>
  );
}