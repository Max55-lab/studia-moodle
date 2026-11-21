/* =========================================================
   STUDIA — jezgra aplikacije
   Tema, navigacija, pretraga, modali, toastovi i pomoćne
   funkcije koje koriste ostale datoteke.
   ========================================================= */

"use strict";

const STORAGE_KEYS = {
  academic: "studia:academic",
  moodle: "studia:moodle",
  moodleConfig: "studia:moodle-config",
  submissions: "studia:submitted-assignments",
  inboxRead: "studia:read-messages",
  notificationsRead: "studia:read-notifications",
  reminders: "studia:reminder-settings",
  planner: "studia:planner",
  favorites: "studia:favorites"
};

const state = {
  tab: "dashboard",
  courseFilter: "all",
  assignmentFilter: "all",
  gradeFilter: "all",
  materialCourse: "all",
  materialType: "all",
  materialsQuery: "",
  scriptsQuery: "",
  academic: { program: "fpmoz-rac", year: "2", semester: "zimski" },
  assignments: ASSIGNMENTS.map((assignment) => ({ ...assignment })),
  scripts: SCRIPTS.map((script) => ({ ...script })),
  inbox: INBOX.map((message) => ({ ...message })),
  notifications: NOTIFICATIONS.map((notification) => ({ ...notification })),
  reminderSettings: { ...DEFAULT_REMINDER_SETTINGS },
  todos: [],
  favorites: {},
  moodleConfig: {
    mode: "demo",
    proxyUrl: "",
    lastSync: null,
    lastSyncMode: null,
    lastSummary: null
  },
  moodleConnected: false,
  selectedAssignmentId: null,
  selectedMessageId: null,
  selectedCourseId: null,
  lastFocusedElement: null
};

const CROATIAN_MONTHS = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"
];

/* =========================================================
   POMOĆNE FUNKCIJE
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function icon(name, classes = "w-4 h-4") {
  return `<i data-lucide="${name}" class="${classes}"></i>`;
}

function getInitials(name) {
  const cleaned = String(name)
    .replace(/\b(prof|doc|dr|sc|izv|asist|mr|univ)\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function safeGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Privatni način rada može blokirati localStorage.
  }
}

function getCourse(courseId) {
  return COURSES.find((course) => course.id === courseId);
}

function getStartOfDemoDay() {
  return new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate()).getTime();
}

function isUpcoming(assignment) {
  return new Date(assignment.dueISO).getTime() >= getStartOfDemoDay();
}

function sortByDeadline(list, direction = 1) {
  return [...list].sort((first, second) => {
    return (new Date(first.dueISO) - new Date(second.dueISO)) * direction;
  });
}

function getUnreadCount() {
  return state.inbox.filter((message) => message.unread).length;
}

function getNotificationUnreadCount() {
  return state.notifications.filter((notification) => notification.unread).length;
}

function formatDateISO(dateISO) {
  if (!dateISO) return "";
  const parts = String(dateISO).split("-");
  if (parts.length !== 3) return String(dateISO);
  return `${Number(parts[2])}. ${Number(parts[1])}. ${parts[0]}.`;
}

function getEctsInProgress() {
  return COURSES.reduce((total, course) => total + Number(course.ects || 0), 0);
}

function getCompletedEcts() {
  return GRADE_HISTORY.reduce((total, grade) => total + Number(grade.ects || 0), 0);
}

function calculateGradeAverage(entries = GRADE_HISTORY) {
  if (!entries.length) return 0;
  const totals = entries.reduce((accumulator, entry) => {
    const ects = Number(entry.ects) || 1;
    accumulator.weighted += Number(entry.grade) * ects;
    accumulator.ects += ects;
    return accumulator;
  }, { weighted: 0, ects: 0 });

  if (!totals.ects) return 0;
  return totals.weighted / totals.ects;
}

function getFilteredGrades() {
  if (state.gradeFilter === "all") return GRADE_HISTORY;
  return GRADE_HISTORY.filter((grade) => grade.semesterId === state.gradeFilter);
}

function getGradeDistribution(entries = GRADE_HISTORY) {
  return [5, 4, 3, 2, 1].map((grade) => ({
    grade,
    count: entries.filter((entry) => entry.grade === grade).length
  }));
}

function getMaterial(materialId) {
  return MATERIALS.find((material) => material.id === Number(materialId));
}

function getMaterialType(type) {
  return MATERIAL_TYPES[type] || MATERIAL_TYPES.pdf;
}

function isMaterialNew(material) {
  const published = new Date(material.dateISO).getTime();
  const demoDay = getStartOfDemoDay();
  const week = 7 * 24 * 60 * 60 * 1000;
  return published <= demoDay && demoDay - published <= week;
}

function getNotification(notificationId) {
  return state.notifications.find((notification) => notification.id === Number(notificationId));
}

function getActiveUpcomingCount() {
  return state.assignments.filter((assignment) => {
    return isUpcoming(assignment) && assignment.status !== "submitted";
  }).length;
}

function getSubmittedCount() {
  return state.assignments.filter((assignment) => assignment.status === "submitted").length;
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* =========================================================
   TOASTOVI
   ========================================================= */

