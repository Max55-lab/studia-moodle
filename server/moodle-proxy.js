/* =========================================================
   STUDIA — SUM Moodle backend proxy (primjer)
   ---------------------------------------------------------
   Pokretanje (Node 18+):
     $env:MOODLE_TOKEN="..." ; node server/moodle-proxy.js

   Token se čita samo iz okoline i nikada se ne vraća klijentu.
   ========================================================= */

"use strict";

const http = require("node:http");

const PORT = Number(process.env.PORT || 8787);
const MOODLE_URL = String(process.env.MOODLE_URL || "https://eucenje.sum.ba/moodle").replace(/\/+$/, "");
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || "";
const ALLOWED_ORIGIN = String(process.env.ALLOWED_ORIGIN || "*");
const ALLOWED_ORIGINS = ALLOWED_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
const MAX_COURSES = Math.max(1, Number(process.env.STUDIA_MAX_COURSES || 20));
const MAX_ITEMS = Math.max(1, Number(process.env.STUDIA_MAX_ITEMS || 60));
const WS_ENDPOINT = `${MOODLE_URL}/webservice/rest/server.php`;

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (ALLOWED_ORIGIN === "*") {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function sendJson(response, status, payload, origin) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders(origin)
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Zahtjev je prevelik."));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Tijelo zahtjeva nije ispravan JSON."));
      }
    });
    request.on("error", reject);
  });
}

function appendParams(body, params, prefix = "") {
  Object.entries(params).forEach(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, index) => appendParams(body, { [index]: item }, name));
    } else if (value && typeof value === "object") {
      appendParams(body, value, name);
    } else if (value !== undefined && value !== null) {
      body.append(name, String(value));
    }
  });
}

