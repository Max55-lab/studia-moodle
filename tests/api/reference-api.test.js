const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// Testovi prijavljuju različite korisnike pa je prag dizan samo u testnom procesu.
process.env.STUDIA_REF_LOGIN_LIMIT = "500";
const { createApp } = require("../../server/reference/server");
const { DEMO_PASSWORD, verifyPassword } = require("../../server/reference/auth");

let server;
let base;
let dbPath;

before(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "studia-ref-api-"));
  dbPath = path.join(directory, "test.db");
  server = createApp({ dbPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (server?.db?.open) server.db.close();
  if (dbPath) fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
});

async function request(method, urlPath, { token, csrf, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (csrf) headers["x-csrf-token"] = csrf;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(base + urlPath, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: response.status, body: parsed };
}

async function login(email) {
  const response = await request("POST", "/api/v1/auth/login", {
    body: { email, password: DEMO_PASSWORD }
  });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body;
}

test("health_endpoint je dostupan bez prijave", async () => {
  const response = await request("GET", "/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

test("kriva lozinka vraća 401 bez tokena", async () => {
  const response = await request("POST", "/api/v1/auth/login", {
    body: { email: "pro@demo.sum.ba", password: "krivo123" }
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.error, "InvalidCredentials");
  assert.equal(response.body.token, undefined);
});

test("uspješna prijava ne otkriva hash lozinke", async () => {
  const response = await login("pro@demo.sum.ba");
  assert.ok(response.token && response.csrfToken);
  assert.equal(response.user.email, "pro@demo.sum.ba");
  assert.deepEqual(response.user.roles, ["StudentPro"]);
  assert.equal(response.body?.password_hash, undefined);
  assert.equal(response.user.passwordHash, undefined);
  assert.equal(JSON.stringify(response).includes("scrypt$"), false);
});

test("zaštićena ruta bez sesije vraća 401", async () => {
  const response = await request("GET", "/api/v1/me");
  assert.equal(response.status, 401);
  assert.equal(response.body.error, "Unauthorized");
});

test("me vraća identitet, uloge i dozvole iz baze", async () => {
  const session = await login("moderator@demo.sum.ba");
  const response = await request("GET", "/api/v1/me", { token: session.token });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.roles, ["FacultyModerator"]);
  assert.deepEqual(response.body.permissions, [
    "material:delete", "material:read", "material:upload", "material:verify"
  ]);
});

test("korisnik bez dozvole dobiva 403 s jasnom porukom", async () => {
  const session = await login("guest@demo.sum.ba");
  const response = await request("GET", "/api/v1/materials", { token: session.token });
  assert.equal(response.status, 403);
  assert.equal(response.body.error, "Forbidden");
  assert.match(response.body.message, /material:read/);
});

test("materijali su izolirani po instituciji", async () => {
  const first = await login("free@demo.sum.ba");
  const second = await login("pro@demo.other.ba");

  const firstResponse = await request("GET", "/api/v1/materials", { token: first.token });
  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.body.items.length, 2);
  assert.equal(firstResponse.body.items.some((item) => item.title.includes("druge institucije")), false);

  const secondResponse = await request("GET", "/api/v1/materials", { token: second.token });
  assert.equal(secondResponse.status, 200);
  assert.equal(secondResponse.body.items.length, 1);
  assert.equal(secondResponse.body.items[0].institution_id ?? 2, 2);
});

test("upload bez dozvole vraća 403", async () => {
  const session = await login("free@demo.sum.ba");
  const response = await request("POST", "/api/v1/materials", {
    token: session.token,
    csrf: session.csrfToken,
    body: { title: "Nedozvoljeni materijal", content: "Sadržaj" }
  });
  assert.equal(response.status, 403);
  assert.match(response.body.message, /material:upload/);
});

test("mutacija bez CSRF tokena vraća 403", async () => {
  const session = await login("pro@demo.sum.ba");
  const missing = await request("POST", "/api/v1/materials", {
    token: session.token,
    body: { title: "Bez CSRF tokena", content: "Sadržaj" }
  });
  assert.equal(missing.status, 403);
  assert.match(missing.body.message, /CSRF/);

  const wrong = await request("POST", "/api/v1/materials", {
    token: session.token,
    csrf: "pogresan",
    body: { title: "Krivi CSRF token", content: "Sadržaj" }
  });
  assert.equal(wrong.status, 403);
});

test("klijent ne može podmetnuti tuđu instituciju", async () => {
  const session = await login("pro@demo.sum.ba");
  const response = await request("POST", "/api/v1/materials", {
    token: session.token,
    csrf: session.csrfToken,
    body: { institutionId: 2, title: "Pokušaj prelaska", content: "Sadržaj" }
  });
  assert.equal(response.status, 403);
  assert.match(response.body.message, /druge institucije/);
});

test("upload s važećim tokenom kreira materijal u sesijskoj instituciji", async () => {
  const session = await login("pro@demo.sum.ba");
  const response = await request("POST", "/api/v1/materials", {
    token: session.token,
    csrf: session.csrfToken,
    body: { title: "E2E referentni materijal", content: "Sadržaj bilješke" }
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.item.institutionId, 1);
  assert.ok(response.body.item.id > 0);

  const stored = server.db.prepare("SELECT institution_id, owner_id FROM materials WHERE id = ?")
    .get(response.body.item.id);
  assert.equal(stored.institution_id, 1);
  assert.equal(stored.owner_id, 4);

  const list = await request("GET", "/api/v1/materials", { token: session.token });
  assert.equal(list.body.items.some((item) => item.title === "E2E referentni materijal"), true);
});

test("verifikacija i brisanje traže dozvolu i poštuju tenant", async () => {
  // Student Pro druge institucije nema dozvolu za verifikaciju → 403 prije upita.
  const other = await login("pro@demo.other.ba");
  const noPermission = await request("PATCH", "/api/v1/materials/1", {
    token: other.token,
    csrf: other.csrfToken,
    body: {}
  });
  assert.equal(noPermission.status, 403);

  // Moderator ima dozvolu, ali materijal pripada drugom tenantu → 404.
  const moderatorFirst = await login("moderator@demo.sum.ba");
  const crossTenant = await request("PATCH", "/api/v1/materials/3", {
    token: moderatorFirst.token,
    csrf: moderatorFirst.csrfToken,
    body: {}
  });
  assert.equal(crossTenant.status, 404);

  const free = await login("free@demo.sum.ba");
  const forbiddenDelete = await request("DELETE", "/api/v1/materials/1", {
    token: free.token,
    csrf: free.csrfToken
  });
  assert.equal(forbiddenDelete.status, 403);

  const moderator = await login("moderator@demo.sum.ba");
  const verified = await request("PATCH", "/api/v1/materials/1", {
    token: moderator.token,
    csrf: moderator.csrfToken,
    body: {}
  });
  assert.equal(verified.status, 200);
  assert.equal(verified.body.status, "verified");

  const deleted = await request("DELETE", "/api/v1/materials/1", {
    token: moderator.token,
    csrf: moderator.csrfToken
  });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.status, "deleted");

  const list = await request("GET", "/api/v1/materials", { token: moderator.token });
  assert.equal(list.body.items.some((item) => item.id === 1), false);
});

test("administracija je dostupna samo s dozvolom i samo za vlastiti tenant", async () => {
  const free = await login("free@demo.sum.ba");
  const forbidden = await request("GET", "/api/v1/admin/users", { token: free.token });
  assert.equal(forbidden.status, 403);

  const admin = await login("admin@demo.sum.ba");
  const allowed = await request("GET", "/api/v1/admin/users", { token: admin.token });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.items.length, 6);
  assert.equal(allowed.body.items.some((user) => user.email === "pro@demo.other.ba"), false);
});

test("odjava poništava sesiju", async () => {
  const session = await login("lead@demo.sum.ba");
  const beforeLogout = await request("GET", "/api/v1/me", { token: session.token });
  assert.equal(beforeLogout.status, 200);

  const logout = await request("POST", "/api/v1/auth/logout", {
    token: session.token,
    csrf: session.csrfToken,
    body: {}
  });
  assert.equal(logout.status, 200);

  const afterLogout = await request("GET", "/api/v1/me", { token: session.token });
  assert.equal(afterLogout.status, 401);
});

test("lozinka je pohranjena kao scrypt hash, a ne u čistom tekstu", () => {
  const stored = server.db.prepare("SELECT password_hash FROM users WHERE email = ?")
    .get("pro@demo.sum.ba").password_hash;
  assert.match(stored, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
  assert.notEqual(stored, DEMO_PASSWORD);
  assert.equal(stored.includes(DEMO_PASSWORD), false);
  assert.equal(verifyPassword(DEMO_PASSWORD, stored), true);
  assert.equal(verifyPassword("druga-lozinka", stored), false);
});

test("audit log bilježi mutacije", () => {
  const count = server.db.prepare("SELECT COUNT(*) AS total FROM audit_logs").get().total;
  assert.ok(count >= 3);
});
