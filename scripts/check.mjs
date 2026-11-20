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
  "assets/js/render.js",
  "assets/js/views.js",
  "assets/js/moodle-api.js",
  "assets/js/app.js",
  "server/moodle-proxy.js"
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

if (failed) {
  console.error("\nProvjere nisu prošle.");
  process.exit(1);
}
console.log("\nSve osnovne provjere su prošle.");
