const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb, prepare } = require("../db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const db = await getDb();
    const user = prepare(db, `
      SELECT u.*, o.name as org_name, o.slug as org_slug, o.plan as org_plan, o.active as org_active
      FROM users u JOIN organisations o ON o.id = u.org_id
      WHERE u.email = ? AND u.active = 1
    `).get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.org_active) return res.status(403).json({ error: "Organisation suspended" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    prepare(db, "UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
    const token = jwt.sign({ userId: user.id, orgId: user.org_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, org_id: user.org_id, org_name: user.org_name, org_slug: user.org_slug, org_plan: user.org_plan } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/me", requireAuth(), (req, res) => {
  const { password_hash, ...safe } = req.user;
  res.json(safe);
});

module.exports = router;
