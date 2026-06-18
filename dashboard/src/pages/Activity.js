// src/pages/Activity.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#a3e635"];

// App icon using first letter with a color background
function AppIcon({ name, color }) {
  const letter = (name || "?")[0].toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: color + "22",
      border: `1px solid ${color}44`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, fontWeight: 700,
      fontSize: 14, color: color, fontFamily: "Segoe UI, sans-serif"
    }}>
      {letter}
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function Activity() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [apps, setApps] = useState([]);
  const [machines, setMachines] = useState([]);
  const [machineFilter, setMachineFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/machines").then(r => r.json()).then(data => setMachines(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let logUrl = `/api/activity?limit=200`;
    let appUrl = `/api/activity/apps?`;
    if (machineFilter) { logUrl += `&machine_id=${machineFilter}`; appUrl += `machine_id=${machineFilter}&`; }
    if (dateFilter) { logUrl += `&date=${dateFilter}`; appUrl += `date=${dateFilter}`; }

    Promise.all([
      authFetch(logUrl).then(r => r.json()),
      authFetch(appUrl).then(r => r.json())
    ]).then(([l, a]) => {
      setLogs(Array.isArray(l) ? l : []);
      setApps(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));
  }, [machineFilter, dateFilter]);

  const totalActive = apps.reduce((sum, a) => sum + (a.total_seconds || 0), 0);
  const appChartData = apps.slice(0, 8).map(a => ({
    name: a.app_name,
    value: Math.round(a.total_seconds / 60)
  }));

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Activity</h1>
        <div style={styles.filters}>
          <select style={styles.select} value={machineFilter} onChange={e => setMachineFilter(e.target.value)}>
            <option value="">All machines</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <input type="date" style={styles.dateInput} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>

      {/* App Cards — DeskTime Style */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Top apps breakdown</h3>
        {apps.length === 0 ? (
          <p style={styles.muted}>No activity data for this filter</p>
        ) : (
          <div style={styles.appsGrid}>
            {apps.slice(0, 10).map((a, i) => {
              const pct = totalActive > 0 ? Math.round((a.total_seconds / totalActive) * 100) : 0;
              const color = COLORS[i % COLORS.length];
              return (
                <div key={a.app_name} style={styles.appCard}>
                  <div style={styles.appCardTop}>
                    <AppIcon name={a.app_name} color={color} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ ...styles.appCardName, color: "#fff" }}>{a.app_name}</div>
                      <div style={styles.appCardTime}>{formatTime(a.total_seconds)}</div>
                    </div>
                    <div style={{ ...styles.appPct, color }}>{pct}%</div>
                  </div>
                  <div style={styles.progressBg}>
                    <div style={{ ...styles.progressFill, width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pie Chart + Summary */}
      {appChartData.length > 0 && (
        <div style={styles.chartRow}>
          <div style={styles.pieCard}>
            <h3 style={styles.sectionTitle}>Time distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={appChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {appChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v}m`, "Time"]}
                  contentStyle={{ background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8, color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.legendList}>
              {appChartData.map((a, i) => (
                <div key={a.name} style={styles.legendRow}>
                  <span style={{ ...styles.legendDot, background: COLORS[i % COLORS.length] }} />
                  <span style={styles.legendName}>{a.name}</span>
                  <span style={styles.legendTime}>{a.value}m</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.summaryCard}>
            <h3 style={styles.sectionTitle}>Summary</h3>
            <div style={styles.summaryRow}>
              <div style={styles.summaryItem}>
                <div style={styles.summaryValue}>{formatTime(totalActive)}</div>
                <div style={styles.summaryLabel}>Total active time</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryValue}>{apps.length}</div>
                <div style={styles.summaryLabel}>Apps used</div>
              </div>
              <div style={styles.summaryItem}>
                <div style={styles.summaryValue}>{logs.length}</div>
                <div style={styles.summaryLabel}>Activity entries</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div style={styles.logCard}>
        <h3 style={styles.sectionTitle}>Activity log</h3>
        {loading ? <p style={styles.muted}>Loading...</p> : (
          <div>
            {/* Header Row */}
            <div style={styles.logHeader}>
              <span style={{ width: 140 }}>Time</span>
              <span style={{ width: 110 }}>Machine</span>
              <span style={{ width: 130 }}>App</span>
              <span style={{ flex: 1 }}>Window / Title</span>
              <span style={{ width: 90, textAlign: "right" }}>Duration</span>
              <span style={{ width: 80, textAlign: "right" }}>Status</span>
            </div>
            {(() => {
              const groupedLogs = [];
              let currentGroup = null;

              for (let i = 0; i < logs.length; i++) {
                const l = logs[i];
                if (!currentGroup) {
                  currentGroup = { ...l, end_time: l.logged_at, start_time: l.logged_at, duration_seconds: l.active_seconds + l.idle_seconds };
                } else if (currentGroup.app_name === l.app_name && currentGroup.window_title === l.window_title && currentGroup.machine_id === l.machine_id) {
                  currentGroup.start_time = l.logged_at;
                  currentGroup.duration_seconds += (l.active_seconds + l.idle_seconds);
                  currentGroup.idle_seconds += l.idle_seconds;
                  currentGroup.active_seconds += l.active_seconds;
                } else {
                  groupedLogs.push(currentGroup);
                  currentGroup = { ...l, end_time: l.logged_at, start_time: l.logged_at, duration_seconds: l.active_seconds + l.idle_seconds };
                }
              }
              if (currentGroup) groupedLogs.push(currentGroup);

              if (groupedLogs.length === 0) return <p style={styles.muted}>No logs found</p>;

              return groupedLogs.map((l, idx) => {
                const isIdle = l.idle_seconds > l.active_seconds;
                const appIdx = apps.findIndex(a => a.app_name === l.app_name);
                const color = appIdx >= 0 ? COLORS[appIdx % COLORS.length] : "#6b6b8b";
                
                const startTimeStr = new Date(l.start_time.replace(' ', 'T') + 'Z').toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const endTimeStr = l.start_time === l.end_time ? "" : " - " + new Date(l.end_time.replace(' ', 'T') + 'Z').toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div key={idx} style={styles.logRow}>
                    <span style={styles.logTime}>
                      {startTimeStr}{endTimeStr}
                    </span>
                    <span style={styles.logMachine}>{l.machine_label || "—"}</span>
                    <span style={styles.logApp}>
                      <span style={{ ...styles.appDot, background: color }} />
                      {l.app_name}
                    </span>
                    <span style={styles.logWindow} title={l.window_title}>{l.window_title}</span>
                    <span style={{ width: 90, textAlign: "right", color: "#8b8bab", fontSize: 12 }}>{formatTime(l.duration_seconds)}</span>
                    <span style={{ ...styles.logStatus, color: isIdle ? "#f59e0b" : "#4ade80", background: isIdle ? "#4516001a" : "#0f2e1f" }}>
                      {isIdle ? `Idle` : `Active`}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "32px 36px", flex: 1, overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 },
  filters: { display: "flex", gap: 12 },
  select: { padding: "9px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#1a1a2e", color: "#c5c5e0", fontSize: 14, outline: "none" },
  dateInput: { padding: "9px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#1a1a2e", color: "#c5c5e0", fontSize: 14, outline: "none" },

  section: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px", marginBottom: 20 },
  sectionTitle: { color: "#c5c5e0", fontSize: 14, fontWeight: 600, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 },
  muted: { color: "#6b6b8b", fontSize: 14, margin: 0 },

  appsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 },
  appCard: { background: "#0f0f18", border: "1px solid #2d2d4e", borderRadius: 10, padding: "12px 14px" },
  appCardTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  appCardName: { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  appCardTime: { color: "#6b6b8b", fontSize: 11, marginTop: 2 },
  appPct: { fontSize: 14, fontWeight: 700, flexShrink: 0 },
  progressBg: { height: 4, background: "#1e1e34", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },

  chartRow: { display: "flex", gap: 16, marginBottom: 20 },
  pieCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px", flex: 1 },
  legendList: { display: "flex", flexDirection: "column", gap: 6, marginTop: 12 },
  legendRow: { display: "flex", alignItems: "center", gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  legendName: { color: "#8b8bab", fontSize: 12, flex: 1 },
  legendTime: { color: "#c5c5e0", fontSize: 12, fontWeight: 600 },

  summaryCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px", flex: 1 },
  summaryRow: { display: "flex", flexDirection: "column", gap: 20, marginTop: 8 },
  summaryItem: {},
  summaryValue: { color: "#fff", fontSize: 28, fontWeight: 700 },
  summaryLabel: { color: "#6b6b8b", fontSize: 12, marginTop: 2 },

  logCard: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 12, padding: "20px 24px" },
  logHeader: { display: "flex", gap: 12, padding: "6px 10px", color: "#4b4b6b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  logRow: { display: "flex", alignItems: "center", gap: 12, padding: "9px 10px", borderRadius: 6, borderBottom: "1px solid #14142a", transition: "background 0.15s" },
  logTime: { color: "#6b6b8b", fontSize: 12, width: 80, flexShrink: 0, fontFamily: "monospace" },
  logMachine: { color: "#8b8bab", fontSize: 12, width: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logApp: { color: "#a5b4fc", fontSize: 12, fontWeight: 600, width: 130, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 },
  appDot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
  logWindow: { color: "#c5c5e0", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logStatus: { fontSize: 11, fontWeight: 600, width: 80, textAlign: "center", padding: "3px 8px", borderRadius: 20, flexShrink: 0 },
};
