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
        <button type="button" data-course-fav="${escapeHtml(course.id)}" aria-pressed="${Boolean(state.favorites[course.id])}" aria-label="${state.favorites[course.id] ? "Ukloni iz favorita" : "Dodaj u favorite"}" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 backdrop-blur-xs flex items-center justify-center text-base transition" title="Favorit">${state.favorites[course.id] ? "★" : "☆"}</button>
        <h3 class="font-display font-bold text-lg leading-snug relative z-10 pr-8">${escapeHtml(course.name)}</h3>
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

  const favoriteCount = COURSES.filter((course) => state.favorites[course.id]).length;
  const options = [...COURSE_CATEGORIES, { id: "favorites", label: "Favoriti" }];

  container.innerHTML = options.map((category) => {
    const count = category.id === "all"
      ? COURSES.length
      : category.id === "favorites"
        ? favoriteCount
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
    : state.courseFilter === "favorites"
      ? COURSES.filter((course) => state.favorites[course.id])
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
    MOJ PLANER (osobni zadaci)
   ========================================================= */

function renderPlanner() {
  const list = $("#planner-list");
  if (!list) return;

  const todos = Array.isArray(state.todos) ? state.todos : [];
  const doneCount = todos.filter((todo) => todo.done).length;
  const label = $("#planner-progress-label");
  if (label) label.textContent = `${doneCount} / ${todos.length}`;

  if (todos.length === 0) {
    list.innerHTML = `<li class="py-6 text-center text-sm text-slate-400">Nema zadataka. Dodaj prvi zadatak iznad.</li>`;
    return;
  }

  list.innerHTML = todos.map((todo) => {
    const done = Boolean(todo.done);
    const id = escapeHtml(todo.id);
    return `
      <li class="flex items-start gap-3 p-3.5 rounded-2xl border ${
        done
          ? "border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20"
          : "border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
      }">
        <button type="button" data-todo-toggle="${id}" aria-pressed="${done}" aria-label="${done ? "Označi kao aktivno" : "Označi kao završeno"}" class="w-6 h-6 mt-0.5 shrink-0 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition ${
          done
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-slate-300 dark:border-slate-600 text-transparent hover:border-studia-500"
        }">✓</button>
        <div class="flex-1 min-w-0">
          <span class="block text-sm font-semibold ${done ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}">${escapeHtml(todo.text)}</span>
          ${todo.deadline ? `<span class="block text-[10px] text-slate-400 mt-1">Rok: ${escapeHtml(formatDateISO(todo.deadline))}</span>` : ""}
        </div>
        <button type="button" data-todo-delete="${id}" aria-label="Obriši zadatak" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0">${icon("trash-2", "w-4 h-4")}</button>
      </li>
    `;
  }).join("");

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

/* =========================================================
   OCJENE I ECTS
   ========================================================= */

function gradeBadgeClass(grade) {
  if (grade === 5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400";
  if (grade === 4) return "bg-studia-100 text-studia-700 dark:bg-studia-950/70 dark:text-studia-300";
  if (grade === 3) return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400";
  if (grade === 2) return "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

function renderGradeFilters() {
  const container = $("#grade-filter-pills");
  if (!container) return;

  const options = [
    { id: "all", label: "Svi semestri", count: GRADE_HISTORY.length },
    { id: "1", label: "1. semestar", count: GRADE_HISTORY.filter((grade) => grade.semesterId === "1").length },
    { id: "2", label: "2. semestar", count: GRADE_HISTORY.filter((grade) => grade.semesterId === "2").length }
  ];

  container.innerHTML = options.map((option) => {
    const isActive = state.gradeFilter === option.id;
    return `
      <button type="button" class="filter-pill ${isActive ? "is-active" : ""}" data-grade-filter="${option.id}" aria-pressed="${isActive}">
        <span>${escapeHtml(option.label)}</span>
        <span class="filter-pill__count">${option.count}</span>
      </button>
    `;
  }).join("");
}

function renderGrades() {
  const summary = $("#grades-summary");
  const distribution = $("#grades-distribution");
  const tableBody = $("#grades-table-body");
  const cards = $("#grades-cards");
  const empty = $("#grades-empty");
  const tableWrap = $("#grades-table-wrap");
  if (!summary || !tableBody || !cards) return;

  const average = calculateGradeAverage(GRADE_HISTORY);
  const completedEcts = getCompletedEcts();
  const inProgressEcts = getEctsInProgress();
  const totalEcts = 180;
  const ectsPercent = Math.min(100, Math.round((completedEcts / totalEcts) * 100));
  const topGradeCount = GRADE_HISTORY.filter((grade) => grade.grade === 5).length;

  summary.innerHTML = `
    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
      <span class="w-9 h-9 rounded-xl bg-studia-100 dark:bg-studia-950 text-studia-600 dark:text-studia-400 flex items-center justify-center mb-3">${icon("award", "w-4 h-4")}</span>
      <div class="text-2xl font-display font-extrabold text-slate-900 dark:text-white">${average.toFixed(2)}</div>
      <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Prosjek ocjena</div>
      <div class="text-[10px] text-slate-400 mt-1">Ponderirano po ECTS bodovima</div>
    </div>
    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
      <span class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">${icon("graduation-cap", "w-4 h-4")}</span>
      <div class="text-2xl font-display font-extrabold text-slate-900 dark:text-white">${completedEcts} ECTS</div>
      <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Ostvareno do sada</div>
      <div class="text-[10px] text-slate-400 mt-1">od ${totalEcts} ECTS na studiju</div>
    </div>
    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
      <span class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">${icon("book-open", "w-4 h-4")}</span>
      <div class="text-2xl font-display font-extrabold text-slate-900 dark:text-white">${inProgressEcts} ECTS</div>
      <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Upisano ovaj semestar</div>
      <div class="text-[10px] text-slate-400 mt-1">${COURSES.length} kolegija u tijeku</div>
    </div>
    <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
      <span class="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">${icon("check-circle-2", "w-4 h-4")}</span>
      <div class="text-2xl font-display font-extrabold text-slate-900 dark:text-white">${GRADE_HISTORY.length}</div>
      <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Položenih kolegija</div>
      <div class="text-[10px] text-slate-400 mt-1">${topGradeCount}× ocjena 5</div>
    </div>
  `;

  const ectsBar = $("#grades-ects-bar");
  const ectsText = $("#grades-ects-text");
  if (ectsBar) ectsBar.style.width = `${ectsPercent}%`;
  if (ectsText) ectsText.textContent = `${completedEcts} / ${totalEcts} ECTS · ${ectsPercent}%`;

  if (distribution) {
    const counts = getGradeDistribution(GRADE_HISTORY);
    const maxCount = Math.max(...counts.map((item) => item.count), 1);
    distribution.innerHTML = counts.map((item) => `
      <div class="flex items-center gap-3">
        <span class="w-12 text-xs font-bold ${item.grade >= 2 ? gradeBadgeClass(item.grade) : "text-slate-400"} px-2 py-1 rounded-lg text-center">${item.grade}</span>
        <div class="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div class="h-full rounded-full ${item.grade === 5 ? "bg-emerald-500" : item.grade === 4 ? "bg-studia-500" : item.grade === 3 ? "bg-amber-400" : "bg-rose-400"}" style="width: ${Math.round((item.count / maxCount) * 100)}%"></div>
        </div>
        <span class="w-6 text-right text-xs font-bold text-slate-600 dark:text-slate-300">${item.count}</span>
      </div>
    `).join("");
  }

  renderGradeFilters();

  const filtered = getFilteredGrades();
  if (empty) empty.classList.toggle("hidden", filtered.length > 0);
  if (tableWrap) tableWrap.style.display = filtered.length === 0 ? "none" : "";

  tableBody.innerHTML = filtered.map((grade) => `
    <tr class="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
      <td class="py-3.5 pr-3">
        <span class="block font-bold text-slate-800 dark:text-slate-100">${escapeHtml(grade.name)}</span>
        <span class="block text-[10px] text-slate-400 font-mono">${escapeHtml(grade.code)}</span>
      </td>
      <td class="py-3.5 pr-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">${escapeHtml(grade.semester)}</td>
      <td class="py-3.5 pr-3 text-center font-bold text-slate-700 dark:text-slate-200">${grade.ects}</td>
      <td class="py-3.5 pr-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">${escapeHtml(grade.date)}</td>
      <td class="py-3.5 pr-3 text-slate-500 dark:text-slate-400 hidden xl:table-cell">${escapeHtml(grade.professor)}</td>
      <td class="py-3.5 text-right">
        <span class="inline-flex w-9 h-9 items-center justify-center rounded-xl text-sm font-extrabold ${gradeBadgeClass(grade.grade)}" aria-label="Ocjena ${grade.grade}">${grade.grade}</span>
      </td>
    </tr>
  `).join("");

  cards.innerHTML = filtered.map((grade) => `
    <article class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h4 class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(grade.name)}</h4>
          <p class="text-[10px] font-mono text-slate-400 mt-0.5">${escapeHtml(grade.code)}</p>
        </div>
        <span class="inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-xl text-base font-extrabold ${gradeBadgeClass(grade.grade)}" aria-label="Ocjena ${grade.grade}">${grade.grade}</span>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"><span class="block text-slate-400 text-[10px]">Semestar</span><strong class="text-slate-700 dark:text-slate-200">${escapeHtml(grade.semester)}</strong></div>
        <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"><span class="block text-slate-400 text-[10px]">ECTS</span><strong class="text-slate-700 dark:text-slate-200">${grade.ects}</strong></div>
        <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60"><span class="block text-slate-400 text-[10px]">Datum</span><strong class="text-slate-700 dark:text-slate-200">${escapeHtml(grade.date)}</strong></div>
      </div>
      <p class="text-[10px] text-slate-400 mt-2">${escapeHtml(grade.professor)}</p>
    </article>
  `).join("");

  refreshIcons();
}

/* =========================================================
   MATERIJALI KOLEGIJA
   ========================================================= */

function renderMaterialCoursePills() {
  const container = $("#material-course-pills");
  if (!container) return;

  const options = [{ id: "all", label: "Svi kolegiji" }].concat(
    COURSES.map((course) => ({ id: course.id, label: course.name }))
  );

  container.innerHTML = options.map((option) => {
    const count = option.id === "all"
      ? MATERIALS.length
      : MATERIALS.filter((material) => material.courseId === option.id).length;
    const isActive = state.materialCourse === option.id;
    return `
      <button type="button" class="filter-pill ${isActive ? "is-active" : ""}" data-material-course="${option.id}" aria-pressed="${isActive}">
        <span>${escapeHtml(option.label)}</span>
        <span class="filter-pill__count">${count}</span>
      </button>
    `;
  }).join("");
}

function renderMaterialTypeFilter() {
  const select = $("#material-type-filter");
  if (!select) return;

  const options = [{ id: "all", label: "Svi tipovi" }].concat(
    Object.keys(MATERIAL_TYPES).map((type) => ({
      id: type,
      label: MATERIAL_TYPES[type].label
    }))
  );

  select.innerHTML = options.map((option) => `
    <option value="${option.id}">${escapeHtml(option.label)}</option>
  `).join("");
  select.value = state.materialType;
}

function renderMaterials() {
  const list = $("#materials-list");
  const empty = $("#materials-empty");
  const countLabel = $("#materials-count");
  if (!list) return;

  renderMaterialCoursePills();
  renderMaterialTypeFilter();

  const query = state.materialsQuery.trim().toLowerCase();
  const filtered = MATERIALS.filter((material) => {
    if (state.materialCourse !== "all" && material.courseId !== state.materialCourse) return false;
    if (state.materialType !== "all" && material.type !== state.materialType) return false;
    if (!query) return true;
    const course = getCourse(material.courseId);
    return [material.title, material.section, material.description, course ? course.name : ""]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (countLabel) {
    countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "materijal" : "materijala"}`;
  }
  if (empty) empty.classList.toggle("hidden", filtered.length > 0);

  const grouped = COURSES.map((course) => ({
    course,
    items: filtered.filter((material) => material.courseId === course.id)
  })).filter((group) => group.items.length > 0);

  list.innerHTML = grouped.map((group) => {
    const sections = [];
    group.items.forEach((material) => {
      let section = sections.find((entry) => entry.title === material.section);
      if (!section) {
        section = { title: material.section, items: [] };
        sections.push(section);
      }
      section.items.push(material);
    });

    return `
      <article class="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden">
        <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-2xl bg-gradient-to-br ${group.course.color} text-white flex items-center justify-center shrink-0">${icon("book-open", "w-4 h-4")}</span>
            <div class="min-w-0">
              <h3 class="font-display font-extrabold text-base text-slate-900 dark:text-white truncate">${escapeHtml(group.course.name)}</h3>
              <p class="text-[11px] text-slate-400">${escapeHtml(group.course.code)} · ${escapeHtml(group.course.semester)} · ${group.course.ects} ECTS</p>
            </div>
          </div>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-studia-100 dark:bg-studia-900 text-studia-700 dark:text-studia-300">${group.items.length} materijala</span>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          ${sections.map((section) => `
            <div class="p-5 sm:p-6">
              <h4 class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">${escapeHtml(section.title)}</h4>
              <div class="space-y-2">
                ${section.items.map((material) => {
                  const type = getMaterialType(material.type);
                  const isNew = isMaterialNew(material);
                  const action = material.url
                    ? `<a href="${escapeHtml(material.url)}" target="_blank" rel="noopener" class="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-studia-700 dark:text-studia-300 font-bold text-[11px] border border-slate-200 dark:border-slate-600 hover:bg-studia-50 dark:hover:bg-slate-600 transition">${icon("external-link", "w-3.5 h-3.5")}<span>Otvori</span></a>`
                    : `<button type="button" data-download-material="${material.id}" class="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 text-studia-700 dark:text-studia-300 font-bold text-[11px] border border-slate-200 dark:border-slate-600 hover:bg-studia-50 dark:hover:bg-slate-600 transition">${icon("download", "w-3.5 h-3.5")}<span>Preuzmi</span></button>`;

                  return `
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-transparent hover:border-studia-200 dark:hover:border-studia-800 transition">
                      <span class="w-10 h-10 rounded-xl ${type.color} flex items-center justify-center shrink-0">${icon(type.icon, "w-4 h-4")}</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <h5 class="font-bold text-xs text-slate-900 dark:text-white">${escapeHtml(material.title)}</h5>
                          ${isNew ? `<span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Novo</span>` : ""}
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">${escapeHtml(material.description)}</p>
                        <p class="text-[10px] text-slate-400 mt-1">${escapeHtml(type.label)} · ${escapeHtml(material.size)} · ${escapeHtml(formatDateISO(material.dateISO))}</p>
                      </div>
                      ${action}
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");

  refreshIcons();
}

/* =========================================================
   CENTAR OBAVIJESTI I PODSJETNICI
   ========================================================= */

function renderNotifications() {
  const list = $("#notification-list");
  const badge = $("#notification-badge");
  const button = $("#notification-btn");
  const label = $("#notification-unread-label");
  const readAll = $("#notification-read-all");
  if (!list) return;

  const unread = getNotificationUnreadCount();

  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle("hidden", unread === 0);
  }
  if (button) {
    button.setAttribute("aria-label", unread > 0 ? `Obavijesti, ${unread} nepročitanih` : "Obavijesti");
  }
  if (label) label.textContent = unread > 0 ? `${unread} nepročitanih` : "Sve pročitano";
  if (readAll) {
    readAll.disabled = unread === 0;
    readAll.classList.toggle("opacity-50", unread === 0);
    readAll.classList.toggle("cursor-not-allowed", unread === 0);
  }

  list.innerHTML = state.notifications.map((notification) => {
    const type = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
    const unreadClass = notification.unread
      ? "bg-studia-50/80 dark:bg-studia-950/25"
      : "hover:bg-slate-50 dark:hover:bg-slate-800/50";

    return `
      <button type="button" data-notification-open="${notification.id}" class="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl transition ${unreadClass}">
        <span class="w-9 h-9 rounded-xl ${type.color} flex items-center justify-center shrink-0">${icon(type.icon, "w-4 h-4")}</span>
        <span class="flex-1 min-w-0">
          <span class="flex items-start justify-between gap-2">
            <span class="font-bold text-xs text-slate-900 dark:text-white leading-snug">${escapeHtml(notification.title)}</span>
            ${notification.unread ? `<span class="w-2 h-2 rounded-full bg-studia-500 shrink-0 mt-1" aria-label="Nepročitano"></span>` : ""}
          </span>
          <span class="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">${escapeHtml(notification.text)}</span>
          <span class="block text-[10px] text-slate-400 mt-1">${escapeHtml(notification.time)}</span>
        </span>
      </button>
    `;
  }).join("");

  refreshIcons();
}

function renderReminderSettings() {
  ["deadlines", "grades", "materials", "forums"].forEach((key) => {
    const input = $(`#reminder-${key}`);
    if (input) input.checked = Boolean(state.reminderSettings[key]);
  });

  const leadDays = $("#reminder-lead-days");
  if (leadDays) leadDays.value = state.reminderSettings.leadDays;
}
