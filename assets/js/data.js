/* =========================================================
   STUDIA — demo podaci
   Sve što se prikazuje u aplikaciji nalazi se ovdje.
   Datumi su vezani na demonstracijski datum: 18. 11. 2026.
   ========================================================= */

const DEMO_TODAY = new Date(2026, 10, 18, 9, 0);
const DEMO_TODAY_LABEL = "18. 11. 2026.";

const STUDENT = {
  firstName: "user",
  lastName: "",
  fullName: "user",
  initials: "U",
  email: "user@demo.sum.ba",
  id: "689302",
  program: "FPMOZ · Računarstvo",
  programShort: "Računarstvo",
  year: "2",
  semester: "zimski",
  semesterLabel: "Zimski semestar 2026/27",
  ects: 60,
  average: "4.7",
  academicStanding: "Odličan",
  status: "Redoviti student",
  phone: "063 123 456",
  address: "Trg hrvatskih velikana 1, Mostar",
  birthDate: "15. 03. 2005.",
  enrolledSince: "2025./2026.",
  photo: "assets/img/student-ivan.svg"
};

const ACADEMIC_PROGRAMS = {
  "fpmoz-rac": { label: "FPMOZ · Računarstvo", short: "Računarstvo", department: "Računarstvo i informacijske tehnologije" },
  "fsre-rac": { label: "FSRE · Računarstvo", short: "Računarstvo", department: "Računarstvo" },
  "ff-inf": { label: "Filozofski · Informacijske znanosti", short: "Info. znanosti", department: "Informacijske znanosti" }
};

const COURSE_CATEGORIES = [
  { id: "all", label: "Svi kolegiji" },
  { id: "web", label: "Web" },
  { id: "db", label: "Baze podataka" },
  { id: "design", label: "UI/UX" },
  { id: "ai", label: "AI" },
  { id: "project", label: "Projekt" }
];

const COURSES = [
  {
    id: "web",
    name: "Web aplikacije",
    code: "SUM-RWA",
    category: "web",
    semester: "3. semestar",
    ects: 6,
    progress: 75,
    lectures: "6/8 predavanja",
    professor: "Prof. dr. sc. Marin Ivanković",
    professorShort: "M. Ivanković",
    professorEmail: "marin.ivankovic@fpmoz.sum.ba",
    color: "from-purple-600 to-indigo-600",
    description: "Razvoj dinamičkih web aplikacija u Laravelu: routing, Eloquent ORM, autentifikacija, validacija i sigurnost. Kroz vježbe se gradi kompletna aplikacija s bazom podataka.",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    room: "Sala 3",
    nextClass: "Pon · 09:00"
  },
  {
    id: "db",
    name: "Baze podataka 2",
    code: "SUM-BP2",
    category: "db",
    semester: "3. semestar",
    ects: 6,
    progress: 62,
    lectures: "5/8 predavanja",
    professor: "Doc. dr. sc. Sanja Delić",
    professorShort: "S. Delić",
    professorEmail: "sanja.delic@fpmoz.sum.ba",
    color: "from-blue-600 to-cyan-600",
    description: "Napredni SQL, indeksiranje, optimizacija upita, transakcije i pohranjene procedure. Naglasak je na praktičnom radu s relacijskom bazom i analizi planova izvršavanja.",
    meetUrl: "https://meet.google.com/xyz-uvwx-rst",
    room: "Lab 1",
    nextClass: "Uto · 11:00"
  },
  {
    id: "design",
    name: "UI/UX Dizajn",
    code: "SUM-UIX",
    category: "design",
    semester: "3. semestar",
    ects: 5,
    progress: 88,
    lectures: "7/8 predavanja",
    professor: "Izv. prof. dr. sc. Mario Zovko",
    professorShort: "M. Zovko",
    professorEmail: "mario.zovko@fpmoz.sum.ba",
    color: "from-pink-600 to-rose-600",
    description: "Proces dizajna digitalnih proizvoda: istraživanje korisnika, informacijska arhitektura, prototipovi u Figmi i metode korisničkog testiranja.",
    meetUrl: "https://meet.google.com/qwe-rtyu-iop",
    room: "Sala 2",
    nextClass: "Sri · 14:00"
  },
  {
    id: "ai",
    name: "Umjetna inteligencija",
    code: "SUM-AI",
    category: "ai",
    semester: "3. semestar",
    ects: 6,
    progress: 40,
    lectures: "3/8 predavanja",
    professor: "Prof. dr. sc. Tomislav Volarić",
    professorShort: "T. Volarić",
    professorEmail: "tomislav.volaric@fpmoz.sum.ba",
    color: "from-emerald-600 to-teal-600",
    description: "Osnove strojnog učenja, klasifikacije, pretraživanja i evaluacije modela. Kroz laboratorijske vježbe obrađuju se priprema podataka i osnovni algoritmi.",
    meetUrl: "https://meet.google.com/asd-fghj-klz",
    room: "Sala 4",
    nextClass: "Čet · 10:00"
  },
  {
    id: "project",
    name: "Projektni rad",
    code: "SUM-PRJ",
    category: "project",
    semester: "3. semestar",
    ects: 4,
    progress: 90,
    lectures: "8/8 predavanja",
    professor: "Asist. Ana Marić",
    professorShort: "A. Marić",
    professorEmail: "ana.maric@fpmoz.sum.ba",
    color: "from-amber-600 to-orange-600",
    description: "Timski rad na realnom projektu od ideje do predaje: definiranje zahtjeva, planiranje, izrada prototipa, dokumentacija i završna prezentacija.",
    meetUrl: "https://meet.google.com/zxc-vbnm-qwe",
    room: "Računalna sala",
    nextClass: "Pet · 12:00"
  }
];

