// src/db/index.js - sql.js wrapper with file persistence
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || "./staffwatch.db";

let _db = null;
let _SQL = null;
let _saveTimer = null;

function saveDb() {
  if (_db) {
    const data = _db.export();
    const buf = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buf);
  }
}

// Auto-save every 5 seconds if there were writes
function scheduleSave() {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    saveDb();
    _saveTimer = null;
  }, 5000);
}

async function getDb() {
  if (_db) return _db;

  if (!_SQL) {
    _SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new _SQL.Database(fileBuffer);
  } else {
    _db = new _SQL.Database();
  }

  // Wrap run to schedule saves automatically
  const originalRun = _db.run.bind(_db);
  _db.runAndSave = function(...args) {
    const result = originalRun(...args);
    scheduleSave();
    return result;
  };

  // Pragma
  _db.run("PRAGMA journal_mode = WAL");
  _db.run("PRAGMA foreign_keys = ON");

  // Graceful shutdown save
  process.on("exit", saveDb);
  process.on("SIGINT", () => { saveDb(); process.exit(0); });
  process.on("SIGTERM", () => { saveDb(); process.exit(0); });

  return _db;
}

// Synchronous query helpers that mimic better-sqlite3 API
function prepare(db, sql) {
  return {
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params.flat());
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params) => {
      const results = [];
      const stmt = db.prepare(sql);
      stmt.bind(params.flat());
      while (stmt.step()) results.push(stmt.getAsObject());
      stmt.free();
      return results;
    },
    run: (...params) => {
      db.run(sql, params.flat());
      scheduleSave();
      return { changes: db.getRowsModified() };
    }
  };
}

module.exports = { getDb, prepare };
