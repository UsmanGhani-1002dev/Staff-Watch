// src/db/seed.js
const { getDb, prepare } = require("./index");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
require("dotenv").config();

async function seed() {
  const db = await getDb();
  const email = process.env.SUPERADMIN_EMAIL || "shaf@enovtec.com";
  const password = process.env.SUPERADMIN_PASSWORD || "changeme123";

  const existing = prepare(db, "SELECT id FROM users WHERE email = ?").get(email);
  if (existing) { console.log("Superadmin already exists"); return db; }

  const superOrgId = uuidv4();
  prepare(db, "INSERT INTO organisations (id, name, slug, plan, seat_limit) VALUES (?, ?, ?, ?, ?)")
    .run(superOrgId, "Enovtec", "enovtec", "superadmin", 9999);

  const hash = await bcrypt.hash(password, 12);
  prepare(db, "INSERT INTO users (id, org_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)")
    .run(uuidv4(), superOrgId, "Shaf", email, hash, "superadmin");
  console.log(`✅ Superadmin created: ${email}`);

  const kirpaOrgId = uuidv4();
  prepare(db, "INSERT INTO organisations (id, name, slug, plan, seat_limit) VALUES (?, ?, ?, ?, ?)")
    .run(kirpaOrgId, "Kirpa Care", "kirpa-care", "growth", 15);
  const kirpaHash = await bcrypt.hash("kirpacare123", 12);
  prepare(db, "INSERT INTO users (id, org_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)")
    .run(uuidv4(), kirpaOrgId, "Kirpa Manager", "manager@kirpacare.co.uk", kirpaHash, "client-admin");
  console.log("✅ Demo org (Kirpa Care) created");

  // Save DB
  const data = db.export();
  fs.writeFileSync(process.env.DB_PATH || "./staffwatch.db", Buffer.from(data));
  return db;
}

seed().catch(console.error);