const ASSIGNMENT_STATUS = {
  active: {
    label: "U tijeku",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400",
    dot: "bg-amber-500"
  },
  notStarted: {
    label: "Nije započeto",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-300 dark:bg-slate-600"
  },
  submitted: {
    label: "Predano",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
    dot: "bg-emerald-500"
  }
};

const ASSIGNMENTS = [
  {
    id: 1,
    courseId: "web",
    type: "DZ",
    title: "Laravel CRUD sustav i UniHub integracija",
    dueISO: "2026-11-19T23:59:00+01:00",
    deadline: "19. 11. 2026. · 23:59",
    points: 10,
    status: "active",
    description: "Izraditi CRUD aplikaciju u Laravelu s autentifikacijom, migracijama i osnovnim testovima. Predati ZIP arhivu izvornog koda i kratku dokumentaciju."
  },
  {
    id: 2,
    courseId: "db",
    type: "Lab",
    title: "SQL optimizacija upita i indeksiranje",
    dueISO: "2026-11-20T23:59:00+01:00",
    deadline: "20. 11. 2026. · 23:59",
    points: 5,
    status: "submitted",
    description: "Analizirati plan izvršavanja zadanih upita, predložiti indekse i usporediti vrijeme izvršavanja prije i poslije optimizacije."
  },
  {
    id: 3,
    courseId: "design",
    type: "Projekt",
    title: "Figma prototip i korisničko testiranje",
    dueISO: "2026-11-25T12:00:00+01:00",
    deadline: "25. 11. 2026. · 12:00",
    points: 20,
    status: "active",
    description: "Izraditi interaktivni prototip od pet ekrana i provesti testiranje s najmanje tri korisnika. Predati poveznicu na prototip i izvještaj."
  },
  {
    id: 4,
    courseId: "ai",
    type: "Kviz",
    title: "Osnove strojnog učenja — online kviz",
    dueISO: "2026-12-02T09:00:00+01:00",
    deadline: "02. 12. 2026. · 09:00",
    points: 10,
    status: "notStarted",
    description: "Kviz od 30 pitanja iz područja klasifikacije, pripreme podataka i evaluacije modela. Kviz se rješava u Moodle okruženju."
  },
  {
    id: 5,
    courseId: "web",
    type: "DZ",
    title: "REST API i autorizacija u Laravelu",
    dueISO: "2026-12-09T23:59:00+01:00",
    deadline: "09. 12. 2026. · 23:59",
    points: 10,
    status: "notStarted",
    description: "Nadograditi postojeću aplikaciju REST API-jem, tokenima za autentifikaciju i pravilima pristupa. Uključiti testne primjere zahtjeva."
  },
  {
    id: 6,
    courseId: "project",
    type: "Projekt",
    title: "Završna prezentacija i dokumentacija",
    dueISO: "2026-12-15T23:59:00+01:00",
    deadline: "15. 12. 2026. · 23:59",
    points: 30,
    status: "active",
    description: "Predati završnu verziju projektne dokumentacije i prezentaciju. Prezentacija traje 10 minuta uz 5 minuta pitanja."
  },
  {
    id: 7,
    courseId: "db",
    type: "Lab",
    title: "JOIN-ovi i agregacijske funkcije",
    dueISO: "2026-11-06T23:59:00+01:00",
    deadline: "06. 11. 2026. · 23:59",
    points: 5,
    status: "submitted",
    description: "Riješiti skup SQL zadataka s JOIN-ovima, GROUP BY i HAVING klauzulama. Predati SQL skriptu s komentarima."
  },
  {
    id: 8,
    courseId: "design",
    type: "Vježba",
    title: "Heuristička evaluacija mobilne aplikacije",
    dueISO: "2026-11-12T12:00:00+01:00",
    deadline: "12. 11. 2026. · 12:00",
    points: 10,
    status: "submitted",
    description: "Procjeniti odabranu mobilnu aplikaciju prema Nielsenovim heuristikama i predati tablicu nalaza s preporukama."
  }
];

