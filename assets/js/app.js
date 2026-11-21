/* =========================================================
   STUDIA — interakcije
   Modali, predaja zadaća, skripte, AI asistent, kalendar
   i povezivanje svih događaja.
   ========================================================= */

"use strict";

/* =========================================================
   ZADAĆE — MODAL I PREDAJA
   ========================================================= */

function openAssignmentModal(assignmentId) {
  const assignment = state.assignments.find((item) => item.id === Number(assignmentId));
  if (!assignment) return;

  if (assignment.status === "submitted") {
    showToast("Ova zadaća je već predana.", "info");
    return;
  }

  const course = getCourse(assignment.courseId);
  state.selectedAssignmentId = assignment.id;

  const courseLabel = $("#modal-asg-course");
  const title = $("#assignment-title");
  const description = $("#modal-asg-description");
  const deadline = $("#modal-asg-deadline");
  const points = $("#modal-asg-points");
  const fileInput = $("#assignment-file");
  const fileName = $("#assignment-file-name");
  const comment = $("#assignment-comment");

  if (courseLabel) courseLabel.textContent = course ? course.name : "";
  if (title) title.textContent = assignment.title;
  if (description) description.textContent = assignment.description;
  if (deadline) deadline.textContent = assignment.deadline;
  if (points) points.textContent = `${assignment.points} bodova`;
  if (comment) comment.value = "";
  resetFileInput(fileInput, fileName, "Podržani formati: .zip, .rar, .pdf, .doc, .docx (maks. 50 MB)");

  toggleProfileDropdown(false);
  closeSidebar(false);
  openModal("assignment-modal", '[data-close-modal]');
}

function submitAssignment(event) {
  event.preventDefault();

  const assignment = state.assignments.find((item) => item.id === state.selectedAssignmentId);
  const fileInput = $("#assignment-file");
  if (!assignment) return;

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast("Prije predaje priloži datoteku sa zadatkom.", "error");
    if (fileInput) fileInput.focus();
    return;
  }

  assignment.status = "submitted";
  persistSubmissions();
  refreshAssignmentViews();

  closeModal("assignment-modal", false);
  showToast(`Zadaća „${assignment.title}“ uspješno je predana.`);
}

/* =========================================================
   DATOTEKE
   ========================================================= */

function resetFileInput(input, label, defaultText) {
  if (input) input.value = "";
  if (label) {
    label.textContent = defaultText;
    label.className = "text-[10px] text-slate-400 mt-1 block";
  }
}

function validateFile(file, allowedExtensions, maxMegabytes) {
  const extension = `.${file.name.split(".").pop().toLowerCase()}`;
  if (!allowedExtensions.includes(extension)) {
    showToast(`Format ${extension} nije podržan. Dopušteno: ${allowedExtensions.join(", ")}.`, "error");
    return false;
  }
  if (file.size > maxMegabytes * 1024 * 1024) {
    showToast(`Datoteka je prevelika. Najveća dopuštena veličina je ${maxMegabytes} MB.`, "error");
    return false;
  }
  return true;
}

function updateFileLabel(input, label, allowedExtensions, maxMegabytes, defaultText) {
  if (!input || !label) return false;

  if (!input.files || input.files.length === 0) {
    label.textContent = defaultText;
    label.className = "text-[10px] text-slate-400 mt-1 block";
    return false;
  }

  const file = input.files[0];
  if (!validateFile(file, allowedExtensions, maxMegabytes)) {
    resetFileInput(input, label, defaultText);
    return false;
  }

  label.textContent = `${file.name} · ${formatFileSize(file.size)}`;
  label.className = "text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block";
  return true;
}

function bindDropzone(zoneId, inputId, allowedExtensions, maxMegabytes, defaultText) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  const label = zoneId === "assignment-dropzone" ? $("#assignment-file-name") : $("#upload-file-name");

  ["dragenter", "dragover"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add("border-studia-400", "bg-studia-50/60", "dark:bg-studia-950/30");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove("border-studia-400", "bg-studia-50/60", "dark:bg-studia-950/30");
    });
  });

  zone.addEventListener("drop", (event) => {
    if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length === 0) return;
    try {
      input.files = event.dataTransfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (error) {
      showToast("Datoteku nije moguće preuzeti povlačenjem. Klikni za odabir.", "error");
    }
  });

  input.addEventListener("change", () => {
    updateFileLabel(input, label, allowedExtensions, maxMegabytes, defaultText);
  });
}

/* =========================================================
   OBJAVA SKRIPTE
   ========================================================= */

function openUploadModal() {
  populateUploadCourses();
  toggleProfileDropdown(false);
  closeSidebar(false);
  openModal("upload-modal", "#upload-title-input");
}

