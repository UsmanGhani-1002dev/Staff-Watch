// src/db/migrate.js
const { getDb, prepare } = require("./index");
require("dotenv").config();

async function migrate() {
  const db = await getDb();

  const tables = [
    `CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'starter',
      seat_limit INTEGER NOT NULL DEFAULT 5,
      screenshot_retention_days INTEGER NOT NULL DEFAULT 30,
      screenshot_interval_min INTEGER NOT NULL DEFAULT 5,
      screenshot_interval_max INTEGER NOT NULL DEFAULT 15,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      active INTEGER NOT NULL DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      label TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      hostname TEXT,
      os TEXT,
      last_seen TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      window_title TEXT,
      app_name TEXT,
      active_seconds INTEGER NOT NULL DEFAULT 0,
      idle_seconds INTEGER NOT NULL DEFAULT 0,
      logged_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      taken_at TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_activity_machine ON activity_logs(machine_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_logs(org_id)`,
    `CREATE INDEX IF NOT EXISTS idx_screenshots_machine ON screenshots(machine_id)`,
    `CREATE INDEX IF NOT EXISTS idx_machines_token ON machines(token)`,
  ];

  for (const sql of tables) {
    db.run(sql);
  }

  // Force save
  const { saveDb } = require("./index");
  const fs = require("fs");
  const data = db.export();
  fs.writeFileSync(process.env.DB_PATH || "./staffwatch.db", Buffer.from(data));

  console.log("✅ Database migrated successfully");
}

migrate().catch(e => { console.error(e); process.exit(1); });