function showToast(message, type = "success") {
  const container = $("#toast-container");
  if (!container) return;

  const styles = {
    success: {
      icon: "check-circle-2",
      iconClass: "text-emerald-400",
      box: "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
    },
    error: {
      icon: "alert-circle",
      iconClass: "text-rose-400",
      box: "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
    },
    info: {
      icon: "info",
      iconClass: "text-studia-400",
      box: "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
    }
  };
  const style = styles[type] || styles.success;

  const toast = document.createElement("div");
  toast.className = `pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold max-w-sm transition-all duration-300 translate-y-2 opacity-0 ${style.box}`;
  toast.setAttribute("role", "status");

  const toastIcon = document.createElement("i");
  toastIcon.setAttribute("data-lucide", style.icon);
  toastIcon.className = `w-4 h-4 shrink-0 mt-0.5 ${style.iconClass}`;

  const text = document.createElement("span");
  text.textContent = message;

  toast.append(toastIcon, text);
  container.appendChild(toast);
  refreshIcons();

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  window.setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    window.setTimeout(() => toast.remove(), 300);
  }, 3400);
}

/* =========================================================
   TEMA
   ========================================================= */

function syncThemeUI() {
  const isDark = document.documentElement.classList.contains("dark");
  const moon = $("#theme-icon-moon");
  const sun = $("#theme-icon-sun");
  const button = $("#theme-toggle-btn");
  const meta = $('meta[name="theme-color"]');

  if (moon) moon.classList.toggle("hidden", isDark);
  if (sun) sun.classList.toggle("hidden", !isDark);
  if (button) button.setAttribute("aria-pressed", String(isDark));
  if (meta) meta.setAttribute("content", isDark ? "#0b0f19" : "#7c3aed");
}

function applyTheme(isDark, announce = false) {
  document.documentElement.classList.toggle("dark", isDark);
  safeSet("studia:theme", isDark ? "dark" : "light");
  syncThemeUI();

  if (announce) {
    showToast(isDark ? "Uključen je tamni način rada." : "Uključen je svijetli način rada.", "info");
  }
}

function toggleTheme() {
  applyTheme(!document.documentElement.classList.contains("dark"), true);
}

/* =========================================================
   NAVIGACIJA I BOČNI IZBORNIK
   ========================================================= */

