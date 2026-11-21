/* =========================================================
   STUDIA — mock Moodle proxy za lokalni razvoj
   Servira isti ugovor kao server/moodle-proxy.js, ali s
   izmišljenim podacima. Koristi se za testiranje live načina
   bez Moodle tokena.

   Pokretanje: node scripts/mock-moodle-proxy.js
   ========================================================= */

"use strict";

const http = require("node:http");

const PORT = Number(process.env.PORT || 8788);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

function mockPayload() {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;

  const courses = [
    { id: 101, shortname: "SUM-WEB", fullname: "Web aplikacije", summary: "Laravel i Eloquent ORM.", completionprogress: 75, completedactivities: 6, totalactivities: 8 },
    { id: 102, shortname: "SUM-BP2", fullname: "Baze podataka 2", summary: "Napredni SQL i indeksiranje.", completionprogress: 62, completedactivities: 5, totalactivities: 8 },
    { id: 103, shortname: "SUM-AI", fullname: "Umjetna inteligencija", summary: "Osnove strojnog učenja.", completionprogress: 40, completedactivities: 3, totalactivities: 8 }
  ];

  const grades = [
    { id: 1, courseid: 101, coursename: "Web aplikacije", itemname: "Kolokvij 1", gradeformatted: "5 (100%)", rawgrade: 95, rawgrademax: 100 },
    { id: 2, courseid: 102, coursename: "Baze podataka 2", itemname: "SQL projekt", gradeformatted: "4 (80%)", rawgrade: 82, rawgrademax: 100 },
    { id: 3, courseid: 103, coursename: "Umjetna inteligencija", itemname: "Kviz", gradeformatted: "3 (60%)", rawgrade: 64, rawgrademax: 100 }
  ];

  const materials = [
    { id: 1, courseid: 101, section: "Tjedan 1", name: "Uvod u Laravel", modname: "resource", added: now - 7 * day },
    { id: 2, courseid: 101, section: "Tjedan 2", name: "Routing i kontroleri", modname: "page", added: now - 5 * day },
    { id: 3, courseid: 102, section: "Tjedan 1", name: "Indeksi i planovi upita", modname: "resource", added: now - 3 * day }
  ];

  const assignments = [
    { id: 1, courseid: 101, coursename: "Web aplikacije", name: "Laravel CRUD sustav", duedate: now + 2 * day, grade: 10, intro: "Predati ZIP arhivu." },
    { id: 2, courseid: 102, coursename: "Baze podataka 2", name: "SQL optimizacija", duedate: now + 4 * day, grade: 5, intro: "Analiza plana upita." }
  ];

  const notifications = [
    { id: "asg-1", type: "deadline", title: "Rok: Laravel CRUD sustav", text: "Web aplikacije", dateISO: new Date((now + 2 * day) * 1000).toISOString().slice(0, 10), targetTab: "assignments", targetId: 1, unread: false }
  ];

  return {
    ok: true,
    source: "Mock Moodle proxy",
    syncedAt: new Date().toISOString(),
    user: { id: 99, fullname: "Test Student" },
    summary: {
      courses: courses.length,
      grades: grades.length,
      materials: materials.length,
      assignments: assignments.length,
      notifications: notifications.length
    },
    data: { courses, grades, materials, assignments, notifications }
  };
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "studia-moodle-mock-proxy",
      moodleUrl: "mock://local",
      moodleConfigured: true,
      allowedOrigin: "*"
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/moodle/sync") {
    sendJson(response, 200, mockPayload());
    return;
  }

  sendJson(response, 404, { ok: false, error: "Ruta nije pronađena." });
});

server.listen(PORT, () => {
  console.log(`Studia mock Moodle proxy radi na http://127.0.0.1:${PORT}`);
});
