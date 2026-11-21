/* =========================================================
   Referentni API — identitet, hashiranje, sesije i ovlasti.
   Samo ugrađeni Node moduli. Nije dio produkcijskog smjera
   iz ADR-001; koristi generičke demo podatke.
   ========================================================= */

"use strict";

const crypto = require("node:crypto");

const SESSION_TTL_MS = 60 * 60 * 1000;
const DEMO_PASSWORD = "Demo123!";

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const expected = Buffer.from(parts[2], "hex");
  const actual = crypto.scryptSync(String(password), parts[1], expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function tokenDigest(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)"
  ).run(tokenDigest(token), userId, csrfToken, expiresAt);
  return { token, csrfToken, expiresAt };
}

function getSession(db, token) {
  if (!token) return null;

  const row = db.prepare(`
    SELECT s.token_hash, s.csrf_token, s.expires_at, s.revoked_at,
           u.id AS user_id, u.institution_id, u.email, u.display_name, u.status
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenDigest(token));

  if (!row || row.revoked_at || row.status !== "active") return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  const roles = db.prepare(`
    SELECT r.name FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ? ORDER BY r.name
  `).all(row.user_id).map((entry) => entry.name);

  const permissions = db.prepare(`
    SELECT DISTINCT p.key FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN user_roles ur ON ur.role_id = rp.role_id
    WHERE ur.user_id = ? ORDER BY p.key
  `).all(row.user_id).map((entry) => entry.key);

  return { ...row, roles, permissions };
}

function requireAuth(session) {
  if (!session) {
    throw new HttpError(401, "Unauthorized", "Potrebna je važeća prijava.");
  }
  return session;
}

function requirePermission(session, key) {
  requireAuth(session);
  if (!session.permissions.includes(key)) {
    throw new HttpError(403, "Forbidden", `Nedozvoljen pristup: potrebna dozvola "${key}".`);
  }
  return session;
}

function requireCsrf(session, provided) {
  requireAuth(session);
  if (!provided || provided !== session.csrf_token) {
    throw new HttpError(403, "Forbidden", "Nedozvoljen pristup: nevažeći CSRF token.");
  }
}

function requireTenant(session, requestedInstitutionId) {
  if (requestedInstitutionId === undefined || requestedInstitutionId === null) return;
  if (Number(requestedInstitutionId) !== Number(session.institution_id)) {
    throw new HttpError(403, "Forbidden", "Nedozvoljen pristup: podaci druge institucije.");
  }
}

function revokeSession(db, token) {
  db.prepare(
    "UPDATE sessions SET revoked_at = datetime('now') WHERE token_hash = ? AND revoked_at IS NULL"
  ).run(tokenDigest(token));
}

module.exports = {
  DEMO_PASSWORD,
  HttpError,
  hashPassword,
  verifyPassword,
  tokenDigest,
  createSession,
  getSession,
  requireAuth,
  requirePermission,
  requireCsrf,
  requireTenant,
  revokeSession
};