function switchTab(tabId, options = {}) {
  const section = $(`#view-${tabId}`);
  if (!section) return;

  state.tab = tabId;
  $$("[id^='view-']").forEach((view) => {
    view.classList.toggle("hidden", view.id !== `view-${tabId}`);
  });

  $$(".nav-btn").forEach((button) => {
    const isActive = button.dataset.tab === tabId;
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("font-semibold", isActive);
    button.classList.toggle("font-medium", !isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  closeSidebar(false);
  toggleProfileDropdown(false);
  closeNotificationPanel();

  if (options.keepScroll !== true) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!options.keepHash) {
    try {
      history.replaceState(null, "", `#${tabId}`);
    } catch (error) {
      // Neke datoteke otvorene preko file:// ne dopuštaju promjenu povijesti.
    }
  }

  if (tabId === "grades" && typeof renderGrades === "function") {
    renderGrades();
    refreshIcons();
  }

  if (tabId === "materials" && typeof renderMaterials === "function") {
    renderMaterials();
    refreshIcons();
  }

  if (tabId === "dashboard") {
    window.requestAnimationFrame(() => {
      if (typeof updateCarouselButtons === "function") updateCarouselButtons();
    });
  }

  if (tabId === "profile") {
    renderMiniCalendar();
    renderNotices();
    refreshIcons();
  }
}

function openSidebar() {
  const sidebar = $("#left-sidebar");
  const backdrop = $("#sidebar-backdrop");
  if (!sidebar) return;

  toggleProfileDropdown(false);
  sidebar.classList.remove("-translate-x-full");
  if (backdrop) backdrop.classList.remove("hidden");
  document.body.classList.add("drawer-open");
  $$("[data-open-sidebar]").forEach((button) => button.setAttribute("aria-expanded", "true"));

  const closeButton = $("[data-close-sidebar]");
  if (closeButton) closeButton.focus();
}

function closeSidebar(restoreFocus = true) {
  const sidebar = $("#left-sidebar");
  const backdrop = $("#sidebar-backdrop");
  if (!sidebar) return;

  const wasOpen = !sidebar.classList.contains("-translate-x-full");
  sidebar.classList.add("-translate-x-full");
  if (backdrop) backdrop.classList.add("hidden");
  document.body.classList.remove("drawer-open");
  $$("[data-open-sidebar]").forEach((button) => button.setAttribute("aria-expanded", "false"));

  if (wasOpen && restoreFocus) {
    const opener = $("[data-open-sidebar]");
    if (opener) opener.focus();
  }
}

function toggleProfileDropdown(force) {
  const dropdown = $("#profile-dropdown");
  const button = $("#profile-menu-btn");
  if (!dropdown) return;

  const shouldOpen = typeof force === "boolean" ? force : dropdown.classList.contains("hidden");
  dropdown.classList.toggle("hidden", !shouldOpen);
  if (button) button.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) closeNotificationPanel();
}

function toggleNotificationPanel(force) {
  const panel = $("#notification-panel");
  const button = $("#notification-btn");
  if (!panel) return;

  const shouldOpen = typeof force === "boolean" ? force : panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !shouldOpen);
  if (button) button.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) toggleProfileDropdown(false);
}

function closeNotificationPanel() {
  const panel = $("#notification-panel");
  const button = $("#notification-btn");
  if (!panel || panel.classList.contains("hidden")) return;
  panel.classList.add("hidden");
  if (button) button.setAttribute("aria-expanded", "false");
}

/* =========================================================
   MODALI
   ========================================================= */

function getOpenModal() {
  return $(".modal:not(.hidden)");
}

function openModal(modalId, focusSelector) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const currentlyOpen = getOpenModal();
  if (currentlyOpen && currentlyOpen !== modal) {
    closeModal(currentlyOpen.id, false);
  }

  state.lastFocusedElement = document.activeElement;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    const focusTarget = focusSelector ? modal.querySelector(focusSelector) : modal.querySelector("[data-close-modal]");
    if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
  }, 60);
}

function closeModal(modalId, restoreFocus = true) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.classList.contains("hidden")) return;

  modal.classList.add("hidden");

  if (!getOpenModal()) {
    document.body.classList.remove("modal-open");
  }

  if (restoreFocus && state.lastFocusedElement && document.contains(state.lastFocusedElement)) {
    state.lastFocusedElement.focus();
  }
  state.lastFocusedElement = null;
}

function closeAnyModal() {
  const modal = getOpenModal();
  if (!modal) return false;
  closeModal(modal.id);
  return true;
}