const SCRIPTS = [
  {
    id: 1,
    courseId: "web",
    course: "Web aplikacije",
    title: "Laravel — kompletan sažetak ispita i rješenja rokova (2026)",
    author: "Marko M.",
    downloads: 42,
    rating: 5,
    pages: 38,
    description: "Sažetak predavanja, tipična ispitna pitanja i rješenja zadataka s prethodnih rokova."
  },
  {
    id: 2,
    courseId: "db",
    course: "Baze podataka 2",
    title: "SQL JOIN-ovi, transakcije i pohranjene procedure",
    author: "Ivana P.",
    downloads: 29,
    rating: 4,
    pages: 26,
    description: "Kratki podsjetnik sintakse uz primjere upita i objašnjenja planova izvršavanja."
  },
  {
    id: 3,
    courseId: "design",
    course: "UI/UX Dizajn",
    title: "Pravila dizajna sučelja i heuristička evaluacija",
    author: "Luka B.",
    downloads: 35,
    rating: 5,
    pages: 31,
    description: "Checklista za evaluaciju sučelja, primjeri dobrih praksi i priprema za kolokvij."
  },
  {
    id: 4,
    courseId: "ai",
    course: "Umjetna inteligencija",
    title: "Umjetna inteligencija — priprema za kolokvij",
    author: "Sara K.",
    downloads: 18,
    rating: 4,
    pages: 24,
    description: "Osnovni pojmovi strojnog učenja, algoritmi i pitanja za samoprovjeru."
  },
  {
    id: 5,
    courseId: "project",
    course: "Projektni rad",
    title: "Šablona za projektnu dokumentaciju i prezentaciju",
    author: "Ana M.",
    downloads: 51,
    rating: 5,
    pages: 12,
    description: "Struktura dokumentacije, popis obveznih poglavlja i predložak prezentacije."
  }
];

