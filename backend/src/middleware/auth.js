// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { getDb, prepare } = require("../db");

function requireAuth(roles = []) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    const token = (header && header.startsWith("Bearer ")) ? header.slice(7) : req.query.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorised" });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const db = await getDb();
      const user = prepare(db, `
        SELECT u.*, o.slug as org_slug, o.name as org_name, o.plan as org_plan
        FROM users u
        JOIN organisations o ON o.id = u.org_id
        WHERE u.id = ? AND u.active = 1 AND o.active = 1
      `).get(payload.userId);
      if (!user) return res.status(401).json({ error: "User not found" });
      if (roles.length && !roles.includes(user.role)) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

async function requireAgentToken(req, res, next) {
  const token = req.headers["x-agent-token"];
  if (!token) return res.status(401).json({ error: "No agent token" });
  const db = await getDb();
  const machine = prepare(db, `
    SELECT m.*, o.active as org_active, o.screenshot_interval_min, o.screenshot_interval_max
    FROM machines m
    JOIN organisations o ON o.id = m.org_id
    WHERE m.token = ? AND m.active = 1
  `).get(token);
  if (!machine) return res.status(401).json({ error: "Invalid machine token" });
  if (!machine.org_active) return res.status(403).json({ error: "Organisation inactive" });
  req.machine = machine;
  next();
}

module.exports = { requireAuth, requireAgentToken };
