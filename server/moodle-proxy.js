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

async function countGrades(courseIds, userId) {
  let total = 0;

  for (const courseId of courseIds) {
    try {
      const report = await callMoodle("gradereport_user_get_grade_items", {
        courseid: courseId,
        userid: userId
      });
      const userGrades = Array.isArray(report.usergrades) ? report.usergrades : [];
      const items = userGrades.length > 0 && Array.isArray(userGrades[0].gradeitems)
        ? userGrades[0].gradeitems
        : [];
      total += items.filter((item) => {
        return item && typeof item.gradeformatted === "string" && item.gradeformatted.trim() !== "-";
      }).length;
    } catch (error) {
      // Neke Moodle instalacije ne dopuštaju ovaj izvještaj studentima.
    }
  }

  return total;
}

async function countMaterials(courseIds) {
  let total = 0;

  for (const courseId of courseIds) {
    try {
      const sections = await callMoodle("core_course_get_contents", { courseid: courseId });
      if (!Array.isArray(sections)) continue;
      sections.forEach((section) => {
        const modules = Array.isArray(section.modules) ? section.modules : [];
        total += modules.filter((module) => {
          return ["resource", "folder", "url", "page", "book", "file"].includes(module.modname);
        }).length;
      });
    } catch (error) {
      // Sadržaj kolegija može biti skriven ili zaključan.
    }
  }

  return total;
}

async function countAssignments(courseIds) {
  if (courseIds.length === 0) return 0;

  try {
    const result = await callMoodle("mod_assign_get_assignments", { courseids: courseIds });
    const courses = Array.isArray(result.courses) ? result.courses : [];
    return courses.reduce((total, course) => {
      return total + (Array.isArray(course.assignments) ? course.assignments.length : 0);
    }, 0);
  } catch (error) {
    return 0;
  }
}

async function countUnreadMessages(userId) {
  try {
    const result = await callMoodle("core_message_get_unread_conversation_counts", { userid: userId });
    const types = Array.isArray(result.types) ? result.types : Object.values(result.types || {});
    return types.reduce((total, type) => total + Number(type && type.unread ? type.unread : 0), Number(result.favourites || 0));
  } catch (error) {
    return 0;
  }
}

async function syncMoodle() {
  const siteInfo = await callMoodle("core_webservice_get_site_info");
  const userId = Number(siteInfo.userid);
  if (!userId) throw new Error("Nije moguće odrediti Moodle korisnika iz tokena.");

  const courses = await callMoodle("core_enrol_get_users_courses", { userid: userId });
  const courseList = Array.isArray(courses) ? courses : [];
  const courseIds = courseList.map((course) => Number(course.id)).filter(Boolean);

  const [grades, materials, assignments, notifications] = await Promise.all([
    countGrades(courseIds, userId),
    countMaterials(courseIds),
    countAssignments(courseIds),
    countUnreadMessages(userId)
  ]);

  return {
    ok: true,
    source: "SUM Moodle · eucenje.sum.ba",
    syncedAt: new Date().toISOString(),
    user: {
      id: userId,
      fullname: siteInfo.fullname || ""
    },
    summary: {
      courses: courseList.length,
      grades,
      materials,
      assignments,
      notifications
    }
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
