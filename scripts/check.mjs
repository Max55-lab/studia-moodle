import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
let failed = false;

function ok(msg) { console.log(`OK  ${msg}`); }
function bad(msg) { console.error(`ERR ${msg}`); failed = true; }

const jsonFiles = ["package.json", ".prettierrc.json"];
for (const rel of jsonFiles) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  try {
    JSON.parse(fs.readFileSync(p, "utf8"));
    ok(`JSON: ${rel}`);
  } catch (e) {
    bad(`JSON: ${rel} (${e.message})`);
  }
}

const jsFiles = [
  "assets/js/config.js",
  "assets/js/data.js",
  "assets/js/core.js",
  "assets/js/live-data.js",
  "assets/js/render.js",
  "assets/js/views.js",
  "assets/js/charts.js",
  "assets/js/moodle-api.js",
  "assets/js/app.js",
  "server/moodle-proxy.js",
  "scripts/mock-moodle-proxy.js"
];
for (const rel of jsFiles) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  try {
    execSync(`node --check "${p}"`, { stdio: "pipe" });
    ok(`Syntax: ${rel}`);
  } catch (e) {
    bad(`Syntax: ${rel}`);
  }
}

const required = [
  "index.html",
  "assets/css/style.css",
  "assets/css/tailwind.css",
  "README.md",
  "LICENSE",
  "docs/INTEGRATION.md"
];
for (const rel of required) {
  if (fs.existsSync(path.join(root, rel))) ok(`Exists: ${rel}`);
  else bad(`Missing: ${rel}`);
}

/* Lagane smoke-provjere HTML-a — hvataju neusinkronizirane mount točke,
   duplicirane ID-ove i izostavljene scriptove bez pokretanja browsera. */
const htmlPath = path.join(root, "index.html");
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, "utf8");

  const requiredIds = [
    "planner-section",
    "planner-form",
    "planner-input",
    "planner-deadline",
    "planner-list",
    "planner-progress-label",
    "chart-grade-trend",
    "chart-grade-donut",
    "chart-course-progress"
  ];
  for (const id of requiredIds) {
    if (html.includes(`id="${id}"`)) ok(`HTML id: ${id}`);
    else bad(`HTML id missing: ${id}`);
  }

  const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = [...new Set(allIds.filter((id, index) => allIds.indexOf(id) !== index))];
  if (duplicates.length === 0) ok("HTML: nema dupliciranih ID-ova");
  else bad(`HTML duplicirani ID-ovi: ${duplicates.join(", ")}`);

  const dataAt = html.indexOf("assets/js/data.js");
  const coreAt = html.indexOf("assets/js/core.js");
  const liveAt = html.indexOf("assets/js/live-data.js");
  const renderAt = html.indexOf("assets/js/render.js");
  const viewsAt = html.indexOf("assets/js/views.js");
  const chartsAt = html.indexOf("assets/js/charts.js");
  const appAt = html.indexOf("assets/js/app.js");

  if (dataAt > 0 && coreAt > dataAt && liveAt > coreAt && renderAt > liveAt) ok("HTML redoslijed: data.js → core.js → live-data.js → render.js");
  else bad("HTML redoslijed core/live-data nije ispravan");

  if (chartsAt > viewsAt && chartsAt < appAt) ok("HTML redoslijed: views.js → charts.js → app.js");
  else bad("HTML redoslijed scriptova nije ispravan");
}

if (failed) {
  console.error("\nProvjere nisu prošle.");
  process.exit(1);
}
console.log("\nSve osnovne provjere su prošle.");
