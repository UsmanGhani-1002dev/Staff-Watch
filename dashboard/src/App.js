// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import Screenshots from "./pages/Screenshots";
import Activity from "./pages/Activity";
import Users from "./pages/Users";
import Organisations from "./pages/Organisations";
import Settings from "./pages/Settings";

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ background: "#0f0f18", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6b8b", fontFamily: "system-ui" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0c18", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  );
}

function SuperAdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "superadmin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/machines" element={<ProtectedLayout><Machines /></ProtectedLayout>} />
          <Route path="/screenshots" element={<ProtectedLayout><Screenshots /></ProtectedLayout>} />
          <Route path="/activity" element={<ProtectedLayout><Activity /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="/organisations" element={
            <ProtectedLayout>
              <SuperAdminRoute><Organisations /></SuperAdminRoute>
            </ProtectedLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
