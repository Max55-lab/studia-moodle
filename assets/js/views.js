/* =========================================================
   STUDIA — raspored, Meet, oglasna ploča i kalendar
   ========================================================= */

"use strict";

/* =========================================================
   RASPORED
   ========================================================= */

function getWeekdayDate(dayNumber) {
  const date = new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate());
  const offset = (DEMO_TODAY.getDay() + 6) % 7; // ponedjeljak je prvi dan tjedna
  date.setDate(date.getDate() - offset + (dayNumber - 1));
  return date;
}

function renderTimetable() {
  const container = $("#timetable-days-container");
  if (!container) return;

  const today = DEMO_TODAY.getDay();

  container.innerHTML = TIMETABLE.map((entry) => {
    const course = getCourse(entry.courseId);
    const isToday = entry.day === today;
    const date = getWeekdayDate(entry.day);
    const dateLabel = `${entry.dayLabel}, ${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}.`;

    return `
      <article class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[28px] shadow-soft border ${isToday ? "border-studia-300 dark:border-studia-700 ring-2 ring-studia-500/10" : "border-slate-100 dark:border-slate-800"} flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-16 py-3 rounded-2xl hero-gradient text-white text-center shrink-0" title="${escapeHtml(dateLabel)}">
            <span class="block text-[9px] font-bold uppercase tracking-widest text-studia-200">${escapeHtml(entry.dayShort)}</span>
            <span class="block font-display font-extrabold text-lg leading-tight">${date.getDate()}</span>
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white">${escapeHtml(entry.course)}</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-studia-50 dark:bg-studia-950 text-studia-600 dark:text-studia-400">${escapeHtml(entry.type)}</span>
              ${isToday ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">Danas</span>` : ""}
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prostorija: <strong class="text-slate-800 dark:text-slate-200">${escapeHtml(entry.room)}</strong></p>
            <p class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(course ? course.professor : "")}</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3 sm:justify-end">
          <span class="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${escapeHtml(entry.time)}</span>
          <button type="button" data-join-meet="${entry.courseId}" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5">
            ${icon("video", "w-3.5 h-3.5")}
            <span>Pridruži se</span>
          </button>
        </div>
      </article>
    `;
  }).join("");

  refreshIcons();
}

/* =========================================================
   GOOGLE MEET SOBE
   ========================================================= */

function renderMeetRooms() {
  const container = $("#meet-rooms-grid");
  if (!container) return;

  container.innerHTML = COURSES.map((course, index) => {
    const isLive = index < 2;
    const timetableEntry = TIMETABLE.find((entry) => entry.courseId === course.id);
    const statusClass = isLive
      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";

    return `
      <article class="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-soft border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-4">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusClass}">● ${isLive ? "Aktivno uživo" : "Zakazano"}</span>
            <span class="text-xs text-slate-400 font-mono">SUM Meet</span>
          </div>
          <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white">${escapeHtml(course.name)}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${escapeHtml(course.professor)}</p>
          <p class="text-[11px] text-slate-400 mt-2">${escapeHtml(timetableEntry ? timetableEntry.dayLabel : "")} · ${escapeHtml(course.nextClass)} · ${escapeHtml(course.room)}</p>
        </div>
        <button type="button" data-join-meet="${course.id}" class="w-full py-3 rounded-xl hero-gradient text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2">
          ${icon("video", "w-4 h-4")}
          <span>Pridruži se sobi</span>
        </button>
      </article>
    `;
  }).join("");

  refreshIcons();
}

/* =========================================================
   OGLASNA PLOČA
   ========================================================= */

function renderNotices() {
  const container = $("#notice-list");
  if (!container) return;

  const noticeDate = $("#notice-date");
  if (noticeDate) noticeDate.textContent = DEMO_TODAY_LABEL;

  const tagStyles = {
    Ispit: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
    Projekt: "bg-studia-100 dark:bg-studia-900 text-studia-700 dark:text-studia-300",
    Stipendija: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
  };

  container.innerHTML = NOTICES.map((notice) => `
    <button type="button" data-notice-id="${notice.id}" class="w-full p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-studia-300 dark:hover:border-studia-700 transition text-left">
      <span class="flex items-center justify-between gap-2 mb-1">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[notice.tag] || tagStyles.Projekt}">${escapeHtml(notice.tag)}</span>
        <span class="text-[10px] text-slate-400">${escapeHtml(notice.date)}</span>
      </span>
      <span class="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">${escapeHtml(notice.title)}</span>
    </button>
  `).join("");

  refreshIcons();
}

/* =========================================================
   MINI KALENDAR (studeni 2026.)
   ========================================================= */

function renderMiniCalendar() {
  const grid = $("#mini-calendar-grid");
  const title = $("#mini-calendar-title");
  if (!grid) return;

  const year = DEMO_TODAY.getFullYear();
  const month = DEMO_TODAY.getMonth();
  const monthName = CROATIAN_MONTHS[month];

  if (title) title.textContent = `${monthName} ${year}.`;

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // ponedjeljak je prvi dan
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const deadlinesByDay = {};
  state.assignments.forEach((assignment) => {
    const due = new Date(assignment.dueISO);
    if (due.getFullYear() === year && due.getMonth() === month) {
      const day = due.getDate();
      if (!deadlinesByDay[day]) deadlinesByDay[day] = [];
      deadlinesByDay[day].push(assignment);
    }
  });

  let html = "";

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;

    if (!isCurrentMonth) {
      const displayNumber = dayNumber < 1
        ? daysInPreviousMonth + dayNumber
        : dayNumber - daysInMonth;
      html += `<span class="mini-day is-muted" aria-hidden="true">${displayNumber}</span>`;
      continue;
    }

    const isToday = dayNumber === DEMO_TODAY.getDate();
    const deadlines = deadlinesByDay[dayNumber] || [];
    const hasDeadline = deadlines.length > 0;
    const classes = [
      "mini-day",
      isToday ? "is-today" : "",
      hasDeadline ? "has-deadline" : ""
    ].filter(Boolean).join(" ");

    const label = `${dayNumber}. ${String(month + 1).padStart(2, "0")}. ${year}.`;
    const titleText = hasDeadline
      ? `${label} — ${deadlines.map((assignment) => assignment.title).join(", ")}`
      : label;

    html += `
      <button type="button" class="${classes}" data-calendar-day="${dayNumber}" title="${escapeHtml(titleText)}" aria-label="${escapeHtml(titleText)}">
        <span>${dayNumber}</span>
        ${hasDeadline ? `<span class="mini-day__dot" aria-hidden="true"></span>` : ""}
      </button>
    `;
  }

  grid.innerHTML = html;
}

function showCalendarDay(dayNumber) {
  const year = DEMO_TODAY.getFullYear();
  const month = DEMO_TODAY.getMonth();
  const matches = state.assignments.filter((assignment) => {
    const due = new Date(assignment.dueISO);
    return due.getFullYear() === year && due.getMonth() === month && due.getDate() === dayNumber;
  });

  const dateLabel = `${dayNumber}. ${String(month + 1).padStart(2, "0")}. ${year}.`;

  if (matches.length === 0) {
    showToast(`Nema rokova za ${dateLabel}.`, "info");
    return;
  }

  const titles = matches.map((assignment) => assignment.title).join("; ");
  showToast(`${dateLabel}: ${titles}`, "info");
}

/* =========================================================
   POMOĆNE LISTE I INICIJALIZACIJA PRIKAZA
   ========================================================= */

function populateUploadCourses() {
  const select = $("#upload-course");
  if (!select || select.options.length > 0) return;

  select.innerHTML = COURSES.map((course) => `
    <option value="${course.id}">${escapeHtml(course.name)}</option>
  `).join("");
}

function renderAll() {
  renderCoursePills();
  renderCourses();
  renderFullCourses();
  renderQuickTasks();
  renderUpcomingTable();
  renderProfessors();
  renderStats();
  renderAssignmentFilters();
  renderAssignments();
  renderInbox();
  renderScripts();
  renderTimetable();
  renderMeetRooms();
  renderNotices();
  renderMiniCalendar();
  populateUploadCourses();
  refreshIcons();
}