const INBOX = [
  {
    id: 1,
    sender: "Prof. dr. sc. Marin Ivanković",
    role: "Profesor · Web aplikacije",
    subject: "Obavijest o kolokviju iz Web aplikacija",
    time: "Jučer · 14:20",
    preview: "Poštovani studenti, kolokvij iz Web aplikacija održat će se u računalnoj sali 3 s početkom u 09:00 sati...",
    body: "Poštovani studenti,\n\nkolokvij iz Web aplikacija održat će se u petak, 27. 11. 2026., u računalnoj sali 3 s početkom u 09:00 sati. Kolokvij pokriva gradivo od prvog do šestog tjedna: routing, kontroleri, Eloquent ORM i validaciju.\n\nNa kolokvij donijeti studentski identifikacijski dokument. Prijava nije potrebna.\n\nSrdačan pozdrav,\nMarin Ivanković",
    unread: true
  },
  {
    id: 2,
    sender: "SUM Moodle",
    role: "Sustavska obavijest",
    subject: "Podsjetnik: rok za predaju DZ1 istječe sutra",
    time: "Prije 3 sata",
    preview: "Podsjećamo vas da je rok za predaju zadaće iz kolegija Web aplikacije sutra u 23:59...",
    body: "Podsjećamo vas da je rok za predaju prve domaće zadaće iz kolegija Web aplikacije sutra, 19. 11. 2026., u 23:59.\n\nZadaća se predaje kroz Moodle aktivnost \"DZ1 — Laravel CRUD\". Nakon isteka roka predaja nije moguća.\n\nSUM Moodle",
    unread: true
  },
  {
    id: 3,
    sender: "Doc. dr. sc. Sanja Delić",
    role: "Profesorica · Baze podataka 2",
    subject: "Objavljeni rezultati laboratorijskih vježbi",
    time: "14. 11. 2026. · 10:05",
    preview: "Rezultati treće laboratorijske vježbe nalaze se na Moodle stranici kolegija...",
    body: "Poštovani studenti,\n\nrezultati treće laboratorijske vježbe objavljeni su na Moodle stranici kolegija Baze podataka 2. Uvid u zadatke moguć je na konzultacijama u utorak od 13:30.\n\nMolim da eventualne primjedbe pošaljete najkasnije do petka.\n\nSanja Delić",
    unread: false
  },
  {
    id: 4,
    sender: "Studentska služba",
    role: "FPMOZ · Mostar",
    subject: "Upis u ljetni semestar — važni datumi",
    time: "12. 11. 2026. · 08:40",
    preview: "Obavještavamo studente da će upis u ljetni semestar započeti 2. veljače 2027...",
    body: "Poštovani studenti,\n\nupis u ljetni semestar akademske godine 2026./2027. započinje 2. veljače 2027. i traje do 12. veljače 2027. Raspored upisa po godinama bit će objavljen na oglasnoj ploči fakulteta.\n\nZa upis je potrebno podmiriti sve obveze prema studijskom programu.\n\nStudentska služba FPMOZ-a",
    unread: true
  }
];

const TIMETABLE = [
  {
    id: 1,
    day: 1,
    dayShort: "Pon",
    dayLabel: "Ponedjeljak",
    time: "09:00 – 11:30",
    start: "09:00",
    end: "11:30",
    courseId: "web",
    course: "Web aplikacije",
    type: "Predavanja",
    room: "Sala 3 (FPMOZ)",
    meetUrl: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: 2,
    day: 2,
    dayShort: "Uto",
    dayLabel: "Utorak",
    time: "11:00 – 13:15",
    start: "11:00",
    end: "13:15",
    courseId: "db",
    course: "Baze podataka 2",
    type: "Laboratorij",
    room: "Lab 1",
    meetUrl: "https://meet.google.com/xyz-uvwx-rst"
  },
  {
    id: 3,
    day: 3,
    dayShort: "Sri",
    dayLabel: "Srijeda",
    time: "14:00 – 16:30",
    start: "14:00",
    end: "16:30",
    courseId: "design",
    course: "UI/UX Dizajn",
    type: "Auditorne vježbe",
    room: "Sala 2",
    meetUrl: "https://meet.google.com/qwe-rtyu-iop"
  },
  {
    id: 4,
    day: 4,
    dayShort: "Čet",
    dayLabel: "Četvrtak",
    time: "10:00 – 12:15",
    start: "10:00",
    end: "12:15",
    courseId: "ai",
    course: "Umjetna inteligencija",
    type: "Predavanja",
    room: "Sala 4",
    meetUrl: "https://meet.google.com/asd-fghj-klz"
  },
  {
    id: 5,
    day: 5,
    dayShort: "Pet",
    dayLabel: "Petak",
    time: "12:00 – 15:00",
    start: "12:00",
    end: "15:00",
    courseId: "project",
    course: "Projektni rad",
    type: "Konzultacije",
    room: "Računalna sala",
    meetUrl: "https://meet.google.com/zxc-vbnm-qwe"
  }
];

