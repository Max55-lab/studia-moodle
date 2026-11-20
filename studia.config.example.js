/**
 * Primjer konfiguracije za integraciju Studia portala.
 *
 * Kako koristiti:
 * 1) Kopiraj/uključi ovu datoteku kao <script> PRIJE `assets/js/config.js`
 *    ili postavi `window.STUDIA_CONFIG` inline u HTML-u.
 * 2) Prilagodi vrijednosti (branding, značajke, linkove, hookove).
 * 3) Za zamjenu podataka vidi docs/INTEGRATION.md i docs/DATA_MODEL.md.
 */
window.STUDIA_CONFIG = {
  app: {
    name: "Studia",
    locale: "hr",
    demoMode: true
  },
  branding: {
    productName: "Studia",
    institutionShort: "SUM",
    institutionName: "Sveučilište u Mostaru",
    portalLabel: "SUM e-Učenje",
    themeColorLight: "#7c3aed",
    themeColorDark: "#0b0f19"
  },
  features: {
    themeToggle: true,
    notifications: true,
    moodleSync: true,
    aiAssistant: true,
    unihub: true,
    calendarExport: true,
    downloads: true,
    liveProxy: true
  },
  storage: {
    prefix: "studia:",
    persistPreferences: true
  },
  integration: {
    dataSource: "demo", // "demo" | "external"
    onBeforeInit: function (ctx) {
      // Primjer hook-a: možeš pripremiti podatke ili prilagoditi okruženje.
      // console.log("Studia before init", ctx);
    },
    onAfterInit: function (ctx) {
      // Primjer: reagiraj nakon inicijalizacije.
    },
    adapters: {
      moodle: null,
      data: null
    }
  },
  ui: {
    defaultTab: "dashboard",
    dateLocale: "hr-HR"
  },
  links: {
    moodlePortal: "https://eucenje.sum.ba/moodle/",
    repository: "https://github.com/Max55-lab/studia-moodle"
  }
  // data: { ... } // napredno: override demo podataka (vidi docs/DATA_MODEL.md)
};
