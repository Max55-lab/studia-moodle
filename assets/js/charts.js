/* =========================================================
   STUDIA — vizualizacije podataka
   Grafikoni se grade iz podataka koji se već prikazuju u
   portalu. Koriste inline SVG i CSS te ne zahtijevaju vanjske
   biblioteke ni mrežne zahtjeve.
   ========================================================= */

"use strict";

function renderGradeTrendChart(container) {
  const entries = [...GRADE_HISTORY].sort((first, second) =>
    String(first.dateISO).localeCompare(String(second.dateISO))
  );

  if (entries.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center">Nema položenih kolegija za prikaz.</p>`;
    return;
  }

  const width = 320;
  const height = 190;
  const pad = { top: 14, right: 12, bottom: 30, left: 32 };
  let weighted = 0;
  let credits = 0;

  const points = entries.map((entry) => {
    const ects = Number(entry.ects) || 1;
    weighted += (Number(entry.grade) || 0) * ects;
    credits += ects;
    const value = weighted / credits;
    return {
      value,
      title: `${entry.name} — kumulativni prosjek ${value.toFixed(2)}`
    };
  });

  const minValue = 2;
  const maxValue = 5;
  const xAt = (index) =>
    pad.left + (index * (width - pad.left - pad.right)) / Math.max(1, points.length - 1);
  const yAt = (value) => {
    const clamped = Math.min(maxValue, Math.max(minValue, value));
    return pad.top + (1 - (clamped - minValue) / (maxValue - minValue)) * (height - pad.top - pad.bottom);
  };

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)} ${yAt(point.value).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(1)} ${height - pad.bottom} L${xAt(0).toFixed(1)} ${height - pad.bottom} Z`;

  const gridLines = [5, 4, 3, 2].map((value) => `
    <line x1="${pad.left}" x2="${width - pad.right}" y1="${yAt(value)}" y2="${yAt(value)}" class="stroke-studia-100 dark:stroke-slate-800" stroke-width="1" />
    <text x="${pad.left - 6}" y="${yAt(value) + 3}" text-anchor="end" fill="#94a3b8" font-size="9">${value}</text>
  `).join("");

  const dots = points.map((point, index) => `
    <circle cx="${xAt(index).toFixed(1)}" cy="${yAt(point.value).toFixed(1)}" r="3.2" fill="#7c3aed" stroke="#ffffff" stroke-width="1.4">
      <title>${escapeHtml(point.title)}</title>
    </circle>
  `).join("");

  const tickIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1]
    .filter((value, index, array) => array.indexOf(value) === index);
  const ticks = tickIndexes.map((index) => `
    <text x="${xAt(index).toFixed(1)}" y="${height - 10}" text-anchor="middle" fill="#94a3b8" font-size="9">${index + 1}.</text>
  `).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" role="img" aria-label="Grafikon kretanja kumulativnog prosjeka ocjena kroz položene kolegije">
      <defs>
        <linearGradient id="studia-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#studia-trend-fill)" />
      <path d="${linePath}" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${ticks}
    </svg>
    <p class="text-[10px] text-slate-400 mt-2">Kronološki kroz ${points.length} položenih kolegija</p>
  `;
}

function gradeChartColor(grade) {
  if (grade === 5) return "#10b981";
  if (grade === 4) return "#7c3aed";
  if (grade === 3) return "#f59e0b";
  if (grade === 2) return "#f43f5e";
  return "#94a3b8";
}

function renderGradeDonutChart(container) {
  const counts = getGradeDistribution(GRADE_HISTORY);
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center">Nema ocjena za prikaz.</p>`;
    return;
  }

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = counts.filter((item) => item.count > 0).map((item) => {
    const fraction = item.count / total;
    const dash = Math.max(0, fraction * circumference - 2);
    const segment = `
      <circle cx="80" cy="80" r="${radius}" fill="none" stroke="${gradeChartColor(item.grade)}" stroke-width="16"
        stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 80 80)">
        <title>Ocjena ${item.grade}: ${item.count} ${item.count === 1 ? "kolegij" : "kolegija"}</title>
      </circle>
    `;
    offset += fraction * circumference;
    return segment;
  }).join("");

  const legend = counts.map((item) => `
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background: ${gradeChartColor(item.grade)}" aria-hidden="true"></span>
      <span class="text-[11px] text-slate-500 dark:text-slate-400">Ocjena ${item.grade}</span>
      <span class="ml-auto text-[11px] font-bold text-slate-700 dark:text-slate-200">${item.count}</span>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="flex items-center gap-4">
      <svg viewBox="0 0 160 160" class="w-32 h-32 shrink-0" role="img" aria-label="Distribucija ocjena po kolegijima">
        <circle cx="80" cy="80" r="${radius}" fill="none" class="stroke-studia-100 dark:stroke-slate-800" stroke-width="16" />
        ${segments}
        <text x="80" y="76" text-anchor="middle" fill="#7c3aed" font-size="24" font-weight="800">${total}</text>
        <text x="80" y="93" text-anchor="middle" fill="#94a3b8" font-size="9">kolegija</text>
      </svg>
      <div class="flex-1 min-w-0 space-y-2">${legend}</div>
    </div>
  `;
}

function renderCourseProgressChart(container) {
  const courses = [...COURSES].sort((first, second) => second.progress - first.progress);

  container.innerHTML = `
    <div class="space-y-3">
      ${courses.map((course) => {
        const progress = Math.max(0, Math.min(100, Number(course.progress) || 0));
        const barColor = progress >= 75 ? "bg-emerald-500" : progress >= 50 ? "bg-studia-500" : "bg-amber-400";
        return `
          <div>
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">${escapeHtml(course.name)}</span>
              <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0">${progress}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div class="${barColor} h-full rounded-full transition-all" style="width: ${progress}%" title="${escapeHtml(course.name)}: ${progress}%"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
    <p class="text-[10px] text-slate-400 mt-3">Completion prikazan u Moodle stilu</p>
  `;
}

function renderCharts() {
  const trend = document.getElementById("chart-grade-trend");
  if (trend) renderGradeTrendChart(trend);

  const donut = document.getElementById("chart-grade-donut");
  if (donut) renderGradeDonutChart(donut);

  const progress = document.getElementById("chart-course-progress");
  if (progress) renderCourseProgressChart(progress);
}