function trapModalFocus(event) {
  const modal = getOpenModal();
  if (!modal || event.key !== "Tab") return;

  const focusable = $$(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    modal
  ).filter((element) => element.offsetParent !== null);

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* =========================================================
   AKADEMSKI KONTEKST
   ========================================================= */

function persistAcademic() {
  safeSet(STORAGE_KEYS.academic, JSON.stringify(state.academic));
}

function updateAcademicLabels() {
  const program = ACADEMIC_PROGRAMS[state.academic.program] || ACADEMIC_PROGRAMS["fpmoz-rac"];
  const semesterName = state.academic.semester === "zimski" ? "Zimski semestar" : "Ljetni semestar";
  const semesterYear = state.academic.semester === "zimski" ? "2026/27" : "2026/27";

  const sidebarFaculty = $("#sidebar-faculty-label");
  const sidebarYear = $("#sidebar-year-label");
  const headerMeta = $("#header-student-meta");
  const heroSemester = $("#hero-semester-pill");
  const heroYear = $("#hero-year-pill");
  const profileDept = $("#profile-dept-name");
  const profileYear = $("#profile-year-semester");
  const profileDepartment = $("#profile-department-name");

  if (sidebarFaculty) sidebarFaculty.textContent = program.label;
  if (sidebarYear) sidebarYear.textContent = `${state.academic.year}. godina · ${semesterName}`;
  if (headerMeta) headerMeta.textContent = `${state.academic.year}. god · ${program.short}`;
  if (heroSemester) heroSemester.textContent = `${state.academic.semester === "zimski" ? "ZIMSKI" : "LJETNI"} SEMESTAR ${semesterYear}`;
  if (heroYear) heroYear.textContent = `${state.academic.year}. GODINA`;
  if (profileDept) profileDept.textContent = program.label;
  if (profileDepartment) profileDepartment.textContent = program.short;
  if (profileYear) {
    profileYear.textContent = `${state.academic.year}. godina · ${state.academic.semester === "zimski" ? "Zimski" : "Ljetni"} ${semesterYear}`;
  }

  const programSelect = $("#select-smjer");
  const yearSelect = $("#select-godina");
  const semesterSelect = $("#select-semestar");
  if (programSelect) programSelect.value = state.academic.program;
  if (yearSelect) yearSelect.value = state.academic.year;
  if (semesterSelect) semesterSelect.value = state.academic.semester;
}

function handleAcademicChange() {
  const program = $("#select-smjer");
  const year = $("#select-godina");
  const semester = $("#select-semestar");
  if (!program || !year || !semester) return;

  state.academic = {
    program: program.value,
    year: year.value,
    semester: semester.value
  };

  persistAcademic();
  updateAcademicLabels();
  showToast("Akademski kontekst je promijenjen.", "info");
}

/* =========================================================
   MOODLE STATUS
   ========================================================= */

function formatSyncTime(isoValue, mode = state.moodleConfig.lastSyncMode || state.moodleConfig.mode) {
  if (!isoValue) return "Još nije sinkronizirano";
  if (mode === "demo") return `${DEMO_TODAY_LABEL} · 09:00`;

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "Nepoznato vrijeme";
  const day = `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}.`;
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${day} · ${time}`;
}

function applyMoodleState() {
  const sidebarStatus = $("#sidebar-api-status");
  const headerText = $("#header-sync-text");
  const headerDot = $("#header-sync-dot");
  const config = state.moodleConfig;
  const isLive = config.mode === "live";
  const hasSync = Boolean(config.lastSync) && config.lastSyncMode === config.mode;

  state.moodleConnected = isLive && hasSync;

  if (sidebarStatus) {
    sidebarStatus.textContent = isLive
      ? (hasSync ? "● Live · sinkronizirano" : "● Live · čeka sync")
      : "● Demo sinkronizacija";
    sidebarStatus.className = isLive && hasSync
      ? "text-[11px] text-emerald-400 font-bold"
      : "text-[11px] text-emerald-400 font-medium";
  }

  if (headerText) {
    headerText.textContent = isLive
      ? (hasSync ? "Moodle API · Live" : "SUM Moodle API · Live")
      : "SUM Moodle API · Demo";
  }

  if (headerDot) {
    headerDot.className = isLive && hasSync
      ? "w-2 h-2 rounded-full bg-emerald-500 live-dot"
      : "w-2 h-2 rounded-full bg-amber-400";
  }

  if (typeof renderMoodleStatus === "function") renderMoodleStatus();
}

/* =========================================================
   GLOBALNA PRETRAGA
   ========================================================= */

function clearGlobalSearch() {
  const input = $("#global-search-input");
  const panel = $("#search-results-panel");
  const clearButton = $("#clear-search-btn");

  if (input) input.value = "";
  if (panel) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
  if (clearButton) clearButton.classList.add("hidden");
}

function handleGlobalSearch(rawQuery) {
  const panel = $("#search-results-panel");
  const clearButton = $("#clear-search-btn");
  if (!panel) return;

  const query = String(rawQuery || "").trim();

  if (!query) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    if (clearButton) clearButton.classList.add("hidden");
    return;
  }

  if (clearButton) clearButton.classList.remove("hidden");

  const normalized = query.toLowerCase();
  const matchedCourses = COURSES.filter((course) => {
    return [course.name, course.code, course.professor, course.description, course.category]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  }).slice(0, 4);

  const matchedAssignments = state.assignments.filter((assignment) => {
    const course = getCourse(assignment.courseId);
    return [assignment.title, assignment.type, course ? course.name : ""]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  }).slice(0, 4);

  const matchedScripts = state.scripts.filter((script) => {
    return [script.title, script.course, script.author]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  }).slice(0, 4);

  let html = "";

  if (matchedCourses.length > 0) {
    html += `<div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Kolegiji</div>`;
    html += matchedCourses.map((course) => `
      <button type="button" data-search-type="course" data-search-id="${course.id}" class="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex justify-between items-center gap-3 text-xs font-semibold">
        <span class="min-w-0"><span class="block truncate text-slate-800 dark:text-slate-100">${escapeHtml(course.name)}</span><span class="block text-[10px] font-normal text-slate-400 truncate">${escapeHtml(course.professor)}</span></span>
        <span class="text-studia-600 dark:text-studia-400 shrink-0">Otvori →</span>
      </button>
    `).join("");
  }

  if (matchedAssignments.length > 0) {
    html += `<div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mt-2">Zadaće i rokovi</div>`;
    html += matchedAssignments.map((assignment) => {
      const course = getCourse(assignment.courseId);
      return `
        <button type="button" data-search-type="assignment" data-search-id="${assignment.id}" class="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex justify-between items-center gap-3 text-xs font-semibold">
          <span class="min-w-0"><span class="block truncate text-slate-800 dark:text-slate-100">${escapeHtml(assignment.title)}</span><span class="block text-[10px] font-normal text-slate-400 truncate">${escapeHtml(course ? course.name : "")}</span></span>
          <span class="text-amber-600 dark:text-amber-400 shrink-0">${escapeHtml(assignment.deadline)}</span>
        </button>
      `;
    }).join("");
  }

  if (matchedScripts.length > 0) {
    html += `<div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mt-2">Skripte</div>`;
    html += matchedScripts.map((script) => `
      <button type="button" data-search-type="script" data-search-id="${script.id}" class="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex justify-between items-center gap-3 text-xs font-semibold">
        <span class="min-w-0"><span class="block truncate text-slate-800 dark:text-slate-100">${escapeHtml(script.title)}</span><span class="block text-[10px] font-normal text-slate-400 truncate">${escapeHtml(script.course)} · ${escapeHtml(script.author)}</span></span>
        <span class="text-studia-600 dark:text-studia-400 shrink-0">Preuzmi →</span>
      </button>
    `).join("");
  }

  if (!html) {
    html = `<div class="p-4 text-xs text-slate-400 text-center">Nema rezultata za „${escapeHtml(query)}“.</div>`;
  }

  panel.innerHTML = html;
  panel.classList.remove("hidden");
  refreshIcons();
}

