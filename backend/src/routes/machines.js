const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDb, prepare } = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

function scopedOrgId(req) {
  return req.user.role === "superadmin" ? (req.query.org_id || req.body?.org_id || req.user.org_id) : req.user.org_id;
}

router.get("/", requireAuth(["superadmin", "client-admin", "viewer"]), async (req, res) => {
  try {
    const db = await getDb();
    const orgId = scopedOrgId(req);
    const machines = prepare(db, `
      SELECT m.*,
        (SELECT COUNT(*) FROM screenshots WHERE machine_id = m.id) as screenshot_count,
        (SELECT COUNT(*) FROM activity_logs WHERE machine_id = m.id AND logged_at > datetime('now', '-1 day')) as activity_today
      FROM machines m WHERE m.org_id = ? AND m.active = 1 ORDER BY m.created_at DESC
    `).all(orgId);
    res.json(machines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) return res.status(400).json({ error: "Label required" });
    const db = await getDb();
    const orgId = scopedOrgId(req);
    const org = prepare(db, "SELECT seat_limit FROM organisations WHERE id = ?").get(orgId);
    const count = prepare(db, "SELECT COUNT(*) as c FROM machines WHERE org_id = ? AND active = 1").get(orgId);
    if (count.c >= org.seat_limit) return res.status(403).json({ error: `Seat limit reached (${org.seat_limit}). Upgrade your plan.` });
    const id = uuidv4();
    const token = uuidv4();
    prepare(db, "INSERT INTO machines (id, org_id, label, token) VALUES (?, ?, ?, ?)").run(id, orgId, label, token);
    res.status(201).json({ id, label, token, org_id: orgId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch("/:id", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const machine = prepare(db, "SELECT * FROM machines WHERE id = ?").get(req.params.id);
    if (!machine) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "superadmin" && machine.org_id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    if (req.body.label) prepare(db, "UPDATE machines SET label = ? WHERE id = ?").run(req.body.label, req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const machine = prepare(db, "SELECT * FROM machines WHERE id = ?").get(req.params.id);
    if (!machine) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "superadmin" && machine.org_id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    prepare(db, "UPDATE machines SET active = 0 WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/:id/status", requireAuth(), async (req, res) => {
  try {
    const db = await getDb();
    const machine = prepare(db, "SELECT * FROM machines WHERE id = ?").get(req.params.id);
    if (!machine) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "superadmin" && machine.org_id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    const lastActivity = prepare(db, "SELECT * FROM activity_logs WHERE machine_id = ? ORDER BY logged_at DESC LIMIT 1").get(req.params.id);
    const lastScreenshot = prepare(db, "SELECT id, taken_at FROM screenshots WHERE machine_id = ? ORDER BY taken_at DESC LIMIT 1").get(req.params.id);
    const isOnline = machine.last_seen ? (new Date() - new Date(machine.last_seen.replace(' ', 'T') + 'Z')) < 2 * 60 * 1000 : false;
    res.json({ machine, is_online: isOnline, last_activity: lastActivity, last_screenshot: lastScreenshot });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
