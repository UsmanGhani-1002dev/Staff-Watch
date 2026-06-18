// src/pages/Screenshots.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Screenshots() {
  const { authFetch, token } = useAuth();
  const [screenshots, setScreenshots] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [machineFilter, setMachineFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    authFetch("/api/machines").then(r => r.json()).then(setMachines);
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `/api/activity/screenshots?limit=100`;
    if (machineFilter) url += `&machine_id=${machineFilter}`;
    if (dateFilter) url += `&date=${dateFilter}`;
    authFetch(url).then(r => r.json()).then(data => {
      setScreenshots(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
  }, [machineFilter, dateFilter]);

  const imgUrl = (id) => `/api/activity/screenshots/${id}/image?token=${token}`;

  const openLightbox = (idx) => setLightbox(idx);
  const closeLightbox = () => setLightbox(null);
  const prevImage = () => setLightbox(l => Math.max(0, l - 1));
  const nextImage = () => setLightbox(l => Math.min(screenshots.length - 1, l + 1));

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Screenshots</h1>

      <div style={styles.filters}>
        <select style={styles.select} value={machineFilter} onChange={e => setMachineFilter(e.target.value)}>
          <option value="">All machines</option>
          {machines.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <input type="date" style={styles.dateInput} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <span style={styles.count}>{screenshots.length} screenshots</span>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading screenshots...</p>
      ) : screenshots.length === 0 ? (
        <div style={styles.empty}>No screenshots found for this filter</div>
      ) : (
        <div style={styles.grid}>
          {screenshots.map((s, idx) => (
            <div key={s.id} style={styles.thumb} onClick={() => openLightbox(idx)}>
              <img
                src={imgUrl(s.id)}
                alt={`Screenshot ${s.id}`}
                style={styles.thumbImg}
                loading="lazy"
              />
              <div style={styles.thumbInfo}>
                <div style={styles.thumbTime}>{new Date(s.taken_at).toLocaleTimeString("en-GB")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div style={styles.overlay} onClick={closeLightbox}>
          <div style={styles.lightbox} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeLightbox}><X size={20} /></button>
            <img src={imgUrl(screenshots[lightbox].id)} style={styles.lightboxImg} alt="Screenshot" />
            <div style={styles.lightboxMeta}>
              <span style={styles.lightboxTime}>{new Date(screenshots[lightbox].taken_at).toLocaleString("en-GB")}</span>
              <div style={styles.lightboxNav}>
                <button onClick={prevImage} disabled={lightbox === 0} style={styles.navBtn}><ChevronLeft size={18} /></button>
                <span style={styles.navCount}>{lightbox + 1} / {screenshots.length}</span>
                <button onClick={nextImage} disabled={lightbox === screenshots.length - 1} style={styles.navBtn}><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "32px 36px", flex: 1, overflowY: "auto" },
  title: { color: "#fff", fontSize: 24, fontWeight: 700, marginBottom: 20 },
  filters: { display: "flex", gap: 12, alignItems: "center", marginBottom: 24 },
  select: { padding: "9px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#1a1a2e", color: "#c5c5e0", fontSize: 14, outline: "none" },
  dateInput: { padding: "9px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#1a1a2e", color: "#c5c5e0", fontSize: 14, outline: "none" },
  count: { color: "#6b6b8b", fontSize: 13, marginLeft: "auto" },
  muted: { color: "#6b6b8b", fontSize: 14 },
  empty: { color: "#4b4b6b", textAlign: "center", padding: "60px 0", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  thumb: { borderRadius: 10, overflow: "hidden", background: "#1a1a2e", border: "1px solid #2d2d4e", cursor: "pointer", transition: "border-color 0.15s", position: "relative" },
  thumbImg: { width: "100%", height: 130, objectFit: "cover", display: "block" },
  thumbInfo: { padding: "6px 10px" },
  thumbTime: { color: "#8b8bab", fontSize: 11 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" },
  lightbox: { background: "#1a1a2e", borderRadius: 16, border: "1px solid #2d2d4e", maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden", position: "relative" },
  closeBtn: { position: "absolute", top: 12, right: 12, background: "#0f0f18", border: "1px solid #2d2d4e", borderRadius: 8, color: "#c5c5e0", cursor: "pointer", padding: 6, zIndex: 10 },
  lightboxImg: { maxWidth: "85vw", maxHeight: "75vh", display: "block", objectFit: "contain" },
  lightboxMeta: { padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  lightboxTime: { color: "#8b8bab", fontSize: 13 },
  lightboxNav: { display: "flex", alignItems: "center", gap: 10 },
  navBtn: { background: "#0f0f18", border: "1px solid #2d2d4e", borderRadius: 6, color: "#c5c5e0", cursor: "pointer", padding: "4px 6px", display: "flex" },
  navCount: { color: "#6b6b8b", fontSize: 12 }
};
