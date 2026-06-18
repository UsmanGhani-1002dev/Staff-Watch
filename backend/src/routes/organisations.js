const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDb, prepare } = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    if (req.user.role === "superadmin") {
      const orgs = prepare(db, `
        SELECT o.*, 
          (SELECT COUNT(*) FROM users WHERE org_id = o.id AND active = 1) as user_count,
          (SELECT COUNT(*) FROM machines WHERE org_id = o.id AND active = 1) as machine_count
        FROM organisations o ORDER BY o.created_at DESC
      `).all();
      return res.json(orgs);
    }
    const org = prepare(db, "SELECT * FROM organisations WHERE id = ?").get(req.user.org_id);
    res.json([org]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", requireAuth(["superadmin"]), async (req, res) => {
  try {
    const { name, slug, plan, seat_limit, admin_name, admin_email, admin_password } = req.body;
    if (!name || !slug || !admin_email || !admin_password) return res.status(400).json({ error: "name, slug, admin_email, admin_password required" });
    const db = await getDb();
    const existing = prepare(db, "SELECT id FROM organisations WHERE slug = ?").get(slug);
    if (existing) return res.status(409).json({ error: "Slug already taken" });
    const orgId = uuidv4();
    prepare(db, "INSERT INTO organisations (id, name, slug, plan, seat_limit) VALUES (?, ?, ?, ?, ?)").run(orgId, name, slug, plan || "starter", seat_limit || 5);
    const hash = await bcrypt.hash(admin_password, 12);
    prepare(db, "INSERT INTO users (id, org_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)").run(uuidv4(), orgId, admin_name || name, admin_email, hash, "client-admin");
    const org = prepare(db, "SELECT * FROM organisations WHERE id = ?").get(orgId);
    res.status(201).json(org);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch("/:id", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    if (req.user.role === "client-admin" && req.params.id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    const { name, plan, seat_limit, screenshot_retention_days, screenshot_interval_min, screenshot_interval_max, active } = req.body;
    // Build dynamic update
    const fields = [];
    const vals = [];
    if (name !== undefined) { fields.push("name = ?"); vals.push(name); }
    if (plan !== undefined) { fields.push("plan = ?"); vals.push(plan); }
    if (seat_limit !== undefined) { fields.push("seat_limit = ?"); vals.push(seat_limit); }
    if (screenshot_retention_days !== undefined) { fields.push("screenshot_retention_days = ?"); vals.push(screenshot_retention_days); }
    if (screenshot_interval_min !== undefined) { fields.push("screenshot_interval_min = ?"); vals.push(screenshot_interval_min); }
    if (screenshot_interval_max !== undefined) { fields.push("screenshot_interval_max = ?"); vals.push(screenshot_interval_max); }
    if (active !== undefined) { fields.push("active = ?"); vals.push(active); }
    if (fields.length) {
      vals.push(req.params.id);
      prepare(db, `UPDATE organisations SET ${fields.join(", ")} WHERE id = ?`).run(...vals);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", requireAuth(["superadmin"]), async (req, res) => {
  const db = await getDb();
  prepare(db, "UPDATE organisations SET active = 0 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
