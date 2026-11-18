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
  }
}
```

Kod greške proxy vraća HTTP 502 i `{ "ok": false, "error": "..." }`.

## Korištene Moodle funkcije

| Funkcija | Svrha |
| --- | --- |
| `core_webservice_get_site_info` | Provjera tokena i Moodle korisnik. |
| `core_enrol_get_users_courses` | Popis kolegija korisnika. |
| `gradereport_user_get_grade_items` | Broj ocjenskih stavki (best effort). |
| `core_course_get_contents` | Broj materijala u kolegijima (best effort). |
| `mod_assign_get_assignments` | Broj zadaća (best effort). |
| `core_message_get_unread_conversation_counts` | Broj nepročitanih poruka (best effort). |

Pojedine funkcije ovise o Moodle verziji, dopuštenjima uloge i postavkama
WebServicea. Proxy namjerno hvata greške pojedinih funkcija i vraća djelomični
sažetak umjesto da cijela sinkronizacija padne.

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
2. normalizirati kolegije, zadaće i materijale u oblik koji front-end koristi,
3. povlačiti ocjene i ECTS iz Studomata / ISVU ako su dostupni,
4. dodati cache i periodičnu sinkronizaciju umjesto poziva na svaki klik.
