/* =========================================================
   STUDIA — Moodle API adapter
   Demo način radi bez poslužitelja. Live način šalje zahtjev
   na backend proxy koji čuva Moodle token izvan preglednika.
   ========================================================= */

"use strict";

const MoodleAPI = (() => {
  const DEFAULT_PROXY = "http://localhost:8787";
  const DEMO_SYNC_ISO = "2026-11-18T09:00:00+01:00";
  const DEMO_SUMMARY = {
    courses: 5,
    grades: GRADE_HISTORY.length,
    materials: MATERIALS.length,
    assignments: ASSIGNMENTS.length,
    notifications: NOTIFICATIONS.length
  };

  function normalizeProxy(value) {
    const raw = String(value || "").trim().replace(/\/+$/, "");
    if (!raw) return "";

    try {
      const url = new URL(raw);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    } catch (error) {
      return "";
    }
  }

  async function sync(options = {}) {
    const config = state.moodleConfig;
    const mode = options.mode || config.mode;

    if (mode === "live") {
      const proxy = normalizeProxy(options.proxyUrl || config.proxyUrl);
      if (!proxy) {
        throw new Error("Unesi ispravan URL proxy poslužitelja (http ili https).");
      }

      let response;
      try {
        response = await fetch(`${proxy}/api/moodle/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
      } catch (error) {
        throw new Error("Proxy poslužitelj nije dostupan. Provjeri URL i je li server pokrenut.");
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        // Odgovor nije JSON; nastavljamo s generičkom greškom.
      }

      if (!response.ok || !payload || payload.ok !== true) {
        const message = payload && typeof payload.error === "string"
          ? payload.error
          : `Proxy je vratio HTTP ${response.status}.`;
        throw new Error(message);
      }

      return {
        mode: "live",
        syncedAt: payload.syncedAt || new Date().toISOString(),
        source: payload.source || "SUM Moodle",
        summary: {
          courses: Number(payload.summary && payload.summary.courses) || 0,
          grades: Number(payload.summary && payload.summary.grades) || 0,
          materials: Number(payload.summary && payload.summary.materials) || 0,
          assignments: Number(payload.summary && payload.summary.assignments) || 0,
          notifications: Number(payload.summary && payload.summary.notifications) || 0
        }
      };
    }

    await new Promise((resolve) => window.setTimeout(resolve, 550));

    return {
      mode: "demo",
      syncedAt: DEMO_SYNC_ISO,
      source: "Demo podaci",
      summary: { ...DEMO_SUMMARY }
    };
  }

  function saveConfig(mode, proxyUrl) {
    state.moodleConfig.mode = mode === "live" ? "live" : "demo";
    state.moodleConfig.proxyUrl = normalizeProxy(proxyUrl);
    persistMoodleConfig();
  }

  function saveResult(result) {
    state.moodleConfig.lastSync = result.syncedAt;
    state.moodleConfig.lastSyncMode = result.mode;
    state.moodleConfig.lastSummary = { ...result.summary };
    persistMoodleConfig();
    applyMoodleState();
  }

  function getSummaryText(summary) {
    if (!summary) return "Nema podataka o zadnjoj sinkronizaciji.";
    return [
      `${summary.courses} kolegija`,
      `${summary.grades} ocjena`,
      `${summary.materials} materijala`,
      `${summary.assignments} zadaća`
    ].join(" · ");
  }

  return {
    DEFAULT_PROXY,
    DEMO_SUMMARY,
    normalizeProxy,
    sync,
    saveConfig,
    saveResult,
    getSummaryText
  };
})();