const NOTICES = [
  {
    id: 1,
    date: "18. 11. 2026.",
    tag: "Ispit",
    title: "Kolokvij iz Web aplikacija",
    body: "Kolokvij će se održati 27. 11. 2026. u računalnoj sali 3 s početkom u 09:00."
  },
  {
    id: 2,
    date: "16. 11. 2026.",
    tag: "Projekt",
    title: "Prijava teme projektnog rada",
    body: "Temu završnog projektnog rada potrebno je prijaviti mentoru najkasnije do 30. 11. 2026."
  },
  {
    id: 3,
    date: "12. 11. 2026.",
    tag: "Stipendija",
    title: "Natječaj za studentsku stipendiju",
    body: "Otvoren je natječaj za stipendije za akademsku godinu 2026./2027. Rok za prijavu je 5. 12. 2026."
  }
];

/* =========================================================
   OCJENE — završena prva godina
   ========================================================= */

const GRADE_HISTORY = [
  {
    id: "prg1",
    courseId: "prg1",
    name: "Programiranje 1",
    code: "SUM-PRG1",
    semesterId: "1",
    semester: "1. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-02-10",
    date: "10. 02. 2026.",
    professor: "Prof. dr. sc. Marin Ivanković"
  },
  {
    id: "mat1",
    courseId: "mat1",
    name: "Matematika 1",
    code: "SUM-MAT1",
    semesterId: "1",
    semester: "1. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-02-17",
    date: "17. 02. 2026.",
    professor: "Prof. dr. sc. Ivana Perić"
  },
  {
    id: "rmre",
    courseId: "rmre",
    name: "Računalne mreže",
    code: "SUM-RMRE",
    semesterId: "1",
    semester: "1. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-02-24",
    date: "24. 02. 2026.",
    professor: "Prof. dr. sc. Tomislav Volarić"
  },
  {
    id: "eng1",
    courseId: "eng1",
    name: "Engleski jezik 1",
    code: "SUM-ENG1",
    semesterId: "1",
    semester: "1. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-03-03",
    date: "03. 03. 2026.",
    professor: "Asist. Ana Marić"
  },
  {
    id: "ubp",
    courseId: "ubp",
    name: "Uvod u baze podataka",
    code: "SUM-UBP",
    semesterId: "1",
    semester: "1. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-03-10",
    date: "10. 03. 2026.",
    professor: "Doc. dr. sc. Sanja Delić"
  },
  {
    id: "prg2",
    courseId: "prg2",
    name: "Programiranje 2",
    code: "SUM-PRG2",
    semesterId: "2",
    semester: "2. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-06-15",
    date: "15. 06. 2026.",
    professor: "Prof. dr. sc. Marin Ivanković"
  },
  {
    id: "mat2",
    courseId: "mat2",
    name: "Matematika 2",
    code: "SUM-MAT2",
    semesterId: "2",
    semester: "2. semestar",
    ects: 6,
    grade: 4,
    dateISO: "2026-06-22",
    date: "22. 06. 2026.",
    professor: "Prof. dr. sc. Ivana Perić"
  },
  {
    id: "os",
    courseId: "os",
    name: "Operacijski sustavi",
    code: "SUM-OS",
    semesterId: "2",
    semester: "2. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-06-29",
    date: "29. 06. 2026.",
    professor: "Prof. dr. sc. Tomislav Volarić"
  },
  {
    id: "wt",
    courseId: "wt",
    name: "Web tehnologije",
    code: "SUM-WT",
    semesterId: "2",
    semester: "2. semestar",
    ects: 6,
    grade: 5,
    dateISO: "2026-07-06",
    date: "06. 07. 2026.",
    professor: "Prof. dr. sc. Marin Ivanković"
  },
  {
    id: "pi",
    courseId: "pi",
    name: "Poslovna informatika",
    code: "SUM-PI",
    semesterId: "2",
    semester: "2. semestar",
    ects: 6,
    grade: 3,
    dateISO: "2026-09-07",
    date: "07. 09. 2026.",
    professor: "Izv. prof. dr. sc. Mario Zovko"
  }
];

