/* =========================================================
   Referentni API — HTTP poslužitelj sa server-side
   autorizacijom, CSRF-om i izolacijom po instituciji.
   Pokreće se samo eksplicitno; nije spojen na demo portal.
   ========================================================= */

"use strict";

const http = require("node:http");
const { createDatabase } = require("./db");
const {
  HttpError,
  verifyPassword,
  createSession,
  getSession,
  requireAuth,
  requirePermission,
  requireCsrf,
  requireTenant,
  revokeSession
} = require("./auth");

const MAX_BODY_BYTES = 1024 * 1024;
const LOGIN_LIMIT = Number(process.env.STUDIA_REF_LOGIN_LIMIT || 10);
const LOGIN_WINDOW_MS = 60 * 1000;
const ALLOWED_ORIGIN = process.env.STUDIA_REF_ORIGIN || "";

function corsHeaders(req) {
  if (!ALLOWED_ORIGIN || req.headers.origin !== ALLOWED_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-csrf-token",
    Vary: "Origin"
  };
}

function sendJson(req, res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    ...corsHeaders(req)
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, "PayloadTooLarge", "Zahtjev je prevelik.");
    }
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "BadRequest", "Neispravan JSON u tijelu zahtjeva.");
  }
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

function requireString(value, field, min, max) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new HttpError(400, "BadRequest", `Polje "${field}" mora imati ${min}–${max} znakova.`);
  }
  return value.trim();
}

function positiveId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "BadRequest", "Neispravan identifikator materijala.");
  }
  return id;
}

function createApp(options = {}) {
  const db = createDatabase(options.dbPath);
  const loginAttempts = new Map();

  function loginAllowed(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now - entry.startedAt >= LOGIN_WINDOW_MS) {
      loginAttempts.set(ip, { startedAt: now, count: 1 });
      return true;
    }
    if (entry.count >= LOGIN_LIMIT) return false;
    entry.count += 1;
    return true;
  }

  async function route(req, res) {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;
    const method = req.method;

    if (pathname === "/health" && method === "GET") {
      sendJson(req, res, 200, { ok: true, service: "studia-reference-api" });
      return;
    }

    if (method === "OPTIONS") {
      if (ALLOWED_ORIGIN && req.headers.origin === ALLOWED_ORIGIN) {
        res.writeHead(204, corsHeaders(req));
        res.end();
        return;
      }
      throw new HttpError(403, "Forbidden", "Nedozvoljen izvor zahtjeva (CORS).");
    }

    if (pathname === "/api/v1/auth/login" && method === "POST") {
      if (!loginAllowed(req.socket.remoteAddress || "unknown")) {
        throw new HttpError(429, "TooManyRequests", "Previše pokušaja prijave. Pokušajte kasnije.");
      }
      const body = await readJson(req);
      const email = requireString(body.email, "email", 5, 120).toLowerCase();
      requireString(body.password, "password", 8, 200);

      const user = db.prepare(`
        SELECT id, email, display_name, institution_id, password_hash
        FROM users WHERE email = ? AND status = 'active' AND deleted_at IS NULL
      `).get(email);

      if (!user || !verifyPassword(body.password, user.password_hash)) {
        throw new HttpError(401, "InvalidCredentials", "Neispravni podaci za prijavu.");
      }

      const session = createSession(db, user.id);
      const roles = db.prepare(`
        SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = ? ORDER BY r.name
      `).all(user.id).map((entry) => entry.name);

      sendJson(req, res, 200, {
        token: session.token,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          institutionId: user.institution_id,
          roles
        }
      });
      return;
    }

    // Odavde nadolje svaka ruta prvo provjerava identitet.
    const token = bearerToken(req);
    const session = getSession(db, token);
    requireAuth(session);

    if (pathname === "/api/v1/auth/logout" && method === "POST") {
      requireCsrf(session, req.headers["x-csrf-token"]);
      revokeSession(db, token);
      sendJson(req, res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/v1/me" && method === "GET") {
      sendJson(req, res, 200, {
        user: {
          id: session.user_id,
          email: session.email,
          displayName: session.display_name,
          institutionId: session.institution_id
        },
        roles: session.roles,
        permissions: session.permissions
      });
      return;
    }

    if (pathname === "/api/v1/materials" && method === "GET") {
      requirePermission(session, "material:read");
      const items = db.prepare(`
        SELECT id, title, status, created_at FROM materials
        WHERE institution_id = ? AND status != 'deleted' ORDER BY id
      `).all(session.institution_id);
      sendJson(req, res, 200, { items });
      return;
    }

    if (pathname === "/api/v1/materials" && method === "POST") {
      requirePermission(session, "material:upload");
      requireCsrf(session, req.headers["x-csrf-token"]);
      const body = await readJson(req);
      requireTenant(session, body.institutionId);
      const title = requireString(body.title, "title", 3, 200);
      const content = requireString(body.content, "content", 1, 20000);

      const result = db.prepare(`
        INSERT INTO materials (institution_id, owner_id, title, content)
        VALUES (?, ?, ?, ?)
      `).run(session.institution_id, session.user_id, title, content);
      const id = Number(result.lastInsertRowid);
      db.prepare("INSERT INTO audit_logs (actor_id, action, target) VALUES (?, ?, ?)")
        .run(session.user_id, "material.upload", String(id));

      sendJson(req, res, 201, {
        item: { id, title, content, status: "published", institutionId: session.institution_id }
      });
      return;
    }

    const materialMatch = /^\/api\/v1\/materials\/(\d+)$/.exec(pathname);
    if (materialMatch && (method === "PATCH" || method === "DELETE")) {
      const id = positiveId(materialMatch[1]);
      const action = method === "PATCH" ? "material:verify" : "material:delete";
      requirePermission(session, action);
      requireCsrf(session, req.headers["x-csrf-token"]);
      if (method === "PATCH") await readJson(req);

      const status = method === "PATCH" ? "verified" : "deleted";
      const result = db.prepare(`
        UPDATE materials SET status = ?, updated_at = datetime('now')
        WHERE id = ? AND institution_id = ? AND status != 'deleted'
      `).run(status, id, session.institution_id);

      if (result.changes === 0) {
        throw new HttpError(404, "NotFound", "Materijal nije pronađen u ovoj instituciji.");
      }
      db.prepare("INSERT INTO audit_logs (actor_id, action, target) VALUES (?, ?, ?)")
        .run(session.user_id, action, String(id));

      sendJson(req, res, 200, { ok: true, id, status });
      return;
    }

    if (pathname === "/api/v1/admin/users" && method === "GET") {
      requirePermission(session, "admin:access");
      const items = db.prepare(`
        SELECT id, email, display_name, status FROM users
        WHERE institution_id = ? AND deleted_at IS NULL ORDER BY id
      `).all(session.institution_id);
      sendJson(req, res, 200, { items });
      return;
    }

    throw new HttpError(404, "NotFound", "Nepoznata ruta.");
  }

  const app = http.createServer((req, res) => {
    route(req, res).catch((error) => {
      if (error instanceof HttpError) {
        sendJson(req, res, error.status, { error: error.code, message: error.message });
        return;
      }
      sendJson(req, res, 500, { error: "Internal", message: "Interna greška poslužitelja." });
    });
  });

  app.db = db;
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8790);
  const app = createApp();
  app.listen(port, "127.0.0.1", () => {
    console.log(`Referentni API aktivan na http://127.0.0.1:${port} (generički demo podaci).`);
  });
}

module.exports = { createApp };
