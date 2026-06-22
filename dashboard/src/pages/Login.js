// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Monitor, Eye, EyeOff, Mail, Lock, Activity, Camera, Users, ArrowRight } from "lucide-react";

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
    <div className="sw-login-page">
      <style>{CSS}</style>

      <div className="sw-login-card">
        {/* ── Brand / marketing panel ───────────────────────────── */}
        <div className="sw-brand">
          <div className="sw-brand-glow" />
          <div className="sw-brand-top">
            <div className="sw-logo-badge"><Monitor size={26} color="#fff" /></div>
            <span className="sw-logo-text">StaffWatch</span>
          </div>

          <div className="sw-brand-body">
            <h1 className="sw-brand-head">Monitor your team,<br />effortlessly.</h1>
            <p className="sw-brand-sub">Real-time visibility into activity, screenshots and productivity — all in one secure dashboard.</p>

            <ul className="sw-features">
              <li><span className="sw-feat-ico"><Activity size={16} /></span> Live activity &amp; idle tracking</li>
              <li><span className="sw-feat-ico"><Camera size={16} /></span> Automatic timed screenshots</li>
              <li><span className="sw-feat-ico"><Users size={16} /></span> Multi-team management</li>
            </ul>
          </div>

          <div className="sw-brand-foot">Built by Enovtec</div>
        </div>

        {/* ── Login form ────────────────────────────────────────── */}
        <div className="sw-form-wrap">
          <div className="sw-form-head">
            <h2 className="sw-title">Welcome back</h2>
            <p className="sw-sub">Sign in to your monitoring dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="sw-form">
            <label className="sw-label" htmlFor="sw-email">Email</label>
            <div className="sw-field">
              <Mail size={16} className="sw-field-ico" />
              <input
                id="sw-email"
                className="sw-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <label className="sw-label" htmlFor="sw-pass">Password</label>
            <div className="sw-field">
              <Lock size={16} className="sw-field-ico" />
              <input
                id="sw-pass"
                className="sw-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="sw-eye" aria-label={showPass ? "Hide password" : "Show password"}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <div className="sw-error">{error}</div>}

            <button type="submit" className="sw-btn" disabled={loading}>
              {loading ? "Signing in…" : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.sw-login-page {
  min-height: 100vh;
  background: radial-gradient(1200px 600px at 50% -10%, #1d1d35 0%, #0f0f18 55%);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
.sw-login-card {
  display: grid; grid-template-columns: 1.05fr 1fr;
  width: 100%; max-width: 920px;
  background: #15152a; border: 1px solid #2a2a48; border-radius: 20px;
  overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.45);
}

/* Brand panel */
.sw-brand {
  position: relative; padding: 40px 38px;
  background: linear-gradient(150deg, #6366f1 0%, #7c3aed 55%, #5b21b6 100%);
  display: flex; flex-direction: column; overflow: hidden;
}
.sw-brand-glow {
  position: absolute; width: 360px; height: 360px; right: -120px; top: -120px;
  background: radial-gradient(circle, rgba(255,255,255,.25), transparent 70%);
  pointer-events: none;
}
.sw-brand-top { display: flex; align-items: center; gap: 12px; z-index: 1; }
.sw-logo-badge {
  width: 46px; height: 46px; border-radius: 13px;
  background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25);
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
}
.sw-logo-text { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -.3px; }
.sw-brand-body { margin-top: auto; z-index: 1; }
.sw-brand-head { color: #fff; font-size: 30px; line-height: 1.18; font-weight: 800; margin: 0 0 14px; letter-spacing: -.5px; }
.sw-brand-sub { color: rgba(255,255,255,.82); font-size: 14.5px; line-height: 1.55; margin: 0 0 26px; max-width: 340px; }
.sw-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.sw-features li { display: flex; align-items: center; gap: 12px; color: #fff; font-size: 14px; font-weight: 500; }
.sw-feat-ico {
  width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
  background: rgba(255,255,255,.16); display: flex; align-items: center; justify-content: center; color: #fff;
}
.sw-brand-foot { margin-top: 34px; color: rgba(255,255,255,.6); font-size: 12.5px; z-index: 1; }

/* Form panel */
.sw-form-wrap { padding: 48px 44px; display: flex; flex-direction: column; justify-content: center; }
.sw-form-head { margin-bottom: 26px; }
.sw-title { color: #fff; font-size: 25px; font-weight: 700; margin: 0 0 6px; letter-spacing: -.3px; }
.sw-sub { color: #8b8bab; font-size: 14px; margin: 0; }
.sw-form { display: flex; flex-direction: column; }
.sw-label { color: #c5c5e0; font-size: 13px; font-weight: 500; margin-bottom: 7px; }
.sw-label:not(:first-child) { margin-top: 16px; }

.sw-field { position: relative; display: flex; align-items: center; }
.sw-field-ico { position: absolute; left: 13px; color: #6b6b8b; pointer-events: none; }
.sw-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px 12px 40px; border-radius: 10px;
  border: 1px solid #2d2d4e; background: #0f0f18; color: #fff; font-size: 14px;
  outline: none; transition: border-color .15s, box-shadow .15s;
}
.sw-input::placeholder { color: #55556f; }
.sw-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.22); }
.sw-eye {
  position: absolute; right: 8px; background: none; border: none; color: #8b8bab;
  cursor: pointer; padding: 6px; display: flex; border-radius: 6px; transition: color .15s;
}
.sw-eye:hover { color: #c5c5e0; }

.sw-error {
  margin-top: 16px; background: #2d1a1a; border: 1px solid #5c2323; color: #f87171;
  border-radius: 9px; padding: 10px 14px; font-size: 13px;
}

.sw-btn {
  margin-top: 24px; padding: 13px 0;
  background: linear-gradient(135deg, #6366f1, #7c3aed); color: #fff;
  border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 8px 20px rgba(99,102,241,.32); transition: transform .12s, box-shadow .15s, opacity .15s;
}
.sw-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(99,102,241,.42); }
.sw-btn:active:not(:disabled) { transform: translateY(0); }
.sw-btn:disabled { opacity: .65; cursor: default; }

/* Responsive — stack to single column, hide brand panel */
@media (max-width: 760px) {
  .sw-login-card { grid-template-columns: 1fr; max-width: 440px; }
  .sw-brand { display: none; }
  .sw-form-wrap { padding: 40px 30px; }
}
`;
