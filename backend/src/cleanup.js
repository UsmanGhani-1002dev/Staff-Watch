// src/cleanup.js — Nightly screenshot cleanup job
const fs = require("fs");
const path = require("path");
const { getDb, prepare } = require("./db");

const SCREENSHOTS_DIR = process.env.SCREENSHOTS_DIR || "./screenshots";

async function runCleanup() {
  try {
    const db = await getDb();
    console.log(`[Cleanup] Starting screenshot cleanup at ${new Date().toISOString()}`);

    // Get all active organisations with their retention setting
    const orgs = prepare(db, "SELECT id, name, screenshot_retention_days FROM organisations WHERE active = 1").all();

    let totalDeleted = 0;

    for (const org of orgs) {
      const retentionDays = org.screenshot_retention_days || 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      const cutoffStr = cutoff.toISOString();

      // Find expired screenshots for this org
      const expired = prepare(db,
        "SELECT id, file_path FROM screenshots WHERE org_id = ? AND taken_at < ?"
      ).all(org.id, cutoffStr);

      if (expired.length === 0) continue;

      let orgDeleted = 0;
      for (const row of expired) {
        // Delete the actual file
        try {
          const fullPath = path.join(SCREENSHOTS_DIR, row.file_path);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (e) {
          console.warn(`[Cleanup] Could not delete file ${row.file_path}: ${e.message}`);
        }
        // Delete the DB record
        prepare(db, "DELETE FROM screenshots WHERE id = ?").run(row.id);
        orgDeleted++;
      }

      // Also clean up empty directories
      try {
        const orgDir = path.join(SCREENSHOTS_DIR, org.id);
        if (fs.existsSync(orgDir)) {
          cleanEmptyDirs(orgDir);
        }
      } catch (_) {}

      console.log(`[Cleanup] ${org.name}: deleted ${orgDeleted} screenshots older than ${retentionDays} days`);
      totalDeleted += orgDeleted;
    }

    console.log(`[Cleanup] Done. Total deleted: ${totalDeleted} screenshots.`);
  } catch (e) {
    console.error(`[Cleanup] Error during cleanup: ${e.message}`);
  }
}

function cleanEmptyDirs(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanEmptyDirs(fullPath);
      // Re-read after recursive clean
      if (fs.readdirSync(fullPath).length === 0) {
        fs.rmdirSync(fullPath);
      }
    }
  }
}

function scheduleDailyCleanup() {
  // Run once immediately at startup (catches any missed cleanups)
  runCleanup();

  // Then schedule to run every 24 hours at ~2am
  const now = new Date();
  const next2am = new Date();
  next2am.setHours(2, 0, 0, 0);
  if (next2am <= now) {
    next2am.setDate(next2am.getDate() + 1); // Tomorrow 2am
  }

  const msUntil2am = next2am - now;
  console.log(`[Cleanup] Next scheduled cleanup at ${next2am.toLocaleString()} (in ${Math.round(msUntil2am / 1000 / 60)} minutes)`);

  setTimeout(() => {
    runCleanup();
    // After first 2am run, repeat every 24 hours
    setInterval(runCleanup, 24 * 60 * 60 * 1000);
  }, msUntil2am);
}

module.exports = { scheduleDailyCleanup, runCleanup };
