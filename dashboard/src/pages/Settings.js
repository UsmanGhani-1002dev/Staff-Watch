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
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

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

  const changePassword = async () => {
    setPwError(""); setPwSuccess(false);
    if (!pwForm.current || !pwForm.newPw) return setPwError("Tamam fields bharein");
    if (pwForm.newPw !== pwForm.confirm) return setPwError("Nayi passwords match nahi karti");
    if (pwForm.newPw.length < 6) return setPwError("Password kam az kam 6 characters ka hona chahiye");
    setPwSaving(true);
    try {
      const res = await authFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: pwForm.newPw })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwSuccess(true);
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) { setPwError(e.message); }
    finally { setPwSaving(false); }
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

      <div style={styles.card}>
        <h3 style={styles.section}>Change Password</h3>
        <p style={styles.desc}>Apna account password tabdeel karein.</p>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Current Password</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={pwForm.current}
              onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={pwForm.newPw}
              onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={pwForm.confirm}
              onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
        </div>
        {pwError && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{pwError}</div>}
        {pwSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 12 }}>✅ Password successfully change ho gaya!</div>}
        <button onClick={changePassword} disabled={pwSaving} style={styles.saveBtn}>
          🔒 {pwSuccess ? "Changed!" : pwSaving ? "Saving..." : "Update Password"}
        </button>
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