async function callMoodle(functionName, params = {}) {
  if (!MOODLE_TOKEN) {
    throw new Error("MOODLE_TOKEN nije postavljen na poslužitelju.");
  }

  const body = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    moodlewsrestformat: "json",
    wsfunction: functionName
  });
  appendParams(body, params);

  const response = await fetch(WS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`Moodle je vratio neispravan odgovor (HTTP ${response.status}).`);
  }

  if (payload && payload.exception) {
    throw new Error("Moodle WebService je odbio zahtjev. Provjeri token i dopuštene funkcije.");
  }

  return payload;
}

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function stripHtml(value) {
  return String(value == null ? "" : value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

function toTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatShortDate(timestamp) {
  if (!timestamp) return "bez roka";
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}. ${month}. ${date.getFullYear()}.`;
}

async function fetchCompletions(courseIds, userId) {
  const result = {};

  for (const courseId of courseIds) {
    try {
      const status = await callMoodle("core_completion_get_course_completion_status", {
        courseid: courseId,
        userid: userId
      });
      const details = (status && status.completionstatus && status.completionstatus.progress)
        || (status && status.completionstatus)
        || {};
      result[courseId] = {
        completionprogress: Number(details.completionprogress) || 0,
        completedactivities: Number(details.completedactivities) || 0,
        totalactivities: Number(details.totalactivities) || 0
      };
    } catch (error) {
      // Completion nije omogućen za ovaj kolegij ili funkcija nije dopuštena.
    }
  }

  return result;
}

async function fetchCourses(userId) {
  const result = await callMoodle("core_enrol_get_users_courses", { userid: userId });
  const courses = safeList(result).slice(0, MAX_COURSES);
  const completions = await fetchCompletions(courses.map((course) => Number(course.id)), userId);

  return courses.map((course) => {
    const id = Number(course.id);
    const completion = completions[id] || {};

    return {
      id,
      shortname: String(course.shortname || `MOODLE-${id}`).slice(0, 80),
      fullname: String(course.fullname || course.shortname || `Kolegij ${id}`).slice(0, 160),
      summary: stripHtml(course.summary),
      startdate: toTimestamp(course.startdate),
      completionprogress: Math.max(0, Math.min(100, Number(completion.completionprogress) || 0)),
      completedactivities: Number(completion.completedactivities) || 0,
      totalactivities: Number(completion.totalactivities) || 0
    };
  });
}

async function fetchGrades(courses, userId) {
  const grades = [];

  for (const course of courses) {
    try {
      const report = await callMoodle("gradereport_user_get_grade_items", {
        courseid: course.id,
        userid: userId
      });
      const userGrades = safeList(report.usergrades);
      const items = userGrades.length > 0 ? safeList(userGrades[0].gradeitems) : [];

      items.slice(0, MAX_ITEMS).forEach((item) => {
        if (!item || typeof item.gradeformatted !== "string" || item.gradeformatted.trim() === "-") return;
        grades.push({
          id: Number(item.id) || grades.length + 1,
          courseid: course.id,
          coursename: course.fullname,
          itemname: String(item.itemname || item.itemmodule || "Ocjena").slice(0, 160),
          gradeformatted: item.gradeformatted,
          rawgrade: Number(item.rawgrade) || 0,
          rawgrademax: Number(item.rawgrademax) || 100
        });
      });
    } catch (error) {
      // Neke Moodle instalacije ne dopuštaju ovaj izvještaj studentima.
    }
  }

  return grades.slice(0, MAX_ITEMS);
}

async function fetchMaterials(courses) {
  const materials = [];

  for (const course of courses) {
    try {
      const sections = await callMoodle("core_course_get_contents", { courseid: course.id });

      safeList(sections).forEach((section) => {
        safeList(section.modules).slice(0, MAX_ITEMS).forEach((module) => {
          if (!["resource", "folder", "url", "page", "book", "file"].includes(module.modname)) return;
          materials.push({
            id: Number(module.id) || materials.length + 1,
            courseid: course.id,
            section: String(section.name || "Materijali").slice(0, 120),
            name: String(module.name || "Materijal").slice(0, 160),
            modname: module.modname,
            added: toTimestamp(module.added)
          });
        });
      });
    } catch (error) {
      // Sadržaj kolegija može biti skriven ili zaključan.
    }
  }

  return materials.slice(0, MAX_ITEMS * 2);
}

async function fetchAssignments(courses) {
  if (courses.length === 0) return [];

  try {
    const result = await callMoodle("mod_assign_get_assignments", {
      courseids: courses.map((course) => course.id)
    });
    const assignments = [];

    safeList(result.courses).forEach((course) => {
      const courseId = Number(course.id);
      const courseName = courses.find((item) => item.id === courseId);

      safeList(course.assignments).slice(0, MAX_ITEMS).forEach((assignment) => {
        assignments.push({
          id: Number(assignment.id) || assignments.length + 1,
          courseid: courseId,
          coursename: courseName ? courseName.fullname : "",
          name: String(assignment.name || "Zadaća").slice(0, 160),
          duedate: toTimestamp(assignment.duedate || assignment.due),
          grade: Number(assignment.grade) || 0,
          intro: stripHtml(assignment.intro)
        });
      });
    });

    return assignments.slice(0, MAX_ITEMS * 2);
  } catch (error) {
    return [];
  }
}

function buildNotifications(assignments, grades) {
  const notifications = [];

  [...assignments]
    .filter((assignment) => assignment.duedate > 0)
    .sort((first, second) => first.duedate - second.duedate)
    .slice(0, 3)
    .forEach((assignment, index) => {
      notifications.push({
        id: `asg-${index + 1}`,
        type: "deadline",
        title: `Rok: ${assignment.name}`,
        text: `${assignment.coursename} · ${formatShortDate(assignment.duedate)}`,
        dateISO: new Date(assignment.duedate * 1000).toISOString().slice(0, 10),
        targetTab: "assignments",
        targetId: assignment.id,
        unread: false
      });
    });

  grades.slice(-2).forEach((grade, index) => {
    notifications.push({
      id: `grade-${index + 1}`,
      type: "grade",
      title: `Ocjena: ${grade.gradeformatted}`,
      text: `${grade.itemname} · ${grade.coursename}`,
      dateISO: new Date().toISOString().slice(0, 10),
      targetTab: "grades",
      unread: false
    });
  });

  return notifications;
}

async function syncMoodle() {
  const siteInfo = await callMoodle("core_webservice_get_site_info");
  const userId = Number(siteInfo.userid);
  if (!userId) throw new Error("Nije moguće odrediti Moodle korisnika iz tokena.");

  const courses = await fetchCourses(userId);
  if (courses.length === 0) {
    throw new Error("Moodle nije vratio nijedan kolegij za ovog korisnika.");
  }

  const [grades, materials, assignments] = await Promise.all([
    fetchGrades(courses, userId),
    fetchMaterials(courses),
    fetchAssignments(courses)
  ]);
  const notifications = buildNotifications(assignments, grades);

  return {
    ok: true,
    source: `Moodle · ${new URL(MOODLE_URL).hostname}`,
    syncedAt: new Date().toISOString(),
    user: {
      id: userId,
      fullname: siteInfo.fullname || ""
    },
    summary: {
      courses: courses.length,
      grades: grades.length,
      materials: materials.length,
      assignments: assignments.length,
      notifications: notifications.length
    },
    // Normalizirani payload koji front-end preslikava u COURSES / GRADE_HISTORY /
    // MATERIALS / ASSIGNMENTS. Stari klijenti i dalje koriste samo `summary`.
    data: { courses, grades, materials, assignments, notifications }
  };
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders(origin));
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "studia-moodle-proxy",
      moodleUrl: MOODLE_URL,
      moodleConfigured: Boolean(MOODLE_TOKEN),
      allowedOrigin: ALLOWED_ORIGIN
    }, origin);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/moodle/sync") {
    try {
      await readJsonBody(request);
      const payload = await syncMoodle();
      sendJson(response, 200, payload, origin);
    } catch (error) {
      sendJson(response, 502, {
        ok: false,
        error: error && error.message ? error.message : "Sinkronizacija nije uspjela."
      }, origin);
    }
    return;
  }

  sendJson(response, 404, { ok: false, error: "Ruta nije pronađena." }, origin);
});

if (!MOODLE_TOKEN) {
  console.warn("UPOZORENJE: MOODLE_TOKEN nije postavljen. /api/moodle/sync vraća grešku.");
}

server.listen(PORT, () => {
  console.log(`Studia Moodle proxy radi na http://127.0.0.1:${PORT}`);
  console.log(`Moodle: ${MOODLE_URL}`);
});
