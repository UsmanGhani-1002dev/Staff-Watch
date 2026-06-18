const express = require("express");
const path = require("path");
const fs = require("fs");
const { getDb, prepare } = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || "./screenshots";

router.get("/", requireAuth(), async (req, res) => {
  try {
    const db = await getDb();
    const { machine_id, date, limit = 200 } = req.query;
    const orgId = req.user.role === "superadmin" ? null : req.user.org_id;
    let sql = "SELECT a.*, m.label as machine_label FROM activity_logs a JOIN machines m ON m.id = a.machine_id WHERE 1=1";
    const params = [];
    if (orgId) { sql += " AND a.org_id = ?"; params.push(orgId); }
    if (machine_id) { sql += " AND a.machine_id = ?"; params.push(machine_id); }
    if (date) { sql += " AND date(a.logged_at) = ?"; params.push(date); }
    sql += " ORDER BY a.logged_at DESC LIMIT ?";
    params.push(parseInt(limit));
    const logs = prepare(db, sql).all(...params);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/summary", requireAuth(), async (req, res) => {
  try {
    const db = await getDb();
    const orgId = req.user.role === "superadmin" ? req.query.org_id : req.user.org_id;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    
    let sql = `
      SELECT m.id as machine_id, m.label, m.last_seen,
        SUM(a.active_seconds) as total_active,
        SUM(a.idle_seconds) as total_idle
      FROM machines m
      LEFT JOIN activity_logs a ON a.machine_id = m.id AND date(a.logged_at) = ?
      WHERE m.active = 1
    `;
    const params = [date];
    if (orgId) { sql += " AND m.org_id = ?"; params.push(orgId); }
    sql += " GROUP BY m.id ORDER BY total_active DESC";
    
    const summary = prepare(db, sql).all(...params);
    
    let ssSql = "SELECT machine_id, COUNT(*) as count FROM screenshots WHERE date(taken_at) = ?";
    const ssParams = [date];
    if (orgId) { ssSql += " AND org_id = ?"; ssParams.push(orgId); }
    ssSql += " GROUP BY machine_id";
    const screenshotCounts = prepare(db, ssSql).all(...ssParams);
    
    const countMap = {};
    for (const row of screenshotCounts) countMap[row.machine_id] = row.count;
    const result = summary.map(row => ({
      ...row,
      screenshot_count: countMap[row.machine_id] || 0,
      is_online: row.last_seen ? (new Date() - new Date(row.last_seen.replace(' ', 'T') + 'Z')) < 2 * 60 * 1000 : false
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/screenshots", requireAuth(), async (req, res) => {
  try {
    const db = await getDb();
    const { machine_id, date, limit = 50 } = req.query;
    const orgId = req.user.role === "superadmin" ? req.query.org_id : req.user.org_id;
    let sql = "SELECT * FROM screenshots WHERE 1=1";
    const params = [];
    if (orgId) { sql += " AND org_id = ?"; params.push(orgId); }
    if (machine_id) { sql += " AND machine_id = ?"; params.push(machine_id); }
    if (date) { sql += " AND (date(taken_at) = ? OR date(datetime(taken_at, '+5 hours')) = ?)"; params.push(date); params.push(date); }
    sql += " ORDER BY taken_at DESC LIMIT ?";
    params.push(parseInt(limit));
    res.json(prepare(db, sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/screenshots/:id/image", requireAuth(), async (req, res) => {
  try {
    const db = await getDb();
    const screenshot = prepare(db, "SELECT * FROM screenshots WHERE id = ?").get(req.params.id);
    if (!screenshot) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "superadmin" && screenshot.org_id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    const filepath = path.join(SCREENSHOTS_DIR, screenshot.file_path);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Type", "image/jpeg");
    res.sendFile(path.resolve(filepath));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/apps", requireAuth(), async (req, res) => {
  try {
    const db = await getDb();
    const { machine_id, date } = req.query;
    const orgId = req.user.role === "superadmin" ? req.query.org_id : req.user.org_id;
    let sql = "SELECT app_name, SUM(active_seconds) as total_seconds, COUNT(*) as log_count FROM activity_logs WHERE 1=1";
    const params = [];
    if (orgId) { sql += " AND org_id = ?"; params.push(orgId); }
    if (machine_id) { sql += " AND machine_id = ?"; params.push(machine_id); }
    if (date) { sql += " AND date(logged_at) = ?"; params.push(date); }
    sql += " GROUP BY app_name ORDER BY total_seconds DESC LIMIT 20";
    res.json(prepare(db, sql).all(...params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
