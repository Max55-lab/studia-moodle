const { test, expect } = require("@playwright/test");

const MOCK_PROXY = "http://127.0.0.1:8788";

function collectErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("fokus nadzorne ploče je sažetak, a detalji se otvaraju zasebno", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/");

  await expect(page.locator("#focus-heading")).toBeVisible();
  await expect(page.locator("#quick-tasks-grid .next-task__card")).toBeVisible();
  await expect(page.locator("#focus-average")).not.toHaveText("—");
  await expect(page.locator("#courses-carousel .course-card")).toHaveCount(5);
  await expect(page.locator("#dashboard-more[open]")).toHaveCount(0);

  await page.locator("#dashboard-more summary").click();
  await expect(page.locator("#planner-section")).toBeVisible();
  await expect(page.locator("#chart-grade-trend svg").first()).toBeVisible();
  await expect(page.locator("#chart-grade-donut svg").first()).toBeVisible();
  await expect(page.locator("#chart-course-progress div[title]").first()).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "clip");

  expect(errors, "console greške").toEqual([]);
});

test("navigacija između pogleda skriva prethodni i prikazuje novi tab", async ({ page }) => {
  await page.goto("/");

  await page.locator("[data-open-sidebar]").click();
  await page.locator(".nav-btn[data-tab='grades']").click();
  await expect(page.locator("#view-grades")).toBeVisible();
  await expect(page.locator("#view-dashboard")).toBeHidden();

  await page.locator("[data-open-sidebar]").click();
  await page.locator(".nav-btn[data-tab='materials']").click();
  await expect(page.locator("#view-materials")).toBeVisible();
  await expect(page.locator("#view-grades")).toBeHidden();
});

test("planer dodaje, završava i briše zadatak uz perzistenciju", async ({ page }) => {
  await page.goto("/");
  await page.locator("#dashboard-more summary").click();

  await page.locator("#planner-input").fill("E2E: ponoviti Laravel relacije");
  await page.locator("#planner-form button[type='submit']").click();

  let item = page.locator("#planner-list li", { hasText: "E2E: ponoviti Laravel relacije" });
  await expect(item).toBeVisible();
  await expect(page.locator("#planner-progress-label")).toHaveText(/0 \/ 1/);

  await item.locator("[data-todo-toggle]").click();
  await expect(page.locator("#planner-progress-label")).toHaveText(/1 \/ 1/);

  await page.reload();
  await page.locator("#dashboard-more summary").click();
  item = page.locator("#planner-list li", { hasText: "E2E: ponoviti Laravel relacije" });
  await expect(item).toBeVisible();
  await expect(item.locator("[data-todo-toggle]")).toHaveAttribute("aria-pressed", "true");

  await item.locator("[data-todo-delete]").click();
  await expect(page.locator("#planner-list li", { hasText: "E2E: ponoviti Laravel relacije" })).toHaveCount(0);
});

test("favoriti kolegija rade i nakon ponovnog učitavanja", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#courses-carousel [data-course-fav]").first()).toHaveAttribute("aria-pressed", "false");
  await page.locator("#courses-carousel [data-course-fav]").first().click();
  await expect(page.locator("#courses-carousel [data-course-fav]").first()).toHaveAttribute("aria-pressed", "true");

  await page.locator("[data-course-filter='favorites']").click();
  await expect(page.locator("#courses-carousel .course-card")).toHaveCount(1);

  await page.reload();
  await expect(page.locator("#courses-carousel [data-course-fav]").first()).toHaveAttribute("aria-pressed", "true");
});

test("tamni način rada ostaje pohranjen nakon ponovnog učitavanja", async ({ page }) => {
  await page.goto("/");

  await page.locator("#theme-toggle-btn").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("#theme-toggle-btn")).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("live sinkronizacija zamjenjuje demo podatke, povratak u demo ih vraća", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/");
  await page.locator("#dashboard-more summary").click();
  await expect(page.locator("#courses-carousel .course-card")).toHaveCount(5);

  await page.locator("#header-sync-text").click();
  await expect(page.locator("#moodle-modal")).toBeVisible();

  await page.locator("[data-moodle-mode='live']").click();
  await page.locator("#moodle-proxy-input").fill(MOCK_PROXY);
  await page.locator("#moodle-sync-btn").click();

  await expect(page.locator("#moodle-status")).toHaveText("Live · sinkronizirano");
  await expect(page.locator("#courses-carousel .course-card")).toHaveCount(3);
  await expect(page.locator("#chart-grade-trend svg").first()).toBeVisible();

  await page.locator("[data-moodle-mode='demo']").click();
  await expect(page.locator("#courses-carousel .course-card")).toHaveCount(5);
  await expect(page.locator("#moodle-status")).toContainText("Demo");

  expect(errors, "console greške").toEqual([]);
});