function handleSearchResult(type, id) {
  clearGlobalSearch();

  if (type === "course") {
    openCourseModal(id);
    return;
  }

  if (type === "assignment") {
    const assignment = state.assignments.find((item) => item.id === Number(id));
    if (!assignment) return;

    if (assignment.status === "submitted") {
      switchTab("assignments");
      state.assignmentFilter = "submitted";
      renderAssignmentFilters();
      renderAssignments();
      refreshIcons();
      showToast("Ova zadaća je već predana. Prikazane su predane zadaće.", "info");
    } else {
      openAssignmentModal(Number(id));
    }
    return;
  }

  if (type === "script") {
    const script = state.scripts.find((item) => item.id === Number(id));
    switchTab("courses");
    const search = $("#script-search-input");
    if (search && script) {
      search.value = script.title;
      state.scriptsQuery = script.title;
      renderScripts();
      refreshIcons();
    }
    window.setTimeout(() => {
      const section = $("#unihub-section");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      if (search) search.focus({ preventScroll: true });
    }, 100);
  }
}

/* =========================================================
   GOOGLE MEET (demo)
   ========================================================= */

async function joinMeet(courseId) {
  const course = getCourse(courseId);
  if (!course) return;

  if (!course.meetUrl) {
    showToast("Za ovi kolegij nema dostupan Meet link u Moodle podacima.", "info");
    return;
  }

  try {
    await navigator.clipboard.writeText(course.meetUrl);
    showToast(`Demo link za „${course.name}“ kopiran je u međuspremnik.`, "info");
  } catch (error) {
    showToast(`Demo Meet link: ${course.meetUrl}`, "info");
  }
}