/* =========================================================
   MATERIJALI KOLEGIJA — Moodle sekcije i datoteke
   ========================================================= */

const MATERIAL_TYPES = {
  pdf: {
    label: "PDF",
    icon: "file-text",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
  },
  slides: {
    label: "Prezentacija",
    icon: "presentation",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
  },
  link: {
    label: "Poveznica",
    icon: "external-link",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
  },
  video: {
    label: "Video",
    icon: "video",
    color: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/60 dark:text-fuchsia-400"
  },
  archive: {
    label: "Arhiva",
    icon: "archive",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
  }
};

const MATERIALS = [
  {
    id: 1,
    courseId: "web",
    section: "Tjedan 1–2 · Uvod u Laravel",
    title: "Uvod u Laravel i struktura projekta",
    type: "pdf",
    size: "2,4 MB",
    dateISO: "2026-10-06",
    description: "Instalacija, struktura mapa, Artisan naredbe i prvi zahtjev kroz aplikaciju."
  },
  {
    id: 2,
    courseId: "web",
    section: "Tjedan 3–4 · Routing i kontroleri",
    title: "Rute, kontroleri i middleware",
    type: "pdf",
    size: "1,8 MB",
    dateISO: "2026-10-20",
    description: "Definiranje ruta, grupe, middleware i validacija ulaznih podataka."
  },
  {
    id: 3,
    courseId: "web",
    section: "Tjedan 5–6 · Eloquent ORM",
    title: "Eloquent ORM i migracije",
    type: "slides",
    size: "3,1 MB",
    dateISO: "2026-11-15",
    description: "Modeli, relacije, migracije, seeders i praktični primjeri upita."
  },
  {
    id: 4,
    courseId: "web",
    section: "Tjedan 7–8 · Sigurnost",
    title: "Autentifikacija i autorizacija",
    type: "pdf",
    size: "2,2 MB",
    dateISO: "2026-11-17",
    description: "Prijava korisnika, sesije, politike pristupa i zaštita ruta."
  },
  {
    id: 5,
    courseId: "web",
    section: "Projektni zadatak",
    title: "Specifikacija projekta i kriteriji ocjenjivanja",
    type: "link",
    size: "Moodle",
    dateISO: "2026-11-10",
    description: "Zahtjevi projekta, obvezne funkcionalnosti i način predaje.",
    url: "https://eucenje.sum.ba/moodle/mod/assign/view.php?id=101"
  },
  {
    id: 6,
    courseId: "db",
    section: "Tjedan 1–2 · Modeliranje",
    title: "Normalizacija i modeliranje baze",
    type: "pdf",
    size: "2,0 MB",
    dateISO: "2026-10-08",
    description: "Funkcijske ovisnosti, normalne forme i primjer modeliranja."
  },
  {
    id: 7,
    courseId: "db",
    section: "Tjedan 3–4 · Upiti",
    title: "Indeksi i optimizacija upita",
    type: "pdf",
    size: "1,5 MB",
    dateISO: "2026-10-22",
    description: "Vrste indeksa, plan izvršavanja i česti uzroci sporih upita."
  },
  {
    id: 8,
    courseId: "db",
    section: "Tjedan 5–6 · Transakcije",
    title: "Transakcije i izolacijske razine",
    type: "slides",
    size: "2,8 MB",
    dateISO: "2026-11-14",
    description: "ACID svojstva, zaključavanje i rješavanje konkurentskih pristupa."
  },
  {
    id: 9,
    courseId: "db",
    section: "Laboratorijske vježbe",
    title: "SQL radionica — zadaci i rješenja",
    type: "archive",
    size: "640 KB",
    dateISO: "2026-11-16",
    description: "Skup zadataka s JOIN-ovima, agregacijama i pripremljenim rješenjima."
  },
  {
    id: 10,
    courseId: "db",
    section: "Dodatni materijali",
    title: "Katalog korisnih SQL alata",
    type: "link",
    size: "Web",
    dateISO: "2026-10-01",
    description: "Alati za vizualizaciju sheme, analizu upita i rad s bazama.",
    url: "https://eucenje.sum.ba/moodle/course/view.php?id=42"
  },
  {
    id: 11,
    courseId: "design",
    section: "Tjedan 1–2 · Istraživanje",
    title: "Istraživanje korisnika i persone",
    type: "pdf",
    size: "2,6 MB",
    dateISO: "2026-10-09",
    description: "Intervjui, ankete, persona i mapiranje korisničkog puta."
  },
  {
    id: 12,
    courseId: "design",
    section: "Tjedan 3–4 · Struktura",
    title: "Wireframe i informacijska arhitektura",
    type: "pdf",
    size: "1,9 MB",
    dateISO: "2026-10-23",
    description: "Skice, wireframeovi, navigacija i prioritizacija sadržaja."
  },
  {
    id: 13,
    courseId: "design",
    section: "Tjedan 5–6 · Figma",
    title: "Figma komponente i dizajn sustav",
    type: "video",
    size: "18 min",
    dateISO: "2026-11-12",
    description: "Komponente, varijable, auto layout i organizacija dizajn sustava.",
    url: "https://eucenje.sum.ba/moodle/mod/url/view.php?id=203"
  },
  {
    id: 14,
    courseId: "design",
    section: "Tjedan 7–8 · Testiranje",
    title: "Prototip i korisničko testiranje",
    type: "slides",
    size: "3,4 MB",
    dateISO: "2026-11-11",
    description: "Interaktivni prototip, scenariji testiranja i analiza nalaza."
  },
  {
    id: 15,
    courseId: "design",
    section: "Dodatni materijali",
    title: "Figma zajednica — inspiracija",
    type: "link",
    size: "Web",
    dateISO: "2026-10-02",
    description: "Odabrani primjeri sučelja, komponenti i dizajn sustava.",
    url: "https://www.figma.com/community"
  },
  {
    id: 16,
    courseId: "ai",
    section: "Tjedan 1–2 · Uvod",
    title: "Uvod u strojno učenje",
    type: "pdf",
    size: "3,0 MB",
    dateISO: "2026-10-07",
    description: "Nadzirano učenje, podjela podataka i osnovni pojmovi."
  },
  {
    id: 17,
    courseId: "ai",
    section: "Tjedan 3–4 · Klasifikacija",
    title: "Priprema podataka i klasifikacija",
    type: "pdf",
    size: "2,7 MB",
    dateISO: "2026-10-21",
    description: "Čišćenje podataka, značajke i evaluacija klasifikatora."
  },
  {
    id: 18,
    courseId: "ai",
    section: "Tjedan 5–6 · Neuronske mreže",
    title: "Neuronske mreže — osnove",
    type: "slides",
    size: "4,2 MB",
    dateISO: "2026-11-13",
    description: "Perceptron, aktivacijske funkcije, slojevi i treniranje modela."
  },
  {
    id: 19,
    courseId: "ai",
    section: "Laboratorijske vježbe",
    title: "Laboratorij 3 — skup podataka",
    type: "archive",
    size: "1,2 MB",
    dateISO: "2026-11-10",
    description: "Pripremljeni skup podataka i početni kod za vježbu."
  },
  {
    id: 20,
    courseId: "ai",
    section: "Dodatni materijali",
    title: "Poveznice na Python biblioteke",
    type: "link",
    size: "Web",
    dateISO: "2026-10-05",
    description: "Dokumentacija za NumPy, pandas, scikit-learn i matplotlib.",
    url: "https://eucenje.sum.ba/moodle/course/view.php?id=55"
  },
  {
    id: 21,
    courseId: "project",
    section: "Faza 1 · Specifikacija",
    title: "Specifikacija projekta — predložak",
    type: "pdf",
    size: "800 KB",
    dateISO: "2026-10-15",
    description: "Struktura dokumenta, opis problema i definiranje opsega."
  },
  {
    id: 22,
    courseId: "project",
    section: "Faza 2 · Planiranje",
    title: "Plan projekta i podjela uloga",
    type: "slides",
    size: "1,1 MB",
    dateISO: "2026-10-29",
    description: "Vremenski plan, podjela zadataka i način praćenja napretka."
  },
  {
    id: 23,
    courseId: "project",
    section: "Faza 3 · Predaja",
    title: "Predložak završne dokumentacije",
    type: "archive",
    size: "2,3 MB",
    dateISO: "2026-11-18",
    description: "Obavezno poglavlje, formatiranje i popis priloga."
  },
  {
    id: 24,
    courseId: "project",
    section: "Faza 3 · Predaja",
    title: "Prezentacija — smjernice i raspored",
    type: "pdf",
    size: "900 KB",
    dateISO: "2026-11-18",
    description: "Vremenski okvir izlaganja, pitanja i kriteriji ocjenjivanja."
  },
  {
    id: 25,
    courseId: "project",
    section: "Dodatni materijali",
    title: "Primjeri prošlogodišnjih projekata",
    type: "link",
    size: "Web",
    dateISO: "2026-10-10",
    description: "Odabrani projekti s prethodnih godina i kratka analiza.",
    url: "https://eucenje.sum.ba/moodle/course/view.php?id=77"
  }
];

