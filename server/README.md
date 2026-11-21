# Studia — Moodle backend proxy

Ovaj mali Node poslužitelj je primjer sigurne integracije s Moodle WebServiceom.
Front-end ga koristi samo u **Live proxy** načinu rada. Moodle token ostaje u
environment varijabli poslužitelja i nikada se ne šalje u preglednik.

## Zahtjevi

- Node.js 18 ili noviji (zbog ugrađenog `fetch`).
- Moodle WebService token za korisnika čije se podatke čitaju.
- U Moodleu omogućen WebService i dopuštene funkcije navedene niže.

## Environment varijable

| Varijabla | Zadano | Opis |
| --- | --- | --- |
| `PORT` | `8787` | Port na kojem proxy sluša. |
| `MOODLE_URL` | `https://eucenje.sum.ba/moodle` | Osnovni URL Moodlea bez završne `/`. |
| `MOODLE_TOKEN` | — | **Obavezno.** Token se čita samo na poslužitelju. |
| `ALLOWED_ORIGIN` | `*` | Origin koji smije zvati API. Za produkciju postavi npr. `https://max55-lab.github.io`. Više domena odvoji zarezom. |
| `STUDIA_MAX_COURSES` | `20` | Najviše kolegija koji se vraćaju u jednom syncu. |
| `STUDIA_MAX_ITEMS` | `60` | Gornja granica po tipu stavki (ocjene, materijali, zadaće) po kolegiju. |

## Pokretanje

PowerShell:

```powershell
cd C:\Users\max\Desktop\SCHOOL_PORTAL
$env:MOODLE_TOKEN = "tvoj_token"
$env:MOODLE_URL = "https://eucenje.sum.ba/moodle"
$env:ALLOWED_ORIGIN = "http://127.0.0.1:5500"
node server/moodle-proxy.js
```

Provjera:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
```

U Studia modalu odaberi **Live proxy** i upisi `http://127.0.0.1:8787`.

## API

### `GET /api/health`

Vraća status proxyja i informaciju je li token postavljen. Token se ne vraća.

```json
{
  "ok": true,
  "service": "studia-moodle-proxy",
  "moodleUrl": "https://eucenje.sum.ba/moodle",
  "moodleConfigured": true,
  "allowedOrigin": "https://max55-lab.github.io"
}
```

### `POST /api/moodle/sync`

Tijelo može biti prazan JSON (`{}`). Proxy koristi Moodle korisnika povezanog s
tokenom. Odgovor koji front-end očekuje:

```json
{
  "ok": true,
  "source": "SUM Moodle · eucenje.sum.ba",
  "syncedAt": "2026-11-18T08:00:00.000Z",
  "user": { "id": 123, "fullname": "Ivan Kovač" },
  "summary": {
    "courses": 5,
    "grades": 10,
    "materials": 25,
    "assignments": 8,
    "notifications": 3
  },
  "data": {
    "courses": [ { "id": 101, "shortname": "SUM-WEB", "fullname": "Web aplikacije", "completionprogress": 75 } ],
    "grades": [ { "id": 1, "courseid": 101, "itemname": "Kolokvij 1", "rawgrade": 95, "rawgrademax": 100 } ],
    "materials": [ { "id": 1, "courseid": 101, "name": "Uvod u Laravel", "modname": "resource", "added": 0 } ],
    "assignments": [ { "id": 1, "courseid": 101, "name": "Laravel CRUD", "duedate": 0, "grade": 10 } ],
    "notifications": []
  }
}
```

`summary` zadržan je zbog kompatibilnosti. `data` je normalizirani payload koji front-end (`assets/js/live-data.js`) preslikava u svoje modele — nakon sinkronizacije kartice, ocjene i grafikoni prikazuju stvarne Moodle podatke. Ako proxy ne vrati `data`, portal i dalje radi s demo podacima.

Kod greške proxy vraća HTTP 502 i `{ "ok": false, "error": "..." }`.

## Korištene Moodle funkcije

| Funkcija | Svrha |
| --- | --- |
| `core_webservice_get_site_info` | Provjera tokena i Moodle korisnik. |
| `core_enrol_get_users_courses` | Popis kolegija korisnika. |
| `gradereport_user_get_grade_items` | Broj ocjenskih stavki (best effort). |
| `core_completion_get_course_completion_status` | Completion po kolegiju (best effort) → `progress` u grafikonu. |
| `core_course_get_contents` | Materijali iz sekcija kolegija (best effort). |
| `mod_assign_get_assignments` | Zadaće i rokovi (best effort). |

Obavijesti se grade lokalno iz najbližih rokova i posljednjih ocjena — ne
koristi se `core_message_get_unread_conversation_counts`.

Pojedine funkcije ovise o Moodle verziji, dopuštenjima uloge i postavkama
WebServicea. Proxy namjerno hvata greške pojedinih funkcija i vraća djelomični
sažetak umjesto da cijela sinkronizacija padne. Ako `gradereport_user_get_grade_items`
nije dopušten, ocjene izostanu, ali kolegiji i zadaće se i dalje prikažu.

## Sigurnost

- Token se **nikada** ne vraća klijentu, ne logira se i ne pohranjuje u
  `localStorage`.
- U produkciji obavezno koristi HTTPS i suzi `ALLOWED_ORIGIN` na stvarnu domenu.
- Ne commituj `.env` ni token u repozitorij. Na hostingu ga postavi kroz
  environment varijable.
- Proxy je primjer, ne potpuni autentifikacijski sloj. Ako ga izlažeš javno,
  dodaj provjeru prijave, rate limiting i reviziju dopuštenih Moodle funkcija.
- GitHub Pages je statični hosting i ne može izvršavati ovaj proxy. Za live način
  koristi Render, Railway, Fly.io, VPS ili drugi Node hosting.

## Proširenje

Za pravu produkciju preporučeno je:

1. dodati prijavu i vezati Moodle korisnika na sesiju,
2. ~~normalizirati kolegije, zadaće i materijale u oblik koji front-end koristi~~ — napravljeno kroz `data` + `assets/js/live-data.js`,
3. povlačiti ocjene i ECTS iz Studomata / ISVU ako su dostupni (Moodle WS ne vraća ECTS, pa se u live načinu koristi zadanih 6),
4. dodati cache i periodičnu sinkronizaciju umjesto poziva na svaki klik,
5. dodati status predaje zadaće (`mod_assign_get_submission_status`) — trenutno su sve live zadaće označene kao `active`,

Za testiranje bez Moodle tokena pokreni `node scripts/mock-moodle-proxy.js` (port `8788`) i upisi `http://127.0.0.1:8788` u Studia modal.
