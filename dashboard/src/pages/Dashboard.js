// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Monitor, CheckCircle, XCircle, Camera, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function StatCard({ icon: Icon, label, value, sub, color = "#6366f1" }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: color + "22" }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
        {sub && <div style={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

function OnlineBadge({ online }) {
  return (
    <span style={{ ...styles.badge, background: online ? "#0f2e1f" : "#2a1a1a", color: online ? "#4ade80" : "#f87171", border: `1px solid ${online ? "#166534" : "#7f1d1d"}` }}>
      <span style={{ ...styles.dot, background: online ? "#4ade80" : "#f87171" }} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export default function Dashboard() {
  const { authFetch, user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    authFetch(`/api/activity/summary?date=${today}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSummary(data);
        } else {
          console.error("API did not return an array:", data);
          setSummary([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch summary:", err);
        setSummary([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const onlineCount = summary.filter(m => m.is_online).length;
  const totalScreenshots = summary.reduce((a, b) => a + (b.screenshot_count || 0), 0);
  const totalActiveHours = Math.round(summary.reduce((a, b) => a + (b.total_active || 0), 0) / 3600 * 10) / 10;

  const chartData = summary
    .sort((a, b) => (b.total_active || 0) - (a.total_active || 0))
    .slice(0, 10)
    .map(m => ({ name: m.label, hours: Math.round((m.total_active || 0) / 36) / 100 }));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Overview</h1>
          <p style={styles.date}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div style={styles.statsRow}>
        <StatCard icon={Monitor} label="Total machines" value={summary.length} color="#6366f1" />
        <StatCard icon={CheckCircle} label="Online now" value={onlineCount} sub={`${summary.length - onlineCount} offline`} color="#22c55e" />
        <StatCard icon={Camera} label="Screenshots today" value={totalScreenshots} color="#f59e0b" />
        <StatCard icon={Clock} label="Active hours today" value={`${totalActiveHours}h`} color="#06b6d4" />
      </div>

      {chartData.length > 0 && (
        <div style={styles.chartCard}>
          <h3 style={styles.sectionTitle}>Active hours by machine — today</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: "#8b8bab", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8b8bab", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : "#2d2d4e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={styles.tableCard}>
        <h3 style={styles.sectionTitle}>All machines</h3>
        {loading ? <p style={styles.muted}>Loading...</p> : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Machine", "Status", "Active today", "Screenshots", "Last seen"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(m => (
                <tr key={m.machine_id} style={styles.tr}>
                  <td style={styles.td}><strong style={{ color: "#fff" }}>{m.label}</strong></td>
                  <td style={styles.td}><OnlineBadge online={m.is_online} /></td>
                  <td style={styles.td}>{m.total_active ? `${Math.round(m.total_active / 60)}m` : "—"}</td>
                  <td style={styles.td}>{m.screenshot_count || 0}</td>
                  <td style={styles.td}>{m.last_seen ? new Date(m.last_seen).toLocaleTimeString("en-GB") : "Never"}</td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr><td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#6b6b8b" }}>No machines yet — add one in Machines</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "32px 36px", flex: 1, overflowY: "auto" },
  header: { marginBottom: 28 },
  title: { color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 },
  date: { color: "#6b6b8b", fontSize: 13, marginTop: 4 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 20px", display: "flex", alignItems: "center", gap: 16 },
  statIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statValue: { color: "#fff", fontSize: 26, fontWeight: 700 },
  statLabel: { color: "#8b8bab", fontSize: 13, marginTop: 2 },
  statSub: { color: "#6b6b8b", fontSize: 11, marginTop: 2 },
  chartCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px", marginBottom: 24 },
  tableCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px" },
  sectionTitle: { color: "#c5c5e0", fontSize: 15, fontWeight: 600, margin: "0 0 16px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#6b6b8b", fontSize: 12, fontWeight: 500, padding: "8px 12px", borderBottom: "1px solid #1e1e34", textTransform: "uppercase", letterSpacing: 0.6 },
  tr: { borderBottom: "1px solid #1a1a2e" },
  td: { color: "#c5c5e0", fontSize: 14, padding: "12px 12px" },
  badge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 },
  dot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block" },
  muted: { color: "#6b6b8b", fontSize: 14 }
};
