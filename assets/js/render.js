/* =========================================================
   STUDIA — renderiranje glavnih pogleda
   Kolegiji, zadaće, inbox, UniHub i statistika.
   ========================================================= */

"use strict";

/* =========================================================
   KOLEGIJI
   ========================================================= */

function courseCardMarkup(course, mode = "carousel") {
  const isFull = mode === "full";
  const cardClass = isFull
    ? "group bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft hover:shadow-card cursor-pointer transition flex flex-col h-full"
    : "course-card group snap-start bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft hover:shadow-card cursor-pointer transition flex flex-col";

  return `
    <article class="${cardClass}" data-course-open="${course.id}" role="button" tabindex="0" aria-label="Otvori kolegij ${escapeHtml(course.name)}">
      <div class="h-32 bg-gradient-to-br ${course.color} p-5 flex flex-col justify-between text-white relative overflow-hidden">
        <div class="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl" aria-hidden="true"></div>
        <span class="text-[11px] font-bold uppercase tracking-wider bg-white/25 px-2.5 py-1 rounded-lg w-max backdrop-blur-xs relative z-10">${escapeHtml(course.code)}</span>
        <h3 class="font-display font-bold text-lg leading-snug relative z-10">${escapeHtml(course.name)}</h3>
      </div>
      <div class="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${escapeHtml(course.professor)}</p>
          ${isFull ? `<p class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">${escapeHtml(course.description)}</p>` : ""}
          <div class="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-4 mb-1.5">
            <span>Napredak gradiva</span>
            <span class="text-studia-600 dark:text-studia-400">${course.progress}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div class="bg-studia-600 h-full rounded-full" style="width: ${course.progress}%"></div>
          </div>
        </div>
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] font-bold text-studia-600 dark:text-studia-400">
          <span class="text-slate-400 dark:text-slate-500 font-medium">${escapeHtml(course.lectures)}</span>
          <span class="inline-flex items-center gap-1">Detalji ${icon("arrow-right", "w-3.5 h-3.5 group-hover:translate-x-1 transition-transform")}</span>
        </div>
      </div>
    </article>
  `;
}

function renderCoursePills() {
  const container = $("#course-filter-pills");
  if (!container) return;

  container.innerHTML = COURSE_CATEGORIES.map((category) => {
    const count = category.id === "all"
      ? COURSES.length
      : COURSES.filter((course) => course.category === category.id).length;
    const isActive = state.courseFilter === category.id;

    return `
      <button type="button" class="filter-pill ${isActive ? "is-active" : ""}" data-course-filter="${category.id}" aria-pressed="${isActive}">
        <span>${escapeHtml(category.label)}</span>
        <span class="filter-pill__count">${count}</span>
      </button>
    `;
  }).join("");
}

function renderCourses() {
  const carousel = $("#courses-carousel");
  const empty = $("#courses-empty");
  if (!carousel) return;

  const filtered = state.courseFilter === "all"
    ? COURSES
    : COURSES.filter((course) => course.category === state.courseFilter);

  carousel.innerHTML = filtered.map((course) => courseCardMarkup(course)).join("");
  carousel.scrollLeft = 0;

  if (empty) empty.classList.toggle("hidden", filtered.length > 0);
  updateCarouselButtons();
  refreshIcons();
}

function renderFullCourses() {
  const grid = $("#full-courses-grid");
  if (!grid) return;

  grid.innerHTML = COURSES.map((course) => courseCardMarkup(course, "full")).join("");
  refreshIcons();
}

function updateCarouselButtons() {
  const carousel = $("#courses-carousel");
  const previous = $("#courses-prev");
  const next = $("#courses-next");
  if (!carousel || !previous || !next) return;

  const maxScroll = carousel.scrollWidth - carousel.clientWidth;
  previous.disabled = carousel.scrollLeft <= 2;
  next.disabled = carousel.scrollLeft >= maxScroll - 2;
}

function scrollCourses(direction) {
  const carousel = $("#courses-carousel");
  if (!carousel) return;

  const firstCard = carousel.querySelector(".course-card");
  const gap = 20;
  const step = firstCard ? firstCard.getBoundingClientRect().width + gap : carousel.clientWidth * 0.8;

  carousel.scrollBy({ left: direction * step, behavior: "smooth" });
}

/* =========================================================
   BRZE ZADAĆE NA NADZORNOJ PLOČI
   ========================================================= */

function renderQuickTasks() {
  const grid = $("#quick-tasks-grid");
  if (!grid) return;

  const tasks = sortByDeadline(
    state.assignments.filter((assignment) => isUpcoming(assignment) && assignment.status !== "submitted"),
    1
  ).slice(0, 3);

  if (tasks.length === 0) {
    grid.innerHTML = `<p class="md:col-span-3 text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Nema aktivnih zadaća. Odličan posao!</p>`;
    return;
  }

  grid.innerHTML = tasks.map((assignment) => {
    const course = getCourse(assignment.courseId);
    const status = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.active;

    return `
      <button type="button" data-assignment-open="${assignment.id}" class="text-left bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft hover:border-studia-400 transition group">
        <span class="flex justify-between items-start gap-2 mb-3">
          <span class="text-xs font-bold text-studia-600 dark:text-studia-400 bg-studia-50 dark:bg-studia-950 px-2.5 py-1 rounded-lg">${escapeHtml(course ? course.name : "")}</span>
          <span class="w-2.5 h-2.5 rounded-full shrink-0 ${status.dot}" aria-hidden="true"></span>
        </span>
        <span class="block font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-studia-600 dark:group-hover:text-studia-400 transition">${escapeHtml(assignment.title)}</span>
        <span class="block text-[11px] text-slate-400">Rok: ${escapeHtml(assignment.deadline)}</span>
        <span class="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-studia-600 dark:text-studia-400">Predaj rad ${icon("arrow-right", "w-3.5 h-3.5")}</span>
      </button>
    `;
  }).join("");

  refreshIcons();
}