/* =========================================================
   UČITAVANJE SPREMLJENIH POSTAVKI
   ========================================================= */

function loadPreferences() {
  const savedAcademic = safeGet(STORAGE_KEYS.academic);
  if (savedAcademic) {
    try {
      const parsed = JSON.parse(savedAcademic);
      if (parsed && ACADEMIC_PROGRAMS[parsed.program]) {
        state.academic = {
          program: parsed.program,
          year: ["1", "2", "3"].includes(String(parsed.year)) ? String(parsed.year) : "2",
          semester: parsed.semester === "ljetni" ? "ljetni" : "zimski"
        };
      }
    } catch (error) {
      // Neispravan zapis ignorira se i koriste se zadane vrijednosti.
    }
  }

  state.moodleConnected = safeGet(STORAGE_KEYS.moodle) === "true";

  const savedFavorites = safeGet(STORAGE_KEYS.favorites);
  if (savedFavorites) {
    try {
      const parsed = JSON.parse(savedFavorites);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.keys(parsed).forEach((key) => {
          const value = parsed[key];
          if (value === true || value === 1 || value === "true" || value === "1") {
            state.favorites[key] = true;
          }
        });
      }
    } catch (error) {
      // Neispravan zapis ignorira se.
    }
  }

  const savedTodos = safeGet(STORAGE_KEYS.planner);
  if (savedTodos) {
    try {
      const parsed = JSON.parse(savedTodos);
      if (Array.isArray(parsed)) {
        state.todos = parsed
          .filter((item) => item && typeof item === "object")
          .slice(0, 200)
          .map((item, index) => ({
            id: typeof item.id === "string" || typeof item.id === "number"
              ? item.id
              : `todo-${Date.now()}-${index}`,
            text: String(item.text || "").slice(0, 300).trim(),
            done: Boolean(item.done),
            deadline: typeof item.deadline === "string" ? item.deadline : ""
          }))
          .filter((item) => item.text);
      }
    } catch (error) {
      // Neispravan zapis ignorira se i planer ostaje prazan.
    }
  }

  const savedMoodleConfig = safeGet(STORAGE_KEYS.moodleConfig);
  if (savedMoodleConfig) {
    try {
      const parsed = JSON.parse(savedMoodleConfig);
      if (parsed && typeof parsed === "object") {
        state.moodleConfig = {
          mode: parsed.mode === "live" ? "live" : "demo",
          proxyUrl: typeof parsed.proxyUrl === "string" ? parsed.proxyUrl : "",
          lastSync: typeof parsed.lastSync === "string" ? parsed.lastSync : null,
          lastSyncMode: parsed.lastSyncMode === "live" ? "live" : parsed.lastSyncMode === "demo" ? "demo" : null,
          lastSummary: parsed.lastSummary && typeof parsed.lastSummary === "object" ? parsed.lastSummary : null
        };
      }
    } catch (error) {
      // Neispravan zapis ignorira se i koristi se demo način.
    }
  }

  const readNotifications = safeGet(STORAGE_KEYS.notificationsRead);
  if (readNotifications) {
    try {
      const readIds = JSON.parse(readNotifications);
      if (Array.isArray(readIds)) {
        state.notifications.forEach((notification) => {
          notification.unread = !readIds.includes(notification.id);
        });
      }
    } catch (error) {
      // Neispravan zapis ignorira se.
    }
  }

  const savedReminders = safeGet(STORAGE_KEYS.reminders);
  if (savedReminders) {
    try {
      const parsed = JSON.parse(savedReminders);
      if (parsed && typeof parsed === "object") {
        ["deadlines", "grades", "materials", "forums"].forEach((key) => {
          if (typeof parsed[key] === "boolean") state.reminderSettings[key] = parsed[key];
        });
        if (["1", "3", "7"].includes(String(parsed.leadDays))) {
          state.reminderSettings.leadDays = String(parsed.leadDays);
        }
      }
    } catch (error) {
      // Neispravan zapis ignorira se.
    }
  }

  const submitted = safeGet(STORAGE_KEYS.submissions);
  if (submitted) {
    try {
      const submittedIds = JSON.parse(submitted);
      if (Array.isArray(submittedIds)) {
        state.assignments.forEach((assignment) => {
          if (submittedIds.includes(assignment.id)) assignment.status = "submitted";
        });
      }
    } catch (error) {
      // Neispravan zapis ignorira se.
    }
  }

  const readMessages = safeGet(STORAGE_KEYS.inboxRead);
  if (readMessages) {
    try {
      const readIds = JSON.parse(readMessages);
      if (Array.isArray(readIds)) {
        state.inbox.forEach((message) => {
          message.unread = !readIds.includes(message.id);
        });
      }
    } catch (error) {
      // Neispravan zapis ignorira se.
    }
  }
}

