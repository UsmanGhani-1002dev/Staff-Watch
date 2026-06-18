const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { getDb, prepare } = require("../db");
const { requireAgentToken } = require("../middleware/auth");
const router = express.Router();
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || "./screenshots";

router.post("/heartbeat", requireAgentToken, async (req, res) => {
  try {
    const { window_title, app_name, active_seconds, idle_seconds, hostname, os } = req.body;
    const db = await getDb();
    const m = req.machine;
    prepare(db, "UPDATE machines SET last_seen = datetime('now'), hostname = ?, os = ? WHERE id = ?").run(hostname || m.hostname, os || m.os, m.id);
    prepare(db, "INSERT INTO activity_logs (id, machine_id, org_id, window_title, app_name, active_seconds, idle_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(uuidv4(), m.id, m.org_id, window_title || "Unknown", app_name || "unknown", active_seconds || 0, idle_seconds || 0);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/screenshot", requireAgentToken, async (req, res) => {
  try {
    const { screenshot, taken_at } = req.body;
    if (!screenshot) return res.status(400).json({ error: "No screenshot data" });
    const m = req.machine;
    const db = await getDb();
    const date = (taken_at || new Date().toISOString()).split("T")[0];
    const dir = path.join(SCREENSHOTS_DIR, m.org_id, m.id, date);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${Date.now()}.jpg`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, Buffer.from(screenshot, "base64"));
    const relativePath = path.join(m.org_id, m.id, date, filename);
    prepare(db, "INSERT INTO screenshots (id, machine_id, org_id, file_path, taken_at) VALUES (?, ?, ?, ?, ?)")
      .run(uuidv4(), m.id, m.org_id, relativePath, taken_at || new Date().toISOString().replace('T', ' ').substring(0, 19));
    // Cleanup old screenshots
    const org = prepare(db, "SELECT screenshot_retention_days FROM organisations WHERE id = ?").get(m.org_id);
    if (org) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (org.screenshot_retention_days || 30));
      const old = prepare(db, "SELECT id, file_path FROM screenshots WHERE org_id = ? AND taken_at < ?").all(m.org_id, cutoff.toISOString());
      for (const row of old) {
        try { fs.unlinkSync(path.join(SCREENSHOTS_DIR, row.file_path)); } catch (_) {}
        prepare(db, "DELETE FROM screenshots WHERE id = ?").run(row.id);
      }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/config", requireAgentToken, (req, res) => {
  const m = req.machine;
  res.json({ screenshot_interval_min: m.screenshot_interval_min || 5, screenshot_interval_max: m.screenshot_interval_max || 15 });
});

module.exports = router;
