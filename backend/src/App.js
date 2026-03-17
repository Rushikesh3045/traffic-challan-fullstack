import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import PoliceDashboard from "./pages/PoliceDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAppealDashboard from "./pages/AdminAppealDashboard";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Citizen */}
        <Route path="/citizen" element={
          <ProtectedRoute allowedRoles={["ROLE_CITIZEN"]}>
            <Layout>
              <CitizenDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Protected Routes - Police */}
        <Route path="/police" element={
          <ProtectedRoute allowedRoles={["ROLE_POLICE"]}>
            <Layout>
              <PoliceDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Protected Routes - Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/appeals" element={
          <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
            <Layout>
              <AdminAppealDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
