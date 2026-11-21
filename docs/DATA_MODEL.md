# Podatkovni model (demo i integracija)

Ovaj dokument opisuje glavne podatkovne strukture koje koristi Studia portal. Zadani demo podaci nalaze se u `assets/js/data.js`.

> Cilj: omogućiti mapiranje podataka iz vanjskih sustava (Moodle, SIS/ISVU, custom API) u oblik koji UI može prikazati.

## 1. Osnovni kontekst

- `DEMO_TODAY` / `DEMO_TODAY_LABEL`: fiksni referentni datum za demo prikaze rokova i stanja.
- `STUDENT`: podaci o prijavljenom studentu (demo).

### `STUDENT` (primjer polja)
- `firstName`, `lastName`, `fullName`, `initials`
- `email`, `id`
- `program`, `programShort`, `year`, `semester`, `semesterLabel`
- `ects`, `average`, `academicStanding`, `status`
- `photo` (putanja/URL)

## 2. Akademski kontekst i kolegiji

### `ACADEMIC_PROGRAMS`
Mapa programa/smjerova: ključ -> `{ label, short, department }`.

### `COURSE_CATEGORIES`
Lista filter kategorija: `{ id, label }`.

### `COURSES` (stavka)
- Identitet: `id`, `name`, `code`, `category`
- Akademsko: `semester`, `ects`, `progress`, `lectures`
- Osobe i opis: `professor`, `professorShort`, `professorEmail`, `description`
- UI/metapodaci: `color` (gradient klase), `room`, `nextClass`, `meetUrl`

## 3. Obveze i ocjene

### `ASSIGNMENTS` (stavka)
- `id`, `courseId`, `type`, `title`
- Rok: `dueISO`, `deadline`
- `points`, `status` (`active | notStarted | submitted`)
- `description`

### `ASSIGNMENT_STATUS`
Mapa statusa -> `{ label, badge, dot }` (UI klase/oznake).

### `GRADE_HISTORY` (stavka)
- `id`, `courseId`, `name`, `code`
- `semesterId`, `semester`
- `ects`, `grade` (broj)
- `dateISO`, `date`, `professor`

Izvedene vrijednosti (u `core.js`): prosjek ponderiran ECTS-om, ostvareni/upisani ECTS, distribucija ocjena.

## 4. Materijali

### `MATERIAL_TYPES`
Mapa tipova -> `{ label, icon, color }` (npr. `pdf`, `slides`, `link`, `video`, `archive`).

### `MATERIALS` (stavka)
- `id`, `courseId`, `section`, `title`, `type`
- `size`, `dateISO`, `description`
- `url` (opcionalno, za vanjske poveznice)

## 5. Komunikacija i obavijesti

### `INBOX` (poruka)
- `id`, `sender`, `role`, `subject`
- `time`, `preview`, `body`
- `unread` (bool)

### `NOTIFICATIONS` (obavijest)
- `id`, `type`, `title`, `text`, `time`, `dateISO`
- `targetTab` (npr. `assignments`, `grades`, `materials`, `inbox`, `timetable`, `dashboard`)
- `targetId` / `targetCourse` (opcionalno, za deep-link)
- `unread` (bool)

### `NOTIFICATION_TYPES`
Mapa tipova -> `{ icon, color }`.

### Podsjetnici
- `DEFAULT_REMINDER_SETTINGS`: `{ deadlines, grades, materials, forums, leadDays }`

## 6. Raspored, oglasi i resursi

### `TIMETABLE` (stavka)
- `id`, `day`, `dayShort`, `dayLabel`
- `time`, `start`, `end`
- `courseId`, `course`, `type`, `room`, `meetUrl`

### `NOTICES` (oglas)
- `id`, `date`, `tag`, `title`, `body`

### `SCRIPTS` (UniHub demo resursi)
- `id`, `courseId`, `course`, `title`, `author`
- `downloads`, `rating`, `pages`, `description`

## 7. Stanje i pohrana (runtime)

Runtime stanje se drži u globalnom `state` objektu (`assets/js/core.js`) i uključuje:
- aktivni tab/filtere/upite,
- radne kopije kolekcija (npr. zadaci, poruke, obavijesti),
- korisničke postavke i Moodle konfiguraciju/sinkronizacijski status.

Dio stanja se pohranjuje u `localStorage` (ključevi s prefiksom, zadano `studia:*`), npr. tema, akademski kontekst, pročitane poruke/obavijesti, predane zadaće, postavke podsjetnika, Moodle konfiguracija.

## 8. Live Moodle dataset (`payload.data`)

Kad proxy vrati `data`, `assets/js/live-data.js` očekuje sljedeći ugovor. Sva tekstualna polja tretiraju se kao nepouzdana i eskapiraju se pri prikazu.

```json
{
  "ok": true,
  "summary": { "courses": 3, "grades": 3, "materials": 3, "assignments": 2, "notifications": 1 },
  "data": {
    "courses": [{ "id": 101, "shortname": "SUM-WEB", "fullname": "Web aplikacije", "summary": "...", "startdate": 0, "completionprogress": 75, "completedactivities": 6, "totalactivities": 8 }],
    "grades": [{ "id": 1, "courseid": 101, "coursename": "Web aplikacije", "itemname": "Kolokvij 1", "gradeformatted": "5 (100%)", "rawgrade": 95, "rawgrademax": 100 }],
    "materials": [{ "id": 1, "courseid": 101, "section": "Tjedan 1", "name": "Uvod u Laravel", "modname": "resource", "added": 0 }],
    "assignments": [{ "id": 1, "courseid": 101, "coursename": "Web aplikacije", "name": "Laravel CRUD", "duedate": 0, "grade": 10, "intro": "..." }],
    "notifications": []
  }
}
```

Mapiranje u UI modele:

| Iz proxyja | U portalu |
| --- | --- |
| `courses[].id` | `COURSES[].id = "moodle-<id>"` |
| `courses[].completionprogress` | `COURSES[].progress` (grafikon napretka) |
| `grades[].rawgrade / rawgrademax` | `GRADE_HISTORY[].grade` (skala 1–5, zaokruženo) |
| `grades[].itemname`, `coursename` | `GRADE_HISTORY[].name`, `professor` |
| `assignments[].duedate` (Unix s) | `ASSIGNMENTS[].dueISO`, `deadline` |
| `materials[].modname` | `MATERIALS[].type` (`pdf`, `slides`, `link`) |

Napomene:
- `summary` i dalje postoji radi kompatibilnosti sa starijim klijentima.
- Live podaci se ne pohranjuju u `localStorage`; dostupni su samo u memoriji dok je stranica otvorena.
- `TIMETABLE`, `SCRIPTS` i `INBOX` ostaju demo sadržaj ako ih ciljni sustav ne isporuči.

## 9. Preporuke za integraciju

- **Stabilni identifikatori:** koristite stabilne `id` vrijednosti (string ili number dosljedno po tipu entiteta).
- **Datumi:** preferirati ISO format (`YYYY-MM-DD` ili puni ISO datetime) uz zasebna polja za prikaz ako je potrebno.
- **Statusi i enum vrijednosti:** držati se dogovorenih vrijednosti ili osigurati mapiranje.
- **Sigurnost sadržaja:** tekstualna polja koja dolaze izvana tretirati kao nepouzdana (escape/sanitizacija prije prikaza).
- **Minimalni ugovor:** za osnovni prikaz dovoljno je mapirati studenta, kolegije, obveze i obavijesti; ostalo dodavati inkrementalno.

Za praktične korake integracije vidi [`docs/INTEGRATION.md`](INTEGRATION.md).
