/* =========================================================
   Referentni API — trajna SQLite baza, normalizirani model,
   relacije, generički seed. Izvodivi pandan dijela schema.sql.
   ========================================================= */

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { DEMO_PASSWORD, hashPassword } = require("./auth");

const DEFAULT_DB_PATH = path.join(__dirname, "data", "reference.db");

function createDatabase(dbPath = process.env.STUDIA_REF_DB || DEFAULT_DB_PATH) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      institution_id INTEGER NOT NULL REFERENCES institutions(id),
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      revoked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY,
      institution_id INTEGER NOT NULL REFERENCES institutions(id),
      owner_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY,
      actor_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
    CREATE INDEX IF NOT EXISTS idx_materials_institution ON materials(institution_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  seed(db);
  return db;
}

function seed(db) {
  const passwordHash = hashPassword(DEMO_PASSWORD, "7265666572656e746e692d64656d6f");

  const insertInstitution = db.prepare("INSERT OR IGNORE INTO institutions (id, name) VALUES (?, ?)");
  insertInstitution.run(1, "Demo Sveučilište");
  insertInstitution.run(2, "Druga demo institucija");

  const roles = [
    [1, "SuperAdmin"],
    [2, "FacultyModerator"],
    [3, "CourseLead"],
    [4, "StudentPro"],
    [5, "StudentFree"],
    [6, "GuestViewer"]
  ];
  const insertRole = db.prepare("INSERT OR IGNORE INTO roles (id, name) VALUES (?, ?)");
  roles.forEach((role) => insertRole.run(...role));

  const permissions = [
    [1, "material:read", "Pregled materijala"],
    [2, "material:upload", "Upload materijala"],
    [3, "material:verify", "Verifikacija materijala"],
    [4, "material:delete", "Brisanje materijala"],
    [5, "admin:access", "Pristup administraciji"]
  ];
  const insertPermission = db.prepare(
    "INSERT OR IGNORE INTO permissions (id, key, description) VALUES (?, ?, ?)"
  );
  permissions.forEach((permission) => insertPermission.run(...permission));

  const grants = {
    1: [1, 2, 3, 4, 5], // SuperAdmin
    2: [1, 2, 3, 4],    // FacultyModerator
    3: [1, 2, 3],       // CourseLead
    4: [1, 2],          // StudentPro
    5: [1],             // StudentFree
    6: []               // GuestViewer
  };
  const insertGrant = db.prepare(
    "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)"
  );
  Object.entries(grants).forEach(([roleId, permissionIds]) => {
    permissionIds.forEach((permissionId) => insertGrant.run(Number(roleId), permissionId));
  });

  const users = [
    [1, 1, "admin@demo.sum.ba", "Administrator", 1],
    [2, 1, "moderator@demo.sum.ba", "Moderator fakulteta", 2],
    [3, 1, "lead@demo.sum.ba", "Nositelj kolegija", 3],
    [4, 1, "pro@demo.sum.ba", "Student Pro", 4],
    [5, 1, "free@demo.sum.ba", "Student Free", 5],
    [6, 1, "guest@demo.sum.ba", "Gost", 6],
    [7, 2, "pro@demo.other.ba", "Student Pro (druga institucija)", 4]
  ];
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, institution_id, email, display_name, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `);
  users.forEach((user) => insertUser.run(user[0], user[1], user[2], user[3], passwordHash));

  const insertUserRole = db.prepare(
    "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)"
  );
  users.forEach((user) => insertUserRole.run(user[0], user[4]));

  const insertMaterial = db.prepare(`
    INSERT OR IGNORE INTO materials (id, institution_id, owner_id, title, content, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMaterial.run(1, 1, 4, "Bilješke — Osnove baza podataka", "Relacijski model i SQL.", "published");
  insertMaterial.run(2, 1, 3, "Probni ispit — Web aplikacije", "Pitanja i rješenja.", "verified");
  insertMaterial.run(3, 2, 7, "Materijal druge institucije", "Ne smije biti vidljiv prvoj instituciji.", "published");
}

module.exports = { createDatabase, DEFAULT_DB_PATH };
