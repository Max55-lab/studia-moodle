/* =========================================================
   STUDIA — normalizacija live Moodle podataka
   Proxy vraća sirove Moodle vrijednosti; ovdje se preslikavaju
   u oblik koji već koriste render.js, views.js i charts.js.
   Demo podaci se samo snapshotiraju i vraćaju pri povratku u
   demo način — ne brišu se trajno.
   ========================================================= */

"use strict";

const LiveData = (() => {
  const DEMO = {
    courses: COURSES.map((item) => ({ ...item })),
    grades: GRADE_HISTORY.map((item) => ({ ...item })),
    materials: MATERIALS.map((item) => ({ ...item })),
    assignments: ASSIGNMENTS.map((item) => ({ ...item })),
    notifications: NOTIFICATIONS.map((item) => ({ ...item }))
  };

  const GRADIENTS = [
    "from-purple-600 to-indigo-600",
    "from-blue-600 to-cyan-600",
    "from-pink-600 to-rose-600",
    "from-emerald-600 to-teal-600",
    "from-amber-500 to-orange-600"
  ];

  let lastDataset = null;
  let active = false;

  function replaceContents(target, items) {
    target.splice(0, target.length, ...items);
  }

  function safeText(value, max = 200) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function fromUnixSeconds(value) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    return new Date(seconds * 1000).toISOString();
  }

  function formatDeadline(iso) {
    if (!iso) return "Bez roka";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Bez roka";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}. ${month}. ${date.getFullYear()}. · ${hours}:${minutes}`;
  }

  function buildCourse(raw, index) {
    const id = Number(raw && raw.id);
    if (!id) return null;

    const progress = clamp(safeNumber(raw.completionprogress), 0, 100);
    const completed = safeNumber(raw.completedactivities);
    const total = safeNumber(raw.totalactivities);

    return {
      id: `moodle-${id}`,
      name: safeText(raw.fullname || raw.shortname || `Kolegij ${id}`, 160) || `Kolegij ${id}`,
      code: safeText(raw.shortname || `MOODLE-${id}`, 80) || `MOODLE-${id}`,
      category: "moodle",
      semester: "Moodle",
      ects: 6,
      progress,
      lectures: total > 0 ? `${completed}/${total} aktivnosti` : "—",
      professor: "Nije navedeno u Moodle WS odgovoru",
      professorShort: "—",
      professorEmail: "",
      color: GRADIENTS[index % GRADIENTS.length],
      description: safeText(raw.summary || "Bez opisa iz Moodle kolegija.", 400),
      meetUrl: "",
      room: "—",
      nextClass: "—"
    };
  }

  function numericGrade(raw) {
    const max = safeNumber(raw.rawgrademax, 100) || 100;
    const value = safeNumber(raw.rawgrade);
    if (!value) return 0;
    return clamp(Math.round((value / max) * 5), 1, 5);
  }

  function buildGrade(raw, index) {
    const courseId = Number(raw && raw.courseid);
    const grade = numericGrade(raw || {});

    return {
      id: `moodle-grade-${raw && raw.id ? raw.id : index + 1}`,
      courseId: courseId ? `moodle-${courseId}` : "",
      name: safeText(raw.itemname || "Ocjena", 160) || "Ocjena",
      code: "",
      semesterId: "moodle",
      semester: "Moodle",
      ects: 6,
      grade,
      dateISO: new Date().toISOString().slice(0, 10),
      date: formatDeadline(new Date().toISOString()).split(" · ")[0],
      professor: safeText(raw.coursename || "", 160)
    };
  }

  function materialType(modname) {
    if (modname === "url") return "link";
    if (modname === "page" || modname === "book") return "slides";
    if (modname === "folder" || modname === "file") return "pdf";
    return "pdf";
  }

  function buildMaterial(raw, index) {
    const courseId = Number(raw && raw.courseid);

    return {
      id: Number(raw && raw.id) || index + 1,
      courseId: courseId ? `moodle-${courseId}` : "",
      section: safeText(raw.section || "Moodle", 120) || "Moodle",
      title: safeText(raw.name || "Materijal", 160) || "Materijal",
      type: materialType(raw && raw.modname),
      size: "—",
      dateISO: fromUnixSeconds(raw && raw.added).slice(0, 10),
      description: ""
    };
  }

  function buildAssignment(raw, index) {
    const courseId = Number(raw && raw.courseid);
    const dueISO = fromUnixSeconds(raw && raw.duedate);

    return {
      id: Number(raw && raw.id) || index + 1,
      courseId: courseId ? `moodle-${courseId}` : "",
      type: "DZ",
      title: safeText(raw.name || "Zadaća", 160) || "Zadaća",
      dueISO,
      deadline: formatDeadline(dueISO),
      points: safeNumber(raw && raw.grade),
      status: "active",
      description: safeText(raw.intro || "Bez opisa iz Moodle zadaće.", 400)
    };
  }

  function buildNotifications(assignments, grades) {
    const notifications = [];

    [...assignments]
      .filter((assignment) => assignment.dueISO)
      .sort((first, second) => first.dueISO.localeCompare(second.dueISO))
      .slice(0, 3)
      .forEach((assignment, index) => {
        notifications.push({
          id: `live-asg-${index + 1}`,
          type: "deadline",
          title: `Rok: ${assignment.title}`,
          text: `${assignment.courseId} · ${assignment.deadline}`,
          time: "Iz Moodlea",
          dateISO: assignment.dueISO.slice(0, 10),
          targetTab: "assignments",
          targetId: assignment.id,
          unread: false
        });
      });

    grades.slice(-2).forEach((grade, index) => {
      notifications.push({
        id: `live-grade-${index + 1}`,
        type: "grade",
        title: `Ocjena ${grade.grade} · ${grade.name}`,
        text: "Preuzeto iz Moodle ocjenskih stavki",
        time: "Iz Moodlea",
        dateISO: grade.dateISO,
        targetTab: "grades",
        unread: false
      });
    });

    return notifications;
  }

  function buildDataset(raw) {
    if (!raw || typeof raw !== "object") return null;

    const courseList = Array.isArray(raw.courses) ? raw.courses : [];
    const courses = courseList.map(buildCourse).filter(Boolean);
    if (courses.length === 0) return null;

    const grades = (Array.isArray(raw.grades) ? raw.grades : []).map(buildGrade);
    const materials = (Array.isArray(raw.materials) ? raw.materials : []).map(buildMaterial);
    const assignments = (Array.isArray(raw.assignments) ? raw.assignments : []).map(buildAssignment);

    return {
      courses,
      grades,
      materials,
      assignments,
      notifications: buildNotifications(assignments, grades)
    };
  }

  function apply(dataset) {
    if (!dataset) return false;

    replaceContents(COURSES, dataset.courses);
    replaceContents(GRADE_HISTORY, dataset.grades);
    replaceContents(MATERIALS, dataset.materials);
    replaceContents(ASSIGNMENTS, dataset.assignments);

    state.assignments = dataset.assignments.map((item) => ({ ...item }));
    state.notifications = dataset.notifications.map((item) => ({ ...item }));

    state.courseFilter = "all";
    state.gradeFilter = "all";
    state.materialCourse = "all";
    state.selectedAssignmentId = null;
    state.selectedCourseId = null;

    lastDataset = dataset;
    active = true;
    return true;
  }

  function restore() {
    replaceContents(COURSES, DEMO.courses);
    replaceContents(GRADE_HISTORY, DEMO.grades);
    replaceContents(MATERIALS, DEMO.materials);
    replaceContents(ASSIGNMENTS, DEMO.assignments);

    state.assignments = DEMO.assignments.map((item) => ({ ...item }));
    state.notifications = DEMO.notifications.map((item) => ({ ...item }));

    state.courseFilter = "all";
    state.gradeFilter = "all";
    state.materialCourse = "all";
    state.selectedAssignmentId = null;
    state.selectedCourseId = null;

    active = false;
    return true;
  }

  function applyLast() {
    return lastDataset ? apply(lastDataset) : false;
  }

  return {
    buildDataset,
    apply,
    restore,
    applyLast,
    isActive: () => active,
    hasLast: () => Boolean(lastDataset)
  };
})();
