// src/pages/Users.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, User } from "lucide-react";

export default function Users() {
  const { authFetch, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    authFetch("/api/users").then(r => r.json()).then(data => {
      setUsers(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addUser = async () => {
    if (!form.name || !form.email || !form.password) return setError("All fields required");
    setSaving(true); setError("");
    try {
      const res = await authFetch("/api/users", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "viewer" });
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Remove this user?")) return;
    await authFetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  };

  const roleBadge = (role) => {
    const map = {
      superadmin: { bg: "#2d1b6b", color: "#a78bfa", label: "Super Admin" },
      "client-admin": { bg: "#1a2d4e", color: "#60a5fa", label: "Admin" },
      viewer: { bg: "#1a2d2e", color: "#34d399", label: "Viewer" }
    };
    const s = map[role] || map.viewer;
    return <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users</h1>
          <p style={styles.sub}>Manage who has access to your organisation's dashboard</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={styles.addBtn}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {showAdd && (
        <div style={styles.addCard}>
          <h3 style={styles.addTitle}>New user</h3>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Full name</label>
              <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" />
            </div>
            <div>
              <label style={styles.label}>Role</label>
              <select style={styles.select} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="viewer">Viewer (read only)</option>
                <option value="client-admin">Admin (manage machines + users)</option>
              </select>
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.formActions}>
            <button onClick={() => setShowAdd(false)} style={styles.cancelBtn}>Cancel</button>
            <button onClick={addUser} disabled={saving} style={styles.saveBtn}>{saving ? "Adding..." : "Add user"}</button>
          </div>
        </div>
      )}

      {loading ? <p style={styles.muted}>Loading users...</p> : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["User", "Role", "Last login", "Status", ""].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={styles.avatar}>{u.name?.charAt(0)?.toUpperCase()}</div>
                      <div>
                        <div style={styles.userName}>{u.name}</div>
                        <div style={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{roleBadge(u.role)}</td>
                  <td style={styles.td}>{u.last_login ? new Date(u.last_login).toLocaleString("en-GB") : "Never"}</td>
                  <td style={styles.td}>
                    <span style={{ color: u.active ? "#4ade80" : "#f87171", fontSize: 12 }}>
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {u.id !== me.id && (
                      <button onClick={() => deleteUser(u.id)} style={styles.deleteBtn}><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "32px 36px", flex: 1, overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 },
  sub: { color: "#6b6b8b", fontSize: 13, marginTop: 4 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  addCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: 24, marginBottom: 24 },
  addTitle: { color: "#fff", fontSize: 16, fontWeight: 600, margin: "0 0 16px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  label: { display: "block", color: "#8b8bab", fontSize: 13, marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#0f0f18", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#0f0f18", color: "#c5c5e0", fontSize: 14, outline: "none" },
  error: { color: "#f87171", fontSize: 13, marginBottom: 12 },
  formActions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancelBtn: { padding: "9px 16px", background: "none", border: "1px solid #2d2d4e", borderRadius: 8, color: "#8b8bab", cursor: "pointer", fontSize: 14 },
  saveBtn: { padding: "9px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  tableCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#6b6b8b", fontSize: 12, fontWeight: 500, padding: "8px 12px", borderBottom: "1px solid #1e1e34", textTransform: "uppercase", letterSpacing: 0.6 },
  tr: { borderBottom: "1px solid #1a1a2e" },
  td: { color: "#c5c5e0", fontSize: 14, padding: "14px 12px" },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName: { color: "#fff", fontWeight: 500, fontSize: 14 },
  userEmail: { color: "#6b6b8b", fontSize: 12 },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 },
  deleteBtn: { background: "none", border: "none", color: "#7f1d1d", cursor: "pointer", padding: 4 },
  muted: { color: "#6b6b8b", fontSize: 14 }
};
