// src/pages/Machines.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, Trash2, Copy, Monitor, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function Machines() {
  const { authFetch } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newToken, setNewToken] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const load = () => {
    setLoading(true);
    authFetch("/api/machines")
      .then(r => r.json())
      .then(setMachines)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addMachine = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await authFetch("/api/machines", {
        method: "POST",
        body: JSON.stringify({ label: newLabel.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewToken(data.token);
      setNewLabel("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const deleteMachine = async (id) => {
    if (!window.confirm("Remove this machine?")) return;
    await authFetch(`/api/machines/${id}`, { method: "DELETE" });
    load();
  };

  const copy = async (text, id) => {
    try {
      // navigator.clipboard only exists in secure contexts (HTTPS / localhost).
      // On plain HTTP it's undefined, so fall back to the legacy execCommand.
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      setError("Could not copy — please select and copy manually");
    }
  };

  const isOnline = (lastSeen) => lastSeen && (new Date() - new Date(lastSeen.replace(' ', 'T') + 'Z')) < 2 * 60 * 1000;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Machines</h1>
          <p style={styles.sub}>Each machine needs the agent installed with its unique token</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={load} style={styles.iconBtn}><RefreshCw size={16} /></button>
          <button onClick={() => { setShowAdd(!showAdd); setNewToken(null); }} style={styles.addBtn}>
            <Plus size={16} /> Add Machine
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={styles.addCard}>
          <h3 style={styles.addTitle}>Add a new machine</h3>
          <p style={styles.addSub}>Give it a label (e.g. "Reception PC", "Manager Office"), then download the installer config.</p>
          <div style={styles.addRow}>
            <input
              style={styles.input}
              placeholder="Machine label..."
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addMachine()}
            />
            <button onClick={addMachine} disabled={adding} style={styles.addBtn}>
              {adding ? "Creating..." : "Create"}
            </button>
          </div>
          {error && <div style={styles.error}>{error}</div>}

          {newToken && (
            <div style={styles.tokenBox}>
              <div style={styles.tokenLabel}>✅ Machine created! Copy this token and put it in the agent's config.json</div>
              <div style={styles.tokenRow}>
                <code style={styles.token}>{newToken}</code>
                <button onClick={() => copy(newToken, "new")} style={styles.copyBtn}>
                  {copiedId === "new" ? "Copied!" : <Copy size={14} />}
                </button>
              </div>
              <div style={styles.tokenNote}>
                In config.json set: <code style={styles.inlineCode}>"machine_token": "{newToken}"</code>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? <p style={styles.muted}>Loading machines...</p> : (
        <div style={styles.grid}>
          {machines.map(m => {
            const online = isOnline(m.last_seen);
            return (
              <div key={m.id} style={styles.machineCard}>
                <div style={styles.machineTop}>
                  <div style={styles.machineIcon}>
                    <Monitor size={20} color={online ? "#22c55e" : "#6b6b8b"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.machineName}>{m.label}</div>
                    <div style={styles.machineHostname}>{m.hostname || "Not connected yet"}</div>
                  </div>
                  <span style={{ ...styles.badge, ...(online ? styles.badgeOnline : styles.badgeOffline) }}>
                    <span style={{ ...styles.dot, background: online ? "#4ade80" : "#f87171" }} />
                    {online ? "Online" : "Offline"}
                  </span>
                </div>

                <div style={styles.machineStats}>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>OS</span>
                    <span style={styles.statVal}>{m.os || "—"}</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Last seen</span>
                    <span style={styles.statVal}>{m.last_seen ? new Date(m.last_seen).toLocaleString("en-GB") : "Never"}</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Activity today</span>
                    <span style={styles.statVal}>{m.activity_today || 0} events</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Screenshots</span>
                    <span style={styles.statVal}>{m.screenshot_count || 0} total</span>
                  </div>
                </div>

                <div style={styles.machineFooter}>
                  <div style={styles.tokenMini}>
                    <span style={styles.tokenMiniLabel}>Token:</span>
                    <code style={styles.tokenMiniVal}>{m.token.slice(0, 12)}...</code>
                    <button onClick={() => copy(m.token, m.id)} style={styles.copyBtnSmall}>
                      {copiedId === m.id ? "✓" : <Copy size={11} />}
                    </button>
                  </div>
                  <button onClick={() => deleteMachine(m.id)} style={styles.deleteBtn}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {machines.length === 0 && (
            <div style={styles.emptyState}>
              <Monitor size={40} color="#2d2d4e" />
              <p style={styles.emptyText}>No machines yet</p>
              <p style={styles.emptySub}>Click "Add Machine" to generate an install token</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "32px 36px", flex: 1, overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  headerActions: { display: "flex", gap: 10, alignItems: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 },
  sub: { color: "#6b6b8b", fontSize: 13, marginTop: 4 },
  iconBtn: { padding: "8px 10px", background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8, color: "#8b8bab", cursor: "pointer" },
  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  addCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: 24, marginBottom: 24 },
  addTitle: { color: "#fff", fontSize: 16, fontWeight: 600, margin: "0 0 6px" },
  addSub: { color: "#8b8bab", fontSize: 13, margin: "0 0 16px" },
  addRow: { display: "flex", gap: 10 },
  input: { flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#0f0f18", color: "#fff", fontSize: 14, outline: "none" },
  error: { color: "#f87171", fontSize: 13, marginTop: 8 },
  tokenBox: { marginTop: 16, background: "#0f2e1f", border: "1px solid #166534", borderRadius: 8, padding: 16 },
  tokenLabel: { color: "#4ade80", fontSize: 13, marginBottom: 10 },
  tokenRow: { display: "flex", alignItems: "center", gap: 10 },
  token: { flex: 1, background: "#0a1f15", padding: "8px 12px", borderRadius: 6, color: "#86efac", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all" },
  copyBtn: { padding: "8px 14px", background: "#166534", border: "none", borderRadius: 6, color: "#4ade80", cursor: "pointer", fontSize: 13 },
  tokenNote: { color: "#6b9f7e", fontSize: 12, marginTop: 10 },
  inlineCode: { background: "#0a1f15", padding: "1px 5px", borderRadius: 3, color: "#86efac", fontFamily: "monospace" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
  machineCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  machineTop: { display: "flex", alignItems: "flex-start", gap: 12 },
  machineIcon: { width: 40, height: 40, background: "#0f0f18", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  machineName: { color: "#fff", fontWeight: 600, fontSize: 15 },
  machineHostname: { color: "#6b6b8b", fontSize: 12, marginTop: 2 },
  badge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, flexShrink: 0 },
  badgeOnline: { background: "#0f2e1f", color: "#4ade80", border: "1px solid #166534" },
  badgeOffline: { background: "#2a1a1a", color: "#f87171", border: "1px solid #7f1d1d" },
  dot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block" },
  machineStats: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  stat: { display: "flex", flexDirection: "column", gap: 2 },
  statLabel: { color: "#6b6b8b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  statVal: { color: "#c5c5e0", fontSize: 13 },
  machineFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1e1e34", paddingTop: 12 },
  tokenMini: { display: "flex", alignItems: "center", gap: 6 },
  tokenMiniLabel: { color: "#6b6b8b", fontSize: 11 },
  tokenMiniVal: { color: "#8b8bab", fontSize: 11, fontFamily: "monospace" },
  copyBtnSmall: { background: "none", border: "none", color: "#6b6b8b", cursor: "pointer", padding: 2 },
  deleteBtn: { background: "none", border: "none", color: "#7f1d1d", cursor: "pointer", padding: 4 },
  emptyState: { gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 8 },
  emptyText: { color: "#4b4b6b", fontSize: 16, fontWeight: 600, margin: 0 },
  emptySub: { color: "#3b3b5b", fontSize: 13, margin: 0 },
  muted: { color: "#6b6b8b", fontSize: 14 }
};
