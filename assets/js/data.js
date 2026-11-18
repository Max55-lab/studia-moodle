/* =========================================================
   STUDIA — demo podaci
   Sve što se prikazuje u aplikaciji nalazi se ovdje.
   Datumi su vezani na demonstracijski datum: 18. 11. 2026.
   ========================================================= */

const DEMO_TODAY = new Date(2026, 10, 18, 9, 0);
const DEMO_TODAY_LABEL = "18. 11. 2026.";

const STUDENT = {
  firstName: "Ivan",
  lastName: "Kovač",
  fullName: "Ivan Kovač",
  initials: "IK",
  email: "ivan.kovac@fpmoz.sum.ba",
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