/* =========================================================
   TABLICA NADOLAZEĆIH OBVEZA
   ========================================================= */

function renderUpcomingTable() {
  const tableBody = $("#upcoming-table-body");
  const cardsContainer = $("#upcoming-cards");
  if (!tableBody) return;

  const upcoming = sortByDeadline(state.assignments.filter(isUpcoming), 1);
  const badge = $("#upcoming-count-badge");
  if (badge) badge.textContent = String(upcoming.length);

  if (upcoming.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Nema nadolazećih obveza.</td></tr>`;
    if (cardsContainer) {
      cardsContainer.innerHTML = `<p class="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Nema nadolazećih obveza.</p>`;
    }
    return;
  }

  tableBody.innerHTML = upcoming.map((assignment) => {
    const course = getCourse(assignment.courseId);
    const status = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.active;
    const dueDate = new Date(assignment.dueISO);
    const daysLeft = Math.ceil((dueDate.getTime() - DEMO_TODAY.getTime()) / 86400000);
    const deadlineClass = assignment.status !== "submitted" && daysLeft <= 3
      ? "text-amber-600 dark:text-amber-400 font-semibold"
      : "text-slate-600 dark:text-slate-300 font-medium";

    const action = assignment.status === "submitted"
      ? `<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold ${status.badge}">${icon("check", "w-3 h-3")} ${status.label}</span>`
      : `<button type="button" data-assignment-open="${assignment.id}" class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold ${status.badge} hover:brightness-95 transition" aria-label="Otvori predaju: ${escapeHtml(assignment.title)}">${status.label} ${icon("arrow-right", "w-3 h-3")}</button>`;

    return `
      <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
        <td class="py-3.5 pr-4">
          <span class="block font-bold text-slate-900 dark:text-white">${escapeHtml(course ? course.name : "")}</span>
          <span class="block text-[11px] text-slate-400">${escapeHtml(course ? course.professorShort : "")}</span>
        </td>
        <td class="py-3.5 px-4"><span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-studia-50 dark:bg-studia-950 text-studia-700 dark:text-studia-300">${escapeHtml(assignment.type)}</span></td>
        <td class="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">${escapeHtml(assignment.title)}</td>
        <td class="py-3.5 px-4 text-xs ${deadlineClass}">${escapeHtml(assignment.deadline)}</td>
        <td class="py-3.5 pl-4 text-right">${action}</td>
      </tr>
    `;
  }).join("");

  if (cardsContainer) {
    cardsContainer.innerHTML = upcoming.map((assignment) => {
      const course = getCourse(assignment.courseId);
      const status = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.active;
      const isSubmitted = assignment.status === "submitted";

      return `
        <article class="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-bold text-studia-600 dark:text-studia-400 bg-studia-50 dark:bg-studia-950 px-2 py-0.5 rounded-md">${escapeHtml(course ? course.name : "")}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${status.badge}">${status.label}</span>
          </div>
          <h3 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(assignment.title)}</h3>
          <div class="flex items-center justify-between gap-3 mt-3">
            <span class="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">${icon("calendar", "w-3 h-3 text-studia-500")} ${escapeHtml(assignment.deadline)}</span>
            ${isSubmitted
              ? `<span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 shrink-0">${icon("check-circle-2", "w-3.5 h-3.5")} Predano</span>`
              : `<button type="button" data-assignment-open="${assignment.id}" class="text-[11px] font-bold text-studia-600 dark:text-studia-400 inline-flex items-center gap-1 shrink-0">Predaj ${icon("arrow-right", "w-3 h-3")}</button>`}
          </div>
        </article>
      `;
    }).join("");
  }

  refreshIcons();
}

/* =========================================================
   PROFESORI I STATISTIKA
   ========================================================= */

function renderProfessors() {
  const container = $("#professors-list");
  if (!container) return;

  container.innerHTML = COURSES.map((course) => {
    const initials = getInitials(course.professor);

    return `
      <div class="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <span class="flex items-center gap-3 min-w-0">
          <span class="w-10 h-10 rounded-xl hero-gradient text-white flex items-center justify-center font-bold text-xs shrink-0" aria-hidden="true">${initials}</span>
          <span class="min-w-0">
            <span class="block font-bold text-xs text-slate-900 dark:text-white truncate">${escapeHtml(course.professor)}</span>
            <span class="block text-[11px] text-slate-500 truncate">${escapeHtml(course.name)}</span>
          </span>
        </span>
        <button type="button" data-professor-message="${course.id}" class="p-2 rounded-xl bg-white dark:bg-slate-700 text-studia-600 dark:text-studia-400 hover:bg-studia-50 dark:hover:bg-slate-600 shadow-xs transition shrink-0" aria-label="Pošalji poruku profesoru ${escapeHtml(course.professor)}">
          ${icon("mail", "w-4 h-4")}
        </button>
      </div>
    `;
  }).join("");

  refreshIcons();
}

function renderStats() {
  const average = Math.round(
    COURSES.reduce((sum, course) => sum + course.progress, 0) / COURSES.length
  );
  const circle = $("#semester-progress-circle");
  const percentText = $("#semester-percent-text");
  const circumference = 2 * Math.PI * 50;

  if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = String(circumference * (1 - average / 100));
    const svg = circle.closest("svg");
    if (svg) svg.setAttribute("aria-label", `${average} posto semestra je odrađeno`);
  }
  if (percentText) percentText.textContent = `${average}%`;

  const submitted = getSubmittedCount();
  const total = state.assignments.length;
  const submittedPercent = Math.round((submitted / total) * 100);

  const statsLabel = $("#stats-submitted-label");
  const statsBar = $("#stats-submitted-bar");
  const profileLabel = $("#profile-submitted-label");
  const profileBar = $("#profile-submitted-bar");

  if (statsLabel) statsLabel.textContent = `${submitted}/${total}`;
  if (statsBar) statsBar.style.width = `${submittedPercent}%`;
  if (profileLabel) profileLabel.textContent = `${submitted}/${total}`;
  if (profileBar) profileBar.style.width = `${submittedPercent}%`;

  const navBadge = $("#assignments-nav-badge");
  if (navBadge) {
    const activeCount = getActiveUpcomingCount();
    navBadge.textContent = String(activeCount);
    navBadge.classList.toggle("hidden", activeCount === 0);
  }
}

/* =========================================================
   ZADAĆE
   ========================================================= */

function renderAssignmentFilters() {
  const container = $("#assignment-filter-pills");
  if (!container) return;

  const filters = [
    { id: "all", label: "Sve", count: state.assignments.length },
    { id: "active", label: "U tijeku", count: state.assignments.filter((assignment) => assignment.status === "active").length },
    { id: "notStarted", label: "Nije započeto", count: state.assignments.filter((assignment) => assignment.status === "notStarted").length },
    { id: "submitted", label: "Predano", count: getSubmittedCount() }
  ];

  container.innerHTML = filters.map((filter) => {
    const isActive = state.assignmentFilter === filter.id;
    return `
      <button type="button" class="filter-pill ${isActive ? "is-active" : ""}" data-assignment-filter="${filter.id}" aria-pressed="${isActive}">
        <span>${filter.label}</span>
        <span class="filter-pill__count">${filter.count}</span>
      </button>
    `;
  }).join("");
}

function sortAssignmentsForList(list) {
  const upcoming = sortByDeadline(list.filter(isUpcoming), 1);
  const past = sortByDeadline(list.filter((assignment) => !isUpcoming(assignment)), -1);
  return [...upcoming, ...past];
}

function renderAssignments() {
  const container = $("#full-assignments-list");
  const empty = $("#assignments-empty");
  if (!container) return;

  const filtered = state.assignmentFilter === "all"
    ? state.assignments
    : state.assignments.filter((assignment) => assignment.status === state.assignmentFilter);

  const sorted = sortAssignmentsForList(filtered);

  if (empty) empty.classList.toggle("hidden", sorted.length > 0);

  container.innerHTML = sorted.map((assignment) => {
    const course = getCourse(assignment.courseId);
    const status = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.active;
    const isSubmitted = assignment.status === "submitted";

    return `
      <article class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[28px] shadow-soft border ${isSubmitted ? "border-emerald-200/80 dark:border-emerald-900/60" : "border-slate-100 dark:border-slate-800"}">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-[11px] font-bold text-studia-600 dark:text-studia-400 bg-studia-50 dark:bg-studia-950 px-2.5 py-0.5 rounded-md">${escapeHtml(course ? course.name : "")}</span>
              <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">${escapeHtml(assignment.type)}</span>
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${status.badge}">${status.label}</span>
            </div>
            <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white">${escapeHtml(assignment.title)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${escapeHtml(assignment.description)}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span class="inline-flex items-center gap-1.5">${icon("calendar", "w-3.5 h-3.5 text-studia-500")} ${escapeHtml(assignment.deadline)}</span>
              <span class="inline-flex items-center gap-1.5">${icon("award", "w-3.5 h-3.5 text-amber-500")} ${assignment.points} bodova</span>
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-3">
            ${isSubmitted
              ? `<span class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">${icon("check-circle-2", "w-4 h-4")} Predano</span>`
              : `<button type="button" data-assignment-open="${assignment.id}" class="px-5 py-2.5 rounded-xl hero-gradient text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2">Predaj rad ${icon("arrow-right", "w-3.5 h-3.5")}</button>`
            }
          </div>
        </div>
      </article>
    `;
  }).join("");

  refreshIcons();
}

function refreshAssignmentViews() {
  renderQuickTasks();
  renderUpcomingTable();
  renderAssignmentFilters();
  renderAssignments();
  renderStats();
  refreshIcons();
}

/* =========================================================
   INBOX
   ========================================================= */

function renderInbox() {
  const container = $("#inbox-messages-list");
  if (!container) return;

  const unread = getUnreadCount();
  const badge = $("#inbox-badge");
  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle("hidden", unread === 0);
  }

  const markAllButton = $("#mark-all-read");
  if (markAllButton) {
    markAllButton.disabled = unread === 0;
    markAllButton.classList.toggle("opacity-50", unread === 0);
    markAllButton.classList.toggle("cursor-not-allowed", unread === 0);
  }

  container.innerHTML = state.inbox.map((message) => {
    const unreadClass = message.unread
      ? "border-studia-300 dark:border-studia-700 bg-studia-50/20"
      : "border-slate-100 dark:border-slate-800";
    const avatarClass = message.unread
      ? "hero-gradient text-white"
      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300";

    return `
      <button type="button" data-message-open="${message.id}" class="w-full text-left bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-soft border ${unreadClass} flex items-start gap-4 hover:border-studia-300 dark:hover:border-studia-700 transition">
        <span class="w-10 h-10 rounded-2xl ${avatarClass} flex items-center justify-center font-bold shrink-0" aria-hidden="true">${escapeHtml(getInitials(message.sender))}</span>
        <span class="flex-1 min-w-0">
          <span class="flex justify-between items-center gap-3 mb-1">
            <span class="font-bold text-sm text-slate-900 dark:text-white truncate">${escapeHtml(message.sender)}</span>
            <span class="text-[11px] text-slate-400 shrink-0">${escapeHtml(message.time)}</span>
          </span>
          <span class="block text-[11px] font-semibold text-studia-600 dark:text-studia-400 mb-1">${escapeHtml(message.subject)}</span>
          <span class="block text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">${escapeHtml(message.preview)}</span>
        </span>
        ${message.unread ? `<span class="w-2 h-2 rounded-full bg-studia-500 shrink-0 mt-1.5" aria-label="Nepročitano"></span>` : ""}
      </button>
    `;
  }).join("");

  refreshIcons();
}

/* =========================================================
   UNIHUB SKRIPTE
   ========================================================= */

function renderScripts() {
  const grid = $("#unihub-scripts-grid");
  const empty = $("#scripts-empty");
  if (!grid) return;

  const query = state.scriptsQuery.trim().toLowerCase();
  const filtered = state.scripts.filter((script) => {
    if (!query) return true;
    return [script.title, script.course, script.author, script.description]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (empty) empty.classList.toggle("hidden", filtered.length > 0);

  grid.innerHTML = filtered.map((script) => {
    const rating = Math.max(0, Math.min(5, Number(script.rating) || 0));
    const stars = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;

    return `
      <article class="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start gap-2 mb-2">
            <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-studia-100 dark:bg-studia-900 text-studia-700 dark:text-studia-300">${escapeHtml(script.course)}</span>
            <span class="text-xs text-amber-500 tracking-tight" aria-label="Ocjena ${rating} od 5">${stars}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 dark:text-white leading-snug">${escapeHtml(script.title)}</h4>
          <p class="text-[11px] text-slate-400 mt-1">Autor: ${escapeHtml(script.author)} · ${script.downloads} preuzimanja · ${script.pages} str.</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">${escapeHtml(script.description)}</p>
        </div>
        <button type="button" data-download-script="${script.id}" class="w-full py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-studia-50 dark:hover:bg-slate-600 text-studia-700 dark:text-studia-300 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5">
          ${icon("download", "w-3.5 h-3.5")}
          <span>Preuzmi materijal</span>
        </button>
      </article>
    `;
  }).join("");

  refreshIcons();
}