function persistSubmissions() {
  const submittedIds = state.assignments
    .filter((assignment) => assignment.status === "submitted")
    .map((assignment) => assignment.id);
  safeSet(STORAGE_KEYS.submissions, JSON.stringify(submittedIds));
}

function persistInboxRead() {
  const readIds = state.inbox
    .filter((message) => !message.unread)
    .map((message) => message.id);
  safeSet(STORAGE_KEYS.inboxRead, JSON.stringify(readIds));
}

function persistNotificationRead() {
  const readIds = state.notifications
    .filter((notification) => !notification.unread)
    .map((notification) => notification.id);
  safeSet(STORAGE_KEYS.notificationsRead, JSON.stringify(readIds));
}

function persistReminderSettings() {
  safeSet(STORAGE_KEYS.reminders, JSON.stringify(state.reminderSettings));
}

function persistPlanner() {
  safeSet(STORAGE_KEYS.planner, JSON.stringify(state.todos));
}

function persistFavorites() {
  safeSet(STORAGE_KEYS.favorites, JSON.stringify(state.favorites));
}

function persistMoodleConfig() {
  safeSet(STORAGE_KEYS.moodleConfig, JSON.stringify(state.moodleConfig));
}

function markNotificationRead(notificationId) {
  const notification = getNotification(notificationId);
  if (!notification || !notification.unread) return false;
  notification.unread = false;
  persistNotificationRead();
  return true;
}

function markAllNotificationsRead() {
  const unread = state.notifications.filter((notification) => notification.unread);
  if (unread.length === 0) return 0;
  unread.forEach((notification) => {
    notification.unread = false;
  });
  persistNotificationRead();
  return unread.length;
}
