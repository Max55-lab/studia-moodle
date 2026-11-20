/**
 * Studia — runtime konfiguracija i integracijski ulaz.
 *
 * Namjena: omogućiti prilagodbu i integraciju bez izmjene jezgre aplikacije gdje god je moguće.
 * Ovu datoteku učitaj PRIJE ostalih aplikacijskih skripti (prije data.js).
 *
 * Za prilagodbu: definiraj `window.STUDIA_CONFIG` prije učitavanja ove datoteke
 * ili uredi vrijednosti ispod u vlastitom fork/build procesu.
 */
(function (global) {
  "use strict";

  function deepMerge(target, source) {
    if (!source || typeof source !== "object") return target;
    Object.keys(source).forEach(function (key) {
      var sv = source[key];
      var tv = target[key];
      if (Array.isArray(sv)) {
        target[key] = sv.slice();
      } else if (sv && typeof sv === "object") {
        if (!tv || typeof tv !== "object" || Array.isArray(tv)) target[key] = {};
        deepMerge(target[key], sv);
      } else {
        target[key] = sv;
      }
    });
    return target;
  }

  var defaults = {
    app: {
      name: "Studia",
      version: "1.1.0",
      locale: "hr",
      demoMode: true,
      fixedTodayISO: "2026-11-18T09:00:00+01:00"
    },
    branding: {
      productName: "Studia",
      institutionShort: "SUM",
      institutionName: "Sveučilište u Mostaru",
      portalLabel: "SUM e-Učenje",
      primaryColor: "#7c3aed",
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
      // "demo" koristi ugrađene podatke; "external" očekuje da integrator osigura podatke/adaptere.
      dataSource: "demo",
      // Hookovi (opcionalno): funkcije koje integrator može postaviti.
      onBeforeInit: null,
      onAfterInit: null,
      onReady: null,
      // Adapteri (opcionalno): zamjena dijelova ponašanja.
      adapters: {
        moodle: null,
        data: null
      }
    },
    ui: {
      defaultTab: "dashboard",
      searchPlaceholder: "Pretraži kolegije, zadaće, skripte ili profesore...",
      dateLocale: "hr-HR"
    },
    links: {
      moodlePortal: "https://eucenje.sum.ba/moodle/",
      repository: "https://github.com/Max55-lab/studia-moodle"
    },
    // Opcionalni override podataka (napredno): vidi docs/DATA_MODEL.md i docs/INTEGRATION.md
    data: null
  };

  var userConfig = global.STUDIA_CONFIG || {};
  var config = deepMerge(defaults, userConfig);
  global.STUDIA_CONFIG = config;

  // Mali javni namespace za integratore (stabilna točka pristupa).
  global.Studia = global.Studia || {};
  global.Studia.config = config;
  global.Studia.version = config.app.version;

  global.Studia.getConfig = function () { return config; };
  global.Studia.setConfig = function (partial) {
    deepMerge(config, partial || {});
    return config;
  };

  // Pomoćno: emit jednostavnog DOM događaja za integracije koje slušaju lifecycle.
  global.Studia.emit = function (name, detail) {
    try {
      document.dispatchEvent(new CustomEvent("studia:" + name, { detail: detail || {} }));
    } catch (e) {
      // ok
    }
  };
})(window);