function submitUpload(event) {
  event.preventDefault();

  const titleInput = $("#upload-title-input");
  const courseSelect = $("#upload-course");
  const descriptionInput = $("#upload-description");
  const fileInput = $("#upload-file");
  const fileName = $("#upload-file-name");

  if (!titleInput || !courseSelect || !fileInput) return;

  const title = titleInput.value.trim();
  const courseId = courseSelect.value;
  const course = getCourse(courseId);
  const file = fileInput.files && fileInput.files[0];

  if (!title) {
    showToast("Unesi naslov skripte.", "error");
    titleInput.focus();
    return;
  }
  if (!file) {
    showToast("Odaberi datoteku koju želiš objaviti.", "error");
    fileInput.focus();
    return;
  }
  if (!validateFile(file, [".pdf", ".doc", ".docx", ".txt"], 20)) {
    return;
  }

  const newScript = {
    id: Math.max(0, ...state.scripts.map((script) => script.id)) + 1,
    courseId,
    course: course ? course.name : "Ostalo",
    title,
    author: STUDENT.fullName,
    downloads: 0,
    rating: 0,
    pages: "—",
    description: descriptionInput && descriptionInput.value.trim()
      ? descriptionInput.value.trim()
      : "Materijal koji je objavio student."
  };

  state.scripts.unshift(newScript);
  renderScripts();
  refreshIcons();

  closeModal("upload-modal", false);
  event.target.reset();
  resetFileInput(fileInput, fileName, ".pdf, .doc, .docx ili .txt (maks. 20 MB)");

  if (state.tab !== "courses") switchTab("courses");
  showToast("Skripta je objavljena u UniHub bazi.");

  window.setTimeout(() => {
    const section = $("#unihub-section");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

/* =========================================================
   INBOX
   ========================================================= */

function openMessageModal(messageId) {
  const message = state.inbox.find((item) => item.id === Number(messageId));
  if (!message) return;

  state.selectedMessageId = message.id;

  const sender = $("#message-sender");
  const role = $("#message-role");
  const subject = $("#message-subject");
  const time = $("#message-time");
  const body = $("#message-body");
  const avatar = $("#message-avatar");
  const toggleButton = $("#message-toggle-read");

  if (sender) sender.textContent = message.sender;
  if (role) role.textContent = message.role;
  if (subject) subject.textContent = message.subject;
  if (time) time.textContent = message.time;
  if (body) body.textContent = message.body;
  if (avatar) avatar.textContent = getInitials(message.sender);

  message.unread = false;
  persistInboxRead();
  renderInbox();

  if (toggleButton) toggleButton.textContent = "Označi nepročitanim";

  toggleProfileDropdown(false);
  closeSidebar(false);
  openModal("message-modal", '[data-close-modal]');
}

function toggleSelectedMessageRead() {
  const message = state.inbox.find((item) => item.id === state.selectedMessageId);
  if (!message) return;

  message.unread = !message.unread;
  persistInboxRead();
  renderInbox();

  const toggleButton = $("#message-toggle-read");
  if (toggleButton) {
    toggleButton.textContent = message.unread ? "Označi pročitanim" : "Označi nepročitanim";
  }

  showToast(message.unread ? "Poruka je označena kao nepročitana." : "Poruka je označena kao pročitana.", "info");
}

function markAllInboxRead() {
  if (getUnreadCount() === 0) {
    showToast("Sve poruke su već pročitane.", "info");
    return;
  }

  state.inbox.forEach((message) => {
    message.unread = false;
  });
  persistInboxRead();
  renderInbox();
  showToast("Sve poruke su označene kao pročitane.");
}

/* =========================================================
   DETALJI KOLEGIJA
   ========================================================= */

function openCourseModal(courseId) {
  const course = getCourse(courseId);
  if (!course) return;

  state.selectedCourseId = course.id;

  const header = $("#course-modal-header");
  if (header) {
    header.className = `h-28 bg-gradient-to-br ${course.color} p-6 flex flex-col justify-between text-white relative overflow-hidden shrink-0`;
  }

  const fields = {
    "course-modal-code": course.code,
    "course-modal-title": course.name,
    "course-modal-professor": course.professor,
    "course-modal-description": course.description,
    "course-modal-progress-text": `${course.progress}%`,
    "course-modal-semester": course.semester,
    "course-modal-ects": String(course.ects),
    "course-modal-lectures": course.lectures
  };

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  const progress = $("#course-modal-progress");
  if (progress) progress.style.width = `${course.progress}%`;

  const assignmentContainer = $("#course-modal-assignments");
  if (assignmentContainer) {
    const assignments = state.assignments
      .filter((assignment) => assignment.courseId === course.id)
      .sort((first, second) => new Date(first.dueISO) - new Date(second.dueISO));

    assignmentContainer.innerHTML = assignments.length > 0
      ? assignments.map((assignment) => {
          const status = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.active;
          return `
            <div class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span class="min-w-0">
                <span class="block font-semibold text-slate-800 dark:text-slate-200 truncate">${escapeHtml(assignment.title)}</span>
                <span class="block text-[10px] text-slate-400 mt-0.5">${escapeHtml(assignment.deadline)}</span>
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${status.badge}">${status.label}</span>
            </div>
          `;
        }).join("")
      : `<p class="text-xs text-slate-400 py-2">Nema zadaća za ovaj kolegij.</p>`;
  }

  toggleProfileDropdown(false);
  closeSidebar(false);
  openModal("course-modal", '[data-close-modal]');
  refreshIcons();
}

/* =========================================================
   PREUZIMANJE
   ========================================================= */

function downloadScript(scriptId) {
  const script = state.scripts.find((item) => item.id === Number(scriptId));
  if (!script) return;

  const content = [
    "STUDIA · UNIHUB MATERIJAL",
    "========================================",
    `Naslov: ${script.title}`,
    `Kolegij: ${script.course}`,
    `Autor: ${script.author}`,
    `Ocjena: ${script.rating}/5`,
    "",
    script.description,
    "",
    "Ovo je demo datoteka generirana u studentskom portalu Studia.",
    "U stvarnoj aplikaciji ovdje bi se preuzela izvorna PDF datoteka."
  ].join("\r\n");

  downloadTextFile(`studia-${slugify(script.title)}.txt`, content);

  script.downloads += 1;
  renderScripts();
  refreshIcons();
  showToast(`Preuzimanje materijala „${script.title}“ je započelo.`);
}

function downloadCertificate() {
  const program = ACADEMIC_PROGRAMS[state.academic.program] || ACADEMIC_PROGRAMS["fpmoz-rac"];
  const content = [
    "STUDIA · SVEUČILIŠTE U MOSTARU",
    "FPMOZ · STUDENTSKI PORTAL",
    "",
    "POTVRDA O STUDIRANJU",
    "",
    `Student: ${STUDENT.fullName}`,
    `Broj indeksa: ${STUDENT.id}`,
    `Studijski program: ${program.label}`,
    `Godina studija: ${state.academic.year}. godina`,
    `Semestar: ${state.academic.semester === "zimski" ? "Zimski" : "Ljetni"} 2026/27`,
    `Ostvareni ECTS bodovi: ${STUDENT.ects}`,
    `Prosjek ocjena: ${STUDENT.average}`,
    "",
    "Potvrda se izdaje na osobni zahtjev studenta.",
    `Datum izdavanja: ${DEMO_TODAY_LABEL}`,
    "",
    "Demo dokument generiran u studentskom portalu Studia."
  ].join("\r\n");

  downloadTextFile("studia-potvrda-o-studiranju.txt", content);
  showToast("Potvrda je generirana kao demo tekstualna datoteka.", "info");
}

/* =========================================================
   KALENDAR (.ICS)
   ========================================================= */

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function icsDate(date) {
  return `${date.getFullYear()}${padNumber(date.getMonth() + 1)}${padNumber(date.getDate())}T${padNumber(date.getHours())}${padNumber(date.getMinutes())}00`;
}

function escapeICS(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function exportCalendar() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Studia//SUM Studentski portal//HR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Studia · rokovi i raspored"
  ];

  const stamp = icsDate(DEMO_TODAY);

  state.assignments.filter(isUpcoming).forEach((assignment) => {
    const course = getCourse(assignment.courseId);
    const start = new Date(assignment.dueISO);
    const end = new Date(start.getTime() + 30 * 60000);

    lines.push(
      "BEGIN:VEVENT",
      `UID:studia-assignment-${assignment.id}@sum.ba`,
      `DTSTAMP:${stamp}Z`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeICS(`Rok: ${course ? course.name : ""} — ${assignment.title}`)}`,
      `DESCRIPTION:${escapeICS(`${assignment.description} (${assignment.points} bodova)`)}`,
      `LOCATION:${escapeICS(course ? course.room : "FPMOZ")}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeICS(`Sutra istječe rok: ${assignment.title}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  });

  TIMETABLE.forEach((entry) => {
    const occurrence = new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate());
    const dayDifference = (entry.day - occurrence.getDay() + 7) % 7;
    occurrence.setDate(occurrence.getDate() + dayDifference);

    const [startHour, startMinute] = entry.start.split(":").map(Number);
    const [endHour, endMinute] = entry.end.split(":").map(Number);
    const start = new Date(occurrence);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(occurrence);
    end.setHours(endHour, endMinute, 0, 0);

    lines.push(
      "BEGIN:VEVENT",
      `UID:studia-class-${entry.id}@sum.ba`,
      `DTSTAMP:${stamp}Z`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeICS(`${entry.course} — ${entry.type}`)}`,
      `DESCRIPTION:${escapeICS(`Predavanje iz kolegija ${entry.course}.`)}`,
      `LOCATION:${escapeICS(entry.room)}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  downloadTextFile("studia-raspored-i-rokovi.ics", lines.join("\r\n"));
  showToast("Kalendar s rokovima i rasporedom je preuzet (.ics).");
}

/* =========================================================
   AI ASISTENT (demo)
   ========================================================= */

function appendAiMessage(role, content, allowHtml = false) {
  const chatBody = $("#ai-chat-body");
  if (!chatBody) return;

  const wrapper = document.createElement("div");
  wrapper.className = role === "user"
    ? "flex items-start gap-3 justify-end"
    : "flex items-start gap-3";

  const bubble = document.createElement("div");
  bubble.className = role === "user"
    ? "bg-studia-600 text-white p-4 rounded-2xl rounded-tr-sm text-xs max-w-md whitespace-pre-line"
    : "bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-sm text-xs text-slate-800 dark:text-slate-100 space-y-2";

  if (allowHtml && role === "assistant") {
    bubble.innerHTML = content;
  } else {
    bubble.textContent = content;
  }

  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "w-8 h-8 rounded-xl hero-gradient text-white flex items-center justify-center font-bold text-xs shrink-0";
    avatar.textContent = "AI";
    wrapper.append(avatar, bubble);
  } else {
    wrapper.append(bubble);
  }

  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
  refreshIcons();
}

function getAiResponse(message) {
  const query = message.toLowerCase();

  if (query.includes("laravel") || query.includes("web aplikacij")) {
    return `
      <p>Iz gradiva Web aplikacija izdvajam tri cjeline koje se najčešće pojavljuju na kolokviju:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li><strong>Routing i kontroleri</strong> — kako zahtjev dolazi do akcije i kako se vraća odgovor.</li>
        <li><strong>Eloquent ORM</strong> — relacije jedan-na-više i više-na-više, eager loading i N+1 problem.</li>
        <li><strong>Validacija i sigurnost</strong> — CSRF zaštita, mass assignment i autorizacija.</li>
      </ul>
      <p><strong>Probno pitanje:</strong> Objasni razliku između <em>hasMany</em> i <em>belongsToMany</em> relacije te navedi primjer iz aplikacije.</p>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">Savjet: ponovi i migracije te seedere — često se traže u praktičnom dijelu.</p>
    `;
  }

  if (query.includes("baz") || query.includes("sql")) {
    return `
      <p>Za Baze podataka 2 fokusiraj se na ove pojmove:</p>
      <ol class="list-decimal pl-4 space-y-1">
        <li><strong>JOIN-ovi</strong> — razlika između INNER, LEFT i FULL JOIN-a.</li>
        <li><strong>Indeksi</strong> — kada ubrzavaju upit, a kada mogu naškoditi.</li>
        <li><strong>Transakcije</strong> — ACID svojstva i primjer rollbacka.</li>
        <li><strong>Pohranjene procedure</strong> — prednosti i jednostavan primjer.</li>
      </ol>
      <p><strong>Zadatak za vježbu:</strong> Napiši upit koji vraća studente i broj položenih ispita, sortirano silazno, koristeći LEFT JOIN i GROUP BY.</p>
    `;
  }

  if (query.includes("ui") || query.includes("ux") || query.includes("dizajn")) {
    return `
      <p>Za UI/UX kolokvij najvažnije je razumjeti proces, ne samo alate:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li><strong>Istraživanje korisnika</strong> — intervjui, persone i scenariji korištenja.</li>
        <li><strong>Heuristička evaluacija</strong> — Nielsenovih 10 heuristika i način bilježenja nalaza.</li>
        <li><strong>Prototipiranje</strong> — od papirnatog do interaktivnog prototipa u Figmi.</li>
        <li><strong>Testiranje</strong> — zadaci, mjerenje uspješnosti i prioritizacija problema.</li>
      </ul>
      <p><strong>Probno pitanje:</strong> Navedi tri heuristike i za svaku primjer kršenja na stvarnoj aplikaciji.</p>
    `;
  }

  if (query.includes("plan") || query.includes("učenj") || query.includes("ispit")) {
    return `
      <p>Predlažem plan za ispitni tjedan od pet dana:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li><strong>Dan 1–2:</strong> Web aplikacije — prolazak kroz sažetak i rješavanje dva stara roka.</li>
        <li><strong>Dan 3:</strong> Baze podataka — SQL zadaci i optimizacija upita.</li>
        <li><strong>Dan 4:</strong> UI/UX — heuristike i priprema primjera za usmeni dio.</li>
        <li><strong>Dan 5:</strong> Ponavljanje i probni kviz bez bilješki.</li>
      </ul>
      <p>Radi u blokovima od 45 minuta s kratkim pauzama. Zapiši pitanja koja ne znaš i vrati im se isti dan.</p>
    `;
  }

  return `
    <p>Mogu ti pomoći sa sažecima, probnim pitanjima i planom učenja za kolegije na ovom semestru.</p>
    <p>Pokušaj pitati npr. <strong>„Sažmi Laravel relacije“</strong>, <strong>„Daj mi pitanja iz baza podataka“</strong> ili <strong>„Napravi plan učenja za ispitni tjedan“</strong>.</p>
    <p class="text-[11px] text-slate-500 dark:text-slate-400">Ovo je demo asistent s unaprijed pripremljenim odgovorima.</p>
  `;
}

function sendAiMessage(rawMessage) {
  const input = $("#ai-input");
  const message = String(rawMessage || (input ? input.value : "")).trim();
  if (!message) return;

  appendAiMessage("user", message);
  if (input) input.value = "";

  const chatBody = $("#ai-chat-body");
  if (!chatBody) return;

  const typing = document.createElement("div");
  typing.className = "flex items-start gap-3";
  typing.innerHTML = `
    <div class="w-8 h-8 rounded-xl hero-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">AI</div>
    <div class="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm text-xs text-slate-500 dark:text-slate-400">Pripremam odgovor…</div>
  `;
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;

  window.setTimeout(() => {
    typing.remove();
    appendAiMessage("assistant", getAiResponse(message), true);
  }, 650);
}

function openAiModal() {
  toggleProfileDropdown(false);
  closeSidebar(false);
  openModal("ai-modal", "#ai-input");
}

/* =========================================================
   MOODLE
   ========================================================= */

function renderMoodleStatus() {
  const config = state.moodleConfig;
  const isLive = config.mode === "live";
  const demoButton = $("[data-moodle-mode='demo']");
  const liveButton = $("[data-moodle-mode='live']");
  const demoPanel = $("#moodle-demo-panel");
  const livePanel = $("#moodle-live-panel");
  const proxyInput = $("#moodle-proxy-input");
  const lastSync = $("#moodle-last-sync");
  const summary = $("#moodle-summary");
  const status = $("#moodle-status");
  const activeClass = "bg-white dark:bg-slate-700 text-studia-700 dark:text-studia-300 shadow-sm";
  const inactiveClass = "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200";

  if (demoButton) {
    demoButton.className = `py-2.5 rounded-xl text-xs font-bold transition ${!isLive ? activeClass : inactiveClass}`;
    demoButton.setAttribute("aria-pressed", String(!isLive));
  }
  if (liveButton) {
    liveButton.className = `py-2.5 rounded-xl text-xs font-bold transition ${isLive ? activeClass : inactiveClass}`;
    liveButton.setAttribute("aria-pressed", String(isLive));
  }
  if (demoPanel) demoPanel.classList.toggle("hidden", isLive);
  if (livePanel) livePanel.classList.toggle("hidden", !isLive);
  if (proxyInput && document.activeElement !== proxyInput) proxyInput.value = config.proxyUrl;

  const hasMatchingSync = Boolean(config.lastSync) && config.lastSyncMode === config.mode;
  if (lastSync) {
    lastSync.textContent = config.lastSync
      ? formatSyncTime(config.lastSync, config.lastSyncMode || config.mode)
      : "Još nije sinkronizirano";
  }
  if (summary) {
    if (config.lastSummary) {
      const suffix = config.lastSyncMode && config.lastSyncMode !== config.mode
        ? ` (iz ${config.lastSyncMode === "live" ? "live" : "demo"} načina)`
        : "";
      summary.textContent = `${MoodleAPI.getSummaryText(config.lastSummary)}${suffix}`;
    } else {
      summary.textContent = isLive
        ? "Live način čeka prvu sinkronizaciju preko proxyja."
        : "Odaberi način rada i pokreni sinkronizaciju.";
    }
  }
  if (status) {
    status.textContent = isLive
      ? (hasMatchingSync ? "Live · sinkronizirano" : "Live · čeka proxy")
      : (hasMatchingSync ? "Demo · sinkronizirano" : "Demo · spreman");
    status.className = hasMatchingSync
      ? "font-bold text-emerald-600 dark:text-emerald-400"
      : "font-bold text-slate-600 dark:text-slate-300";
  }
}

function setMoodleMode(mode) {
  state.moodleConfig.mode = mode === "live" ? "live" : "demo";
  persistMoodleConfig();
  renderMoodleStatus();
  applyMoodleState();
  showToast(state.moodleConfig.mode === "live" ? "Uključen je live način rada." : "Uključen je demo način rada.", "info");
}

function openMoodleModal() {
  toggleProfileDropdown(false);
  closeSidebar(false);
  closeNotificationPanel();
  renderMoodleStatus();
  openModal(
    "moodle-modal",
    state.moodleConfig.mode === "live" ? "#moodle-proxy-input" : "[data-moodle-mode='demo']"
  );
}

async function saveMoodleConfig(event) {
  event.preventDefault();

  const mode = state.moodleConfig.mode;
  const proxyInput = $("#moodle-proxy-input");
  const proxyValue = proxyInput ? proxyInput.value : state.moodleConfig.proxyUrl;

  if (mode === "live" && !MoodleAPI.normalizeProxy(proxyValue)) {
    showToast("Unesi ispravan URL proxy poslužitelja (npr. https://proxy.example.com).", "error");
    if (proxyInput) proxyInput.focus();
    return;
  }

  MoodleAPI.saveConfig(mode, proxyValue);

  const syncButton = $("#moodle-sync-btn");
  const syncLabel = $("#moodle-sync-label");
  if (syncButton) syncButton.disabled = true;
  if (syncLabel) syncLabel.textContent = "Sinkroniziram...";
  renderMoodleStatus();

  try {
    const result = await MoodleAPI.sync({ mode, proxyUrl: proxyValue });
    MoodleAPI.saveResult(result);
    renderMoodleStatus();
    pushNotification({
      type: "system",
      title: "Moodle sinkronizacija završena",
      text: `${result.mode === "live" ? "Live" : "Demo"} · ${MoodleAPI.getSummaryText(result.summary)}`,
      time: "Upravo sada",
      targetTab: "dashboard",
      unread: true
    });
    showToast(`Sinkronizacija dovršena: ${MoodleAPI.getSummaryText(result.summary)}.`);
  } catch (error) {
    showToast(error.message || "Sinkronizacija nije uspjela.", "error");
    const status = $("#moodle-status");
    if (status) {
      status.textContent = "Greška · provjeri proxy";
      status.className = "font-bold text-rose-600 dark:text-rose-400";
    }
  } finally {
    if (syncButton) syncButton.disabled = false;
    if (syncLabel) syncLabel.textContent = "Sinkroniziraj sada";
  }
}

/* =========================================================
   OBAVIJESTI I PODSJETNICI
   ========================================================= */

function pushNotification(notification) {
  state.notifications.unshift({
    id: Date.now(),
    type: notification.type || "system",
    title: notification.title,
    text: notification.text,
    time: notification.time || "Upravo sada",
    dateISO: "2026-11-18",
    targetTab: notification.targetTab || "dashboard",
    unread: notification.unread !== false
  });
  renderNotifications();
}

function openNotification(notificationId) {
  const notification = getNotification(notificationId);
  if (!notification) return;

  markNotificationRead(notification.id);
  renderNotifications();
  closeNotificationPanel();

  if (notification.targetTab === "materials") {
    state.materialCourse = notification.targetCourse || "all";
    state.materialType = "all";
    state.materialsQuery = "";
    const search = $("#material-search-input");
    if (search) search.value = "";
  }

  if (notification.targetTab) {
    switchTab(notification.targetTab);
  }
}

function markAllNotifications() {
  const count = markAllNotificationsRead();
  renderNotifications();
  showToast(count > 0 ? `Označeno je ${count} obavijesti kao pročitano.` : "Sve obavijesti su već pročitane.", "info");
}

function openRemindersModal() {
  closeNotificationPanel();
  renderReminderSettings();
  openModal("reminders-modal", "#reminder-deadlines");
}

function saveReminders(event) {
  event.preventDefault();

  ["deadlines", "grades", "materials", "forums"].forEach((key) => {
    const input = $(`#reminder-${key}`);
    state.reminderSettings[key] = Boolean(input && input.checked);
  });

  const leadDays = $("#reminder-lead-days");
  if (leadDays && ["1", "3", "7"].includes(leadDays.value)) {
    state.reminderSettings.leadDays = leadDays.value;
  }

  persistReminderSettings();
  closeModal("reminders-modal", false);
  showToast("Postavke podsjetnika su spremljene.");
}

function sendTestReminder() {
  const leadDaysInput = $("#reminder-lead-days");
  const leadDays = leadDaysInput && ["1", "3", "7"].includes(leadDaysInput.value)
    ? leadDaysInput.value
    : state.reminderSettings.leadDays;
  const dayLabel = leadDays === "1" ? "1 dan" : `${leadDays} dana`;

  pushNotification({
    type: "deadline",
    title: "Testni podsjetnik: Laravel CRUD sustav",
    text: `Rok za DZ1 istječe za ${dayLabel}. Provjeri obavijesti i postavke podsjetnika.`,
    time: "Upravo sada",
    targetTab: "assignments",
    unread: true
  });

  closeModal("reminders-modal", false);
  window.setTimeout(() => toggleNotificationPanel(true), 120);
  showToast("Testni podsjetnik je dodan u centar obavijesti.", "info");
}

/* =========================================================
   OCJENE, MATERIJALI I IZVOZ
   ========================================================= */

function csvCell(value) {
  return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
}

function exportGradesCSV() {
  const grades = getFilteredGrades();
  if (grades.length === 0) {
    showToast("Nema ocjena za izvoz u odabranom semestru.", "info");
    return;
  }

  const rows = [
    ["Kolegij", "Šifra", "Semestar", "ECTS", "Ocjena", "Datum polaganja", "Profesor"].map(csvCell).join(";")
  ].concat(grades.map((grade) => [
    grade.name,
    grade.code,
    grade.semester,
    grade.ects,
    grade.grade,
    grade.date,
    grade.professor
  ].map(csvCell).join(";")));

  downloadTextFile(`studia-ocjene-${state.gradeFilter === "all" ? "sve" : `semestar-${state.gradeFilter}`}.csv`, `\uFEFF${rows.join("\r\n")}`);
  showToast(`Izvezeno je ${grades.length} ocjena u CSV datoteku.`);
}

function downloadMaterial(materialId) {
  const material = getMaterial(materialId);
  if (!material) return;

  const course = getCourse(material.courseId);
  const type = getMaterialType(material.type);
  const content = [
    "STUDIA · MATERIJAL KOLEGIJA",
    "========================================",
    `Naslov: ${material.title}`,
    `Kolegij: ${course ? course.name : material.courseId}`,
    `Sekcija: ${material.section}`,
    `Tip: ${type.label}`,
    `Objavljeno: ${formatDateISO(material.dateISO)}`,
    `Veličina: ${material.size}`,
    "",
    material.description,
    "",
    "Ovo je demo datoteka generirana u studentskom portalu Studia.",
    "U live načinu ovdje bi se preuzela izvorna datoteka iz Moodle kolegija."
  ].join("\r\n");

  downloadTextFile(`studia-${slugify(material.title)}.txt`, content);
  showToast(`Materijal „${material.title}“ je preuzet.`);
}

/* =========================================================
   DOGAĐAJI
   ========================================================= */

function handleDocumentClick(event) {
  const openSidebarButton = event.target.closest("[data-open-sidebar]");
  if (openSidebarButton) {
    openSidebar();
    return;
  }

  const plannerFocusButton = event.target.closest("[data-planner-focus]");
  if (plannerFocusButton) {
    switchTab("dashboard", { keepScroll: true });
    window.setTimeout(() => {
      const section = $("#planner-section");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = $("#planner-input");
      if (input) input.focus({ preventScroll: true });
    }, 60);
    return;
  }

  const todoToggle = event.target.closest("[data-todo-toggle]");
  if (todoToggle) {
    const id = todoToggle.dataset.todoToggle;
    const todo = state.todos.find((item) => String(item.id) === String(id));
    if (!todo) return;
    todo.done = !todo.done;
    persistPlanner();
    renderPlanner();
    showToast(todo.done ? "Zadatak je označen kao završen." : "Zadatak je ponovno aktivan.", "info");
    return;
  }

  const todoDelete = event.target.closest("[data-todo-delete]");
  if (todoDelete) {
    const id = todoDelete.dataset.todoDelete;
    const before = state.todos.length;
    state.todos = state.todos.filter((item) => String(item.id) !== String(id));
    if (state.todos.length === before) return;
    persistPlanner();
    renderPlanner();
    showToast("Zadatak je uklonjen iz planera.", "info");
    return;
  }

  const clearDoneButton = event.target.closest("[data-planner-clear-done]");
  if (clearDoneButton) {
    const before = state.todos.length;
    state.todos = state.todos.filter((todo) => !todo.done);
    if (state.todos.length === before) {
      showToast("Nema završenih zadataka za ukloniti.", "info");
      return;
    }
    persistPlanner();
    renderPlanner();
    showToast("Završeni zadaci su uklonjeni.");
    return;
  }

  const closeSidebarButton = event.target.closest("[data-close-sidebar]");
  if (closeSidebarButton) {
    closeSidebar();
    return;
  }

  const toastButton = event.target.closest("[data-toast]");
  if (toastButton) {
    showToast(toastButton.dataset.toast, "info");
    return;
  }

  const remindersButton = event.target.closest("[data-open-reminders]");
  if (remindersButton) {
    openRemindersModal();
    return;
  }

  const notificationButton = event.target.closest("[data-notification-open]");
  if (notificationButton) {
    openNotification(notificationButton.dataset.notificationOpen);
    return;
  }

  const moodleModeButton = event.target.closest("[data-moodle-mode]");
  if (moodleModeButton) {
    setMoodleMode(moodleModeButton.dataset.moodleMode);
    return;
  }

  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    switchTab(tabButton.dataset.tab);
    return;
  }

  const closeModalButton = event.target.closest("[data-close-modal]");
  if (closeModalButton) {
    const modal = closeModalButton.closest(".modal");
    if (modal) closeModal(modal.id);
    return;
  }

  if (event.target.classList.contains("modal")) {
    closeModal(event.target.id);
    return;
  }

  const openAiButton = event.target.closest("[data-open-ai]");
  if (openAiButton) {
    openAiModal();
    return;
  }

  const openMoodleButton = event.target.closest("[data-open-moodle]");
  if (openMoodleButton) {
    openMoodleModal();
    return;
  }

  const openUploadButton = event.target.closest("[data-open-upload]");
  if (openUploadButton) {
    openUploadModal();
    return;
  }

  const scrollCoursesButton = event.target.closest("[data-scroll-courses]");
  if (scrollCoursesButton) {
    const section = $("#my-courses-section");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const exportButton = event.target.closest("[data-export-ics]");
  if (exportButton) {
    exportCalendar();
    return;
  }

  const favoriteButton = event.target.closest("[data-course-fav]");
  if (favoriteButton) {
    const courseId = favoriteButton.dataset.courseFav;
    state.favorites[courseId] = !state.favorites[courseId];
    persistFavorites();
    renderCoursePills();
    renderCourses();
    renderFullCourses();
    refreshIcons();
    showToast(state.favorites[courseId] ? "Kolegij je dodan u favorite." : "Kolegij je uklonjen iz favorita.", "info");
    return;
  }

  const courseButton = event.target.closest("[data-course-open]");
  if (courseButton) {
    openCourseModal(courseButton.dataset.courseOpen);
    return;
  }

  const courseFilterButton = event.target.closest("[data-course-filter]");
  if (courseFilterButton) {
    state.courseFilter = courseFilterButton.dataset.courseFilter;
    renderCoursePills();
    renderCourses();
    refreshIcons();
    return;
  }

  const assignmentFilterButton = event.target.closest("[data-assignment-filter]");
  if (assignmentFilterButton) {
    state.assignmentFilter = assignmentFilterButton.dataset.assignmentFilter;
    renderAssignmentFilters();
    renderAssignments();
    refreshIcons();
    return;
  }

  const gradeFilterButton = event.target.closest("[data-grade-filter]");
  if (gradeFilterButton) {
    state.gradeFilter = gradeFilterButton.dataset.gradeFilter;
    renderGrades();
    refreshIcons();
    return;
  }

  const materialCourseButton = event.target.closest("[data-material-course]");
  if (materialCourseButton) {
    state.materialCourse = materialCourseButton.dataset.materialCourse;
    renderMaterials();
    refreshIcons();
    return;
  }

  const exportGradesButton = event.target.closest("[data-export-grades]");
  if (exportGradesButton) {
    exportGradesCSV();
    return;
  }

  const downloadMaterialButton = event.target.closest("[data-download-material]");
  if (downloadMaterialButton) {
    downloadMaterial(downloadMaterialButton.dataset.downloadMaterial);
    return;
  }

  const assignmentButton = event.target.closest("[data-assignment-open]");
  if (assignmentButton) {
    openAssignmentModal(assignmentButton.dataset.assignmentOpen);
    return;
  }

  const messageButton = event.target.closest("[data-message-open]");
  if (messageButton) {
    openMessageModal(messageButton.dataset.messageOpen);
    return;
  }

  const searchResult = event.target.closest("[data-search-type]");
  if (searchResult) {
    handleSearchResult(searchResult.dataset.searchType, searchResult.dataset.searchId);
    return;
  }

  const meetButton = event.target.closest("[data-join-meet]");
  if (meetButton) {
    joinMeet(meetButton.dataset.joinMeet);
    return;
  }

  const downloadScriptButton = event.target.closest("[data-download-script]");
  if (downloadScriptButton) {
    downloadScript(downloadScriptButton.dataset.downloadScript);
    return;
  }

  const noticeButton = event.target.closest("[data-notice-id]");
  if (noticeButton) {
    const notice = NOTICES.find((item) => item.id === Number(noticeButton.dataset.noticeId));
    if (notice) showToast(`${notice.title}: ${notice.body}`, "info");
    return;
  }

  const calendarDay = event.target.closest("[data-calendar-day]");
  if (calendarDay) {
    showCalendarDay(Number(calendarDay.dataset.calendarDay));
    return;
  }

  const aiPrompt = event.target.closest("[data-ai-prompt]");
  if (aiPrompt) {
    sendAiMessage(aiPrompt.dataset.aiPrompt);
    return;
  }

  const professorMessage = event.target.closest("[data-professor-message]");
  if (professorMessage) {
    const course = getCourse(professorMessage.dataset.professorMessage);
    if (course) showToast(`Poruka profesoru ${course.professor} je simulirana u demo verziji.`, "info");
    return;
  }

  const sidebarBackdrop = event.target.closest("#sidebar-backdrop");
  if (sidebarBackdrop) {
    closeSidebar();
    return;
  }

  // Zatvori profilni izbornik klikom izvan njega.
  const profileRoot = $("#profile-menu-btn") ? $("#profile-menu-btn").closest(".relative") : null;
  if (profileRoot && !profileRoot.contains(event.target)) {
    toggleProfileDropdown(false);
  }

  // Zatvori centar obavijesti klikom izvan njega.
  const notificationRoot = $("#notification-btn") ? $("#notification-btn").parentElement : null;
  if (notificationRoot && !notificationRoot.contains(event.target)) {
    closeNotificationPanel();
  }

  // Sakrij rezultate pretrage klikom izvan pretrage.
  const searchInput = $("#global-search-input");
  const searchPanel = $("#search-results-panel");
  const searchRoot = searchInput ? searchInput.closest(".relative") : null;
  if (
    searchPanel &&
    !searchPanel.classList.contains("hidden") &&
    searchRoot &&
    !searchRoot.contains(event.target)
  ) {
    searchPanel.classList.add("hidden");
  }
}

function handleKeydown(event) {
  if (event.key === "Tab") {
    trapModalFocus(event);
    return;
  }

  if (event.key === "Escape") {
    if (closeAnyModal()) return;

    const sidebar = $("#left-sidebar");
    if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
      closeSidebar();
      return;
    }

    const dropdown = $("#profile-dropdown");
    if (dropdown && !dropdown.classList.contains("hidden")) {
      toggleProfileDropdown(false);
      return;
    }

    const notificationPanel = $("#notification-panel");
    if (notificationPanel && !notificationPanel.classList.contains("hidden")) {
      closeNotificationPanel();
      return;
    }

    const panel = $("#search-results-panel");
    if (panel && !panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
    }
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (state.tab !== "dashboard") switchTab("dashboard", { keepScroll: true });
    const input = $("#global-search-input");
    if (input) {
      window.setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    }
    return;
  }

  if ((event.key === "Enter" || event.key === " ") && document.activeElement) {
    const courseCard = document.activeElement.closest("[data-course-open]");
    if (courseCard) {
      event.preventDefault();
      openCourseModal(courseCard.dataset.courseOpen);
    }
  }
}

function bindEvents() {
  const themeButton = $("#theme-toggle-btn");
  if (themeButton) themeButton.addEventListener("click", toggleTheme);

  const profileButton = $("#profile-menu-btn");
  if (profileButton) {
    profileButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleProfileDropdown();
    });
  }

  const notificationButton = $("#notification-btn");
  if (notificationButton) {
    notificationButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNotificationPanel();
    });
  }

  const notificationReadAll = $("#notification-read-all");
  if (notificationReadAll) notificationReadAll.addEventListener("click", markAllNotifications);

  const remindersForm = $("#reminders-form");
  if (remindersForm) remindersForm.addEventListener("submit", saveReminders);

  const reminderTest = $("#reminder-test");
  if (reminderTest) reminderTest.addEventListener("click", sendTestReminder);

  const searchInput = $("#global-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => handleGlobalSearch(event.target.value));
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim()) handleGlobalSearch(searchInput.value);
    });
  }

  const clearSearchButton = $("#clear-search-btn");
  if (clearSearchButton) {
    clearSearchButton.addEventListener("click", () => {
      clearGlobalSearch();
      if (searchInput) searchInput.focus();
    });
  }

  ["select-smjer", "select-godina", "select-semestar"].forEach((id) => {
    const select = document.getElementById(id);
    if (select) select.addEventListener("change", handleAcademicChange);
  });

  const previousButton = $("#courses-prev");
  const nextButton = $("#courses-next");
  if (previousButton) previousButton.addEventListener("click", () => scrollCourses(-1));
  if (nextButton) nextButton.addEventListener("click", () => scrollCourses(1));

  const carousel = $("#courses-carousel");
  if (carousel) {
    carousel.addEventListener("scroll", updateCarouselButtons, { passive: true });
  }
  window.addEventListener("resize", updateCarouselButtons);

  const scriptSearch = $("#script-search-input");
  if (scriptSearch) {
    scriptSearch.addEventListener("input", (event) => {
      state.scriptsQuery = event.target.value;
      renderScripts();
      refreshIcons();
    });
  }

  const materialSearch = $("#material-search-input");
  if (materialSearch) {
    materialSearch.addEventListener("input", (event) => {
      state.materialsQuery = event.target.value;
      renderMaterials();
      refreshIcons();
    });
  }

  const materialType = $("#material-type-filter");
  if (materialType) {
    materialType.addEventListener("change", (event) => {
      state.materialType = event.target.value;
      renderMaterials();
      refreshIcons();
    });
  }

  const plannerForm = $("#planner-form");
  if (plannerForm) {
    plannerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#planner-input");
      const deadline = $("#planner-deadline");
      const text = input ? input.value.trim() : "";

      if (!text) {
        showToast("Unesi naziv zadatka.", "error");
        if (input) input.focus();
        return;
      }

      state.todos.unshift({
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        done: false,
        deadline: deadline ? deadline.value : ""
      });
      persistPlanner();
      renderPlanner();

      if (input) {
        input.value = "";
        input.focus();
      }
      if (deadline) deadline.value = "";
      showToast("Zadatak je dodan u planer.");
    });
  }

  const markAllButton = $("#mark-all-read");
  if (markAllButton) markAllButton.addEventListener("click", markAllInboxRead);

  const certificateButton = $("#download-certificate");
  if (certificateButton) certificateButton.addEventListener("click", downloadCertificate);

  const aiForm = $("#ai-form");
  if (aiForm) {
    aiForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendAiMessage();
    });
  }

  const assignmentForm = $("#assignment-form");
  if (assignmentForm) assignmentForm.addEventListener("submit", submitAssignment);

  const uploadForm = $("#upload-form");
  if (uploadForm) uploadForm.addEventListener("submit", submitUpload);

  const moodleForm = $("#moodle-form");
  if (moodleForm) moodleForm.addEventListener("submit", saveMoodleConfig);

  const messageReply = $("#message-reply");
  if (messageReply) {
    messageReply.addEventListener("click", () => {
      showToast("Odgovor na poruku je simuliran u demo verziji.", "info");
    });
  }

  const messageToggleRead = $("#message-toggle-read");
  if (messageToggleRead) messageToggleRead.addEventListener("click", toggleSelectedMessageRead);

  const courseMoodle = $("#course-modal-moodle");
  if (courseMoodle) {
    courseMoodle.addEventListener("click", () => {
      window.open("https://eucenje.sum.ba/moodle/", "_blank", "noopener");
      showToast("Otvara se službeni SUM Moodle portal.", "info");
    });
  }

  const courseMessage = $("#course-modal-message");
  if (courseMessage) {
    courseMessage.addEventListener("click", () => {
      const course = getCourse(state.selectedCourseId);
      if (course) showToast(`Poruka profesoru ${course.professor} je simulirana u demo verziji.`, "info");
    });
  }

  bindDropzone(
    "assignment-dropzone",
    "assignment-file",
    [".zip", ".rar", ".pdf", ".doc", ".docx"],
    50,
    "Podržani formati: .zip, .rar, .pdf, .doc, .docx (maks. 50 MB)"
  );

  bindDropzone(
    "upload-dropzone",
    "upload-file",
    [".pdf", ".doc", ".docx", ".txt"],
    20,
    ".pdf, .doc, .docx ili .txt (maks. 20 MB)"
  );

  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleKeydown);
}

