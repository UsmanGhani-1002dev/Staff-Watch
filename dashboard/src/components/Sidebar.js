// src/components/Sidebar.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Monitor, LayoutDashboard, Camera, BarChart2,
  Users, Building2, LogOut, Settings
} from "lucide-react";

export default function Sidebar() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { to: "/machines", icon: Monitor, label: "Machines" },
    { to: "/screenshots", icon: Camera, label: "Screenshots" },
    { to: "/activity", icon: BarChart2, label: "Activity" },
    { to: "/users", icon: Users, label: "Users" },
    ...(isSuperAdmin ? [{ to: "/organisations", icon: Building2, label: "Organisations" }] : []),
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <Monitor size={22} color="#6366f1" />
        <span style={styles.logoText}>StaffWatch</span>
      </div>

      <div style={styles.orgBadge}>
        <div style={styles.orgName}>{user?.org_name}</div>
        <div style={styles.orgRole}>{user?.role}</div>
      </div>

      <nav style={styles.nav}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {})
          })}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { width: 240, minHeight: "100vh", background: "#0f0f18", borderRight: "1px solid #1e1e34", display: "flex", flexDirection: "column", padding: "0 0 20px 0", flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "24px 20px 16px", borderBottom: "1px solid #1e1e34" },
  logoText: { fontSize: 18, fontWeight: 700, color: "#fff" },
  orgBadge: { padding: "12px 20px", borderBottom: "1px solid #1e1e34" },
  orgName: { color: "#c5c5e0", fontSize: 13, fontWeight: 600 },
  orgRole: { color: "#6b6b8b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 },
  nav: { flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, color: "#8b8bab", textDecoration: "none", fontSize: 14, transition: "all 0.15s" },
  navItemActive: { background: "#1e1e34", color: "#fff" },
  bottom: { padding: "0 12px", borderTop: "1px solid #1e1e34", paddingTop: 16 },
  userInfo: { display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName: { color: "#c5c5e0", fontSize: 13, fontWeight: 500 },
  userEmail: { color: "#6b6b8b", fontSize: 11 },
  logoutBtn: { width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "none", border: "1px solid #2d2d4e", borderRadius: 8, color: "#8b8bab", cursor: "pointer", fontSize: 13 }
};
