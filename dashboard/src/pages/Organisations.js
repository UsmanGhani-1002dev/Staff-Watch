// src/pages/Organisations.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Building2, Plus, Users, Monitor, CheckCircle, XCircle } from "lucide-react";

export default function Organisations() {
  const { authFetch } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan: "starter", seat_limit: 5, admin_name: "", admin_email: "", admin_password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const PLAN_SEATS = { starter: 5, growth: 15, pro: 30, enterprise: 100 };

  const load = () => {
    setLoading(true);
    authFetch("/api/organisations").then(r => r.json()).then(data => {
      setOrgs(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const addOrg = async () => {
    setSaving(true); setError("");
    try {
      const res = await authFetch("/api/organisations", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAdd(false);
      setForm({ name: "", slug: "", plan: "starter", seat_limit: 5, admin_name: "", admin_email: "", admin_password: "" });
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggleOrg = async (id, active) => {
    await authFetch(`/api/organisations/${id}`, { method: "PATCH", body: JSON.stringify({ active: active ? 0 : 1 }) });
    load();
  };

  const planColour = { superadmin: "#6366f1", starter: "#22c55e", growth: "#f59e0b", pro: "#06b6d4", enterprise: "#ec4899" };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Organisations</h1>
          <p style={styles.sub}>All client accounts on the platform</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={styles.addBtn}><Plus size={16} /> New Organisation</button>
      </div>

      {showAdd && (
        <div style={styles.addCard}>
          <h3 style={styles.addTitle}>Create new client organisation</h3>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Organisation name</label>
              <input style={styles.input} value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                placeholder="Acme Care Home" />
            </div>
            <div>
              <label style={styles.label}>Slug (URL-safe identifier)</label>
              <input style={styles.input} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="acme-care-home" />
            </div>
            <div>
              <label style={styles.label}>Plan</label>
              <select style={styles.select} value={form.plan} onChange={e => {
                const plan = e.target.value;
                setForm({ ...form, plan, seat_limit: PLAN_SEATS[plan] ?? 5 });
              }}>
                <option value="starter">Starter (5 seats)</option>
                <option value="growth">Growth (15 seats)</option>
                <option value="pro">Pro (30 seats)</option>
                <option value="enterprise">Enterprise (Unlimited)</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Seat limit {form.plan === "enterprise" && <span style={{ color: "#6366f1", fontSize: 11 }}>(You can add specific seats)</span>}</label>
              <input
                style={{ ...styles.input, borderColor: form.plan === "enterprise" ? "#6366f1" : "#2d2d4e" }}
                type="number"
                value={form.seat_limit}
                readOnly={form.plan !== "enterprise"}
                onChange={e => setForm({ ...form, seat_limit: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={styles.label}>Admin name</label>
              <input style={styles.input} value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} placeholder="Peter Johnson" />
            </div>
            <div>
              <label style={styles.label}>Admin email</label>
              <input style={styles.input} type="email" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} placeholder="peter@carehome.co.uk" />
            </div>
            <div>
              <label style={styles.label}>Admin password</label>
              <input style={styles.input} type="password" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} placeholder="Temporary password" />
            </div>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.formActions}>
            <button onClick={() => setShowAdd(false)} style={styles.cancelBtn}>Cancel</button>
            <button onClick={addOrg} disabled={saving} style={styles.saveBtn}>{saving ? "Creating..." : "Create organisation"}</button>
          </div>
        </div>
      )}

      {loading ? <p style={styles.muted}>Loading...</p> : (
        <div style={styles.grid}>
          {orgs.map(org => (
            <div key={org.id} style={styles.orgCard}>
              <div style={styles.orgTop}>
                <div style={styles.orgIcon}>
                  <Building2 size={20} color="#6366f1" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.orgName}>{org.name}</div>
                  <div style={styles.orgSlug}>/{org.slug}</div>
                </div>
                <span style={{ ...styles.planBadge, background: (planColour[org.plan] || "#6366f1") + "22", color: planColour[org.plan] || "#6366f1" }}>
                  {org.plan}
                </span>
              </div>

              <div style={styles.orgStats}>
                <div style={styles.orgStat}><Users size={13} color="#6b6b8b" /> <span>{org.user_count || 0} users</span></div>
                <div style={styles.orgStat}><Monitor size={13} color="#6b6b8b" /> <span>{org.machine_count || 0} / {org.seat_limit} machines</span></div>
              </div>

              <div style={styles.orgFooter}>
                <span style={{ color: org.active ? "#4ade80" : "#f87171", fontSize: 12 }}>
                  {org.active ? "Active" : "Suspended"}
                </span>
                {org.slug !== "enovtec" && (
                  <button onClick={() => toggleOrg(org.id, org.active)} style={styles.toggleBtn}>
                    {org.active ? <XCircle size={14} color="#f87171" /> : <CheckCircle size={14} color="#4ade80" />}
                    {org.active ? "Suspend" : "Reactivate"}
                  </button>
                )}
              </div>
            </div>
          ))}
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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  orgCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14 },
  orgTop: { display: "flex", alignItems: "flex-start", gap: 12 },
  orgIcon: { width: 40, height: 40, background: "#6366f111", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  orgName: { color: "#fff", fontWeight: 600, fontSize: 15 },
  orgSlug: { color: "#6b6b8b", fontSize: 12, marginTop: 2, fontFamily: "monospace" },
  planBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  orgStats: { display: "flex", gap: 16 },
  orgStat: { display: "flex", alignItems: "center", gap: 6, color: "#8b8bab", fontSize: 13 },
  orgFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1e1e34", paddingTop: 12 },
  toggleBtn: { display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#8b8bab", cursor: "pointer", fontSize: 12 },
  muted: { color: "#6b6b8b", fontSize: 14 }
};
