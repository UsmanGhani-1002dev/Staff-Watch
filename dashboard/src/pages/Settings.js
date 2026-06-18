// src/pages/Settings.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Save } from "lucide-react";

export default function Settings() {
  const { authFetch, user } = useAuth();
  const [form, setForm] = useState({
    screenshot_interval_min: 5,
    screenshot_interval_max: 15,
    screenshot_retention_days: 30
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await authFetch(`/api/organisations/${user.org_id}`, {
      method: "PATCH",
      body: JSON.stringify(form)
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.card}>
        <h3 style={styles.section}>Screenshot settings</h3>
        <p style={styles.desc}>Screenshots are taken at random intervals within the range you set. Randomness prevents predictable patterns.</p>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Minimum interval (minutes)</label>
            <input style={styles.input} type="number" min={1} max={60} value={form.screenshot_interval_min}
              onChange={e => setForm({ ...form, screenshot_interval_min: parseInt(e.target.value) })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Maximum interval (minutes)</label>
            <input style={styles.input} type="number" min={1} max={120} value={form.screenshot_interval_max}
              onChange={e => setForm({ ...form, screenshot_interval_max: parseInt(e.target.value) })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Screenshot retention (days)</label>
            <input style={styles.input} type="number" min={7} max={365} value={form.screenshot_retention_days}
              onChange={e => setForm({ ...form, screenshot_retention_days: parseInt(e.target.value) })} />
          </div>
        </div>

        <button onClick={save} disabled={saving} style={styles.saveBtn}>
          <Save size={15} /> {saved ? "Saved!" : saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.section}>Account</h3>
        <div style={styles.accountInfo}>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Name</span><span style={styles.infoVal}>{user.name}</span></div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Email</span><span style={styles.infoVal}>{user.email}</span></div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Role</span><span style={styles.infoVal}>{user.role}</span></div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Organisation</span><span style={styles.infoVal}>{user.org_name}</span></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "32px 36px", flex: 1, overflowY: "auto" },
  title: { color: "#fff", fontSize: 24, fontWeight: 700, marginBottom: 24 },
  card: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "24px 28px", marginBottom: 20 },
  section: { color: "#fff", fontSize: 16, fontWeight: 600, margin: "0 0 8px" },
  desc: { color: "#8b8bab", fontSize: 13, margin: "0 0 20px" },
  row: { display: "flex", gap: 20, marginBottom: 20 },
  field: { flex: 1 },
  label: { display: "block", color: "#8b8bab", fontSize: 13, marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#0f0f18", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" },
  saveBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#6366f1", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  accountInfo: { display: "flex", flexDirection: "column", gap: 12 },
  infoRow: { display: "flex", gap: 16 },
  infoLabel: { color: "#6b6b8b", fontSize: 14, width: 130, flexShrink: 0 },
  infoVal: { color: "#c5c5e0", fontSize: 14 }
};