/* =========================================================
   NOTIFIKACIJE I PODSJETNICI
   ========================================================= */

const NOTIFICATION_TYPES = {
  deadline: {
    icon: "clock",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
  },
  grade: {
    icon: "award",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
  },
  material: {
    icon: "book-open",
    color: "bg-studia-100 text-studia-600 dark:bg-studia-950/60 dark:text-studia-400"
  },
  forum: {
    icon: "inbox",
    color: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400"
  },
  exam: {
    icon: "calendar",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
  },
  system: {
    icon: "refresh-cw",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  }
};

const NOTIFICATIONS = [
  {
    id: 1,
    type: "deadline",
    title: "Rok za DZ1 istječe sutra",
    text: "Laravel CRUD sustav · Web aplikacije · 19. 11. 2026. u 23:59",
    time: "Prije 2 sata",
    dateISO: "2026-11-18",
    targetTab: "assignments",
    targetId: 1,
    unread: true
  },
  {
    id: 2,
    type: "grade",
    title: "Nova ocjena: 5 iz Programiranja 2",
    text: "Ocjena je objavljena u Moodle kolegiju. Prosjek je sada 4.70.",
    time: "Jučer · 16:40",
    dateISO: "2026-11-17",
    targetTab: "grades",
    unread: true
  },
  {
    id: 3,
    type: "material",
    title: "Novi materijal: Eloquent ORM i migracije",
    text: "Web aplikacije · Prezentacija · 3,1 MB",
    time: "Jučer · 09:15",
    dateISO: "2026-11-17",
    targetTab: "materials",
    targetCourse: "web",
    unread: true
  },
  {
    id: 4,
    type: "forum",
    title: "Odgovor na forumu: Baze podataka 2",
    text: "Prof. dr. sc. Sanja Delić odgovorila je na temu „Indeksi i optimizacija“.",
    time: "16. 11. 2026. · 13:05",
    dateISO: "2026-11-16",
    targetTab: "inbox",
    unread: true
  },
  {
    id: 5,
    type: "exam",
    title: "Kolokvij iz Web aplikacija za 9 dana",
    text: "27. 11. 2026. · 09:00 · Računalna sala 3",
    time: "15. 11. 2026.",
    dateISO: "2026-11-15",
    targetTab: "timetable",
    unread: false
  },
  {
    id: 6,
    type: "system",
    title: "Moodle sinkronizacija završena",
    text: "Povučeno je 5 kolegija, 10 ocjena i 25 materijala.",
    time: "14. 11. 2026.",
    dateISO: "2026-11-14",
    targetTab: "dashboard",
    unread: false
  }
];

const DEFAULT_REMINDER_SETTINGS = {
  deadlines: true,
  grades: true,
  materials: true,
  forums: false,
  leadDays: "3"
};
