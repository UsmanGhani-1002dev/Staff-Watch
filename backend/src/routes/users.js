const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { getDb, prepare } = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const orgId = req.user.role === "superadmin" ? (req.query.org_id || req.user.org_id) : req.user.org_id;
    const users = prepare(db, "SELECT id, org_id, name, email, role, active, last_login, created_at FROM users WHERE org_id = ? ORDER BY created_at DESC").all(orgId);
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    const db = await getDb();
    const orgId = req.user.role === "superadmin" ? (req.body.org_id || req.user.org_id) : req.user.org_id;
    const allowedRoles = req.user.role === "superadmin" ? ["superadmin", "client-admin", "viewer"] : ["client-admin", "viewer"];
    if (role && !allowedRoles.includes(role)) return res.status(403).json({ error: "Cannot assign that role" });
    const existing = prepare(db, "SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    prepare(db, "INSERT INTO users (id, org_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)").run(id, orgId, name, email.toLowerCase(), hash, role || "viewer");
    res.status(201).json({ id, name, email, role: role || "viewer" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch("/:id", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const user = prepare(db, "SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "superadmin" && user.org_id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    const { name, role, active, password } = req.body;
    const fields = []; const vals = [];
    if (name !== undefined) { fields.push("name = ?"); vals.push(name); }
    if (role !== undefined) { fields.push("role = ?"); vals.push(role); }
    if (active !== undefined) { fields.push("active = ?"); vals.push(active); }
    if (password) { fields.push("password_hash = ?"); vals.push(await bcrypt.hash(password, 12)); }
    if (fields.length) { vals.push(req.params.id); prepare(db, `UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...vals); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", requireAuth(["superadmin", "client-admin"]), async (req, res) => {
  try {
    const db = await getDb();
    const user = prepare(db, "SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "superadmin" && user.org_id !== req.user.org_id) return res.status(403).json({ error: "Forbidden" });
    if (user.id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
    prepare(db, "UPDATE users SET active = 0 WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
