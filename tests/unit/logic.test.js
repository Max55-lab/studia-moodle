const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..", "..");

function loadCore() {
  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    Number,
    String,
    Array,
    Object,
    window: { matchMedia: () => ({ matches: false }) },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      documentElement: { classList: { add() {}, remove() {}, toggle() {} } }
    }
  };
  const context = vm.createContext(sandbox);
  for (const file of ["data.js", "core.js"]) {
    const source = fs.readFileSync(path.join(ROOT, "assets", "js", file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

const run = (context, expression) => vm.runInContext(expression, context);

test("prazna povijest ocjena daje prosjek 0", () => {
  const context = loadCore();
  assert.equal(run(context, "calculateGradeAverage([])"), 0);
});

test("prosjek ocjena je ponderiran ECTS bodovima", () => {
  const context = loadCore();
  const entries = [{ grade: 5, ects: 6 }, { grade: 4, ects: 4 }];
  run(context, `globalThis.__entries = ${JSON.stringify(entries)}`);
  assert.equal(run(context, "calculateGradeAverage(__entries)"), 4.6);
});

test("zbroj ECTS-a odgovara podatkovnom modelu", () => {
  const context = loadCore();
  const expected = run(context, "GRADE_HISTORY.reduce((sum, g) => sum + Number(g.ects || 0), 0)");
  assert.equal(run(context, "getCompletedEcts()"), expected);
  assert.ok(expected > 0);

  const inProgress = run(context, "getEctsInProgress()");
  assert.ok(inProgress > 0);
});

test("distribucija ocjena pokriva sve unose i redoslijed 5 do 1", () => {
  const context = loadCore();
  const distribution = run(context, "getGradeDistribution()");
  assert.deepEqual(Array.from(distribution, (item) => item.grade), [5, 4, 3, 2, 1]);
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  assert.equal(total, run(context, "GRADE_HISTORY.length"));
});

test("formatiranje datuma i broja zadataka je stabilno", () => {
  const context = loadCore();
  assert.equal(run(context, `formatDateISO("2026-11-27")`), "27. 11. 2026.");
  assert.equal(run(context, `formatDateISO("")` ), "");

  const upcoming = run(context, "getActiveUpcomingCount()");
  assert.ok(Number.isInteger(upcoming) && upcoming >= 0);
});