/* =========================================================
   POKRETANJE
   ========================================================= */

function init() {
  const cfg = (window.STUDIA_CONFIG && window.STUDIA_CONFIG.integration) || {};
  const ctx = { config: window.STUDIA_CONFIG || null, state };

  if (typeof cfg.onBeforeInit === "function") {
    try { cfg.onBeforeInit(ctx); } catch (error) { console.error("Studia onBeforeInit error", error); }
  }
  if (window.Studia && typeof window.Studia.emit === "function") window.Studia.emit("before-init", ctx);

  loadPreferences();
  syncThemeUI();
  updateAcademicLabels();
  applyMoodleState();
  renderAll();

  const hash = window.location.hash.replace("#", "");
  const validTabs = ["dashboard", "profile", "inbox", "courses", "grades", "materials", "assignments", "timetable", "meet"];
  const defaultTab = (window.STUDIA_CONFIG && window.STUDIA_CONFIG.ui && window.STUDIA_CONFIG.ui.defaultTab) || "dashboard";
  const initialTab = validTabs.includes(hash) ? hash : (validTabs.includes(defaultTab) ? defaultTab : "dashboard");
  switchTab(initialTab, { keepScroll: true, keepHash: !hash });

  bindEvents();
  syncThemeUI();
  refreshIcons();

  if (typeof cfg.onAfterInit === "function") {
    try { cfg.onAfterInit(ctx); } catch (error) { console.error("Studia onAfterInit error", error); }
  }
  if (typeof cfg.onReady === "function") {
    try { cfg.onReady(ctx); } catch (error) { console.error("Studia onReady error", error); }
  }
  if (window.Studia) {
    window.Studia.state = state;
    window.Studia.api = { switchTab, renderAll, showToast, openModal, closeModal };
  }
  if (window.Studia && typeof window.Studia.emit === "function") window.Studia.emit("ready", ctx);
}

document.addEventListener("DOMContentLoaded", init);
