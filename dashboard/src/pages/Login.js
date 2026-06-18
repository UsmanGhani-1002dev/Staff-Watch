// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Monitor, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <Monitor size={28} color="#6366f1" />
          <span style={styles.logoText}>StaffWatch</span>
        </div>
        <p style={styles.sub}>Sign in to your monitoring dashboard</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />

          <label style={styles.label}>Password</label>
          <div style={styles.passWrap}>
            <input
              style={{ ...styles.input, paddingRight: 40 }}
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f0f18", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420 },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  logoText: { fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "system-ui, sans-serif" },
  sub: { color: "#8b8bab", fontSize: 14, marginBottom: 28, marginTop: 0 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { color: "#c5c5e0", fontSize: 13, fontWeight: 500 },
  input: { padding: "10px 14px", borderRadius: 8, border: "1px solid #2d2d4e", background: "#0f0f18", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  passWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8b8bab", cursor: "pointer", padding: 0 },
  errorBox: { background: "#2d1a1a", border: "1px solid #5c2323", color: "#f87171", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
  btn: { marginTop: 8, padding: "12px 0", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }
};
