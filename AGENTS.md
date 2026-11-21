# AGENTS.md — pravila za AI alate i developere

Ovo su obvezna pravila za Claude Code, Cursor, Copilot, ChatGPT i svakog developera
koji mijenja ovaj repozitorij. AI je dopušten i poželjan za planiranje, generiranje i
objašnjavanje koda, razvoj sučelja, otklanjanje pogrešaka, testiranje i dokumentaciju —
ali svaku generiranu izmjenu čovjek mora razumjeti, provjeriti i moći obraniti.

## 0. Prvo pročitaj

Prije bilo koje izmjene pročitaj, redom:

1. [`docs/DECISIONS.md`](docs/DECISIONS.md) — ADR-001 theme-first (autoritetna odluka).
2. [`README.md`](README.md) — namjena projekta, tehnologije, korišteni AI alati.
3. [`docs/ARTITEKTURA.md`](docs/ARTITEKTURA.md) i [`docs/schema.sql`](docs/schema.sql) — ciljni 24-modularni nacrt.
4. [`CHANGELOG.md`](CHANGELOG.md) — što je nedavno promijenjeno.

**Granica ovlaštenja:** `theme_studia` je jedini produkcijski smjer za SUM. Statički
portal (`index.html`, `assets/`) i `server/moodle-proxy.js` su demo/laboratorijski
alati. Ne dodavati stvarnu autentikaciju, tokene, prava ni prave studentske podatke
u demo. 24-modularni monorepo iz `docs/` je **zaseban konceptualni nacrt**; prelazak
na njega zahtijeva novu ADR odluku.

---

## 1. Vizualni identitet i UI/UX

- **Bento / Linear estetika:** čista mreža, visok kontrast tipografije, minimalan šum.
- **Tamna tema:** tamne nijanse sive i plave, **nikad čista crna `#000000`**; obrubi
  `1px` (`border-white/10` ili ekvivalent); suptilni gradijenti za metrike i grafikone.
- **Hijerarhija boja:** ~90% neutralna podloga, ~9% sekundarni elementi (obrubi,
  ikone, labele), ~1% primarna brend boja isključivo za ključne CTA radnje.
- **Sidebar:** 240–260 px, opcija sažimanja, workspace switcher na vrhu, profil,
  status paketa/uloge i vidljiv `Logout`.
- **Tipografija:** Inter / Geist / Plus Jakarta Sans; brojevi, cijene i tablice
  koriste `tabular-nums` da ne „plešu" pri osvježavanju.
- **Command Palette:** `Ctrl+K` / `Cmd+K` za pretragu i brze akcije; tipku `?`
  koristiti za šalabahter prečaca. Ne duplicirati već postojeću pretragu ni palette.
- **Stanja:** svaka lista ima skeleton loader i dizajnirani Empty State s jednim CTA.
- **Responzivnost:** 360 px mobil do 4K, bez horizontalnog prelijevanja.

## 2. Animacije, performanse i pristupačnost

- **Zlatno pravilo:** animirati **samo `transform` i `opacity`**. Nikad `width`,
  `height`, `top`, `left` ni `margin` (layout thrashing).
- **Pokret:** glatki prijelazi, mikro-potvrde, `shake` na grešku, suptilni spotlight
  na hoveru; scroll-driven efekti samo gdje imaju smisla.
- **`prefers-reduced-motion`: obavezan.** Agresivan pokret zamijeniti blagim
  prijelazom prozirnosti; u reduced načinu brojači prikazuju odmah konačnu vrijednost.
- **WCAG:** nema bljeskanja bržeg od 3 Hz; svaki automatski pokret dulji od 5 s ima
  kontrolu za pauzu i pauzira se na hover/fokus; dekorativni elementi imaju
  `aria-hidden="true"`; jasan `:focus-visible`; focus trap u modalima i povrat fokusa
  po zatvaranju. Cilj: Lighthouse pristupačnost **1.0**.

## 3. Sigurnost i ovlasti

- **Autorizacija isključivo na poslužitelju.** Sakrivanje gumba u UI-ju nije
  autorizacija. Svaka zaštićena ruta prvo provjerava identitet, zatim ulogu/dozvolu.
  Nedozvoljen pristup vraća **HTTP 403 Forbidden** s jasnom porukom.
- **Najmanje četiri uloge:** `SuperAdmin`, `Administrator`, `Običan korisnik`, `Gost`
  (ciljni model ima šest: SuperAdmin, FacultyModerator, CourseLead, StudentPro,
  StudentFree, GuestViewer). Dozvole se nikad ne izvode iz klijenta.
- **Lozinke:** uvijek hash (Argon2id/bcrypt), nikad čisti tekst. Sesije, CSRF za
  mutacije, strogi CORS, CSP, HSTS, rate limiting, enkripcija osjetljivih polja.
- **Tajne:** nema lozinki, API ključeva, tokena ni osobnih podataka u repozitoriju
  ni u AI upitima. Demo identitet je generički `user` (`user@demo.sum.ba`).
- **U produkcijskoj temi:** autentikacija i ovlasti dolaze iz Moodlea
  (`require_login()`, capabilityji, `require_sesskey()`). Ne graditi paralelni login.

## 4. Baza podataka i ER model

- **Normalizacija:** najmanje 5 povezanih tablica; nikad zasebne tablice po tipu
  korisnika. Identitet je `users` + normalizirane `roles`, `permissions`,
  `role_permissions`, `user_roles` (pogledati `docs/schema.sql`).
- **Relacije:** barem jedan `FOREIGN KEY`; many-to-many kroz prelazne tablice.
- **Brisanje:** preferirati meko brisanje (`deleted_at` / `status`). `UPDATE` i
  `DELETE` uvijek imaju `WHERE`.
- **Multi-tenancy:** svaki upit postavlja `app.set_tenant_context(...)` unutar
  transakcije; RLS politike izoliraju podatke po instituciji i u bazi.
- **Promjene sheme:** nova migracija u `infra/migrations/`, nikad ad-hoc DDL u
  aplikacijskom kodu. Uz migraciju dodati seed i E2E test kritičnog toka.

## 5. Arhitektura koda

- **MVC / servisi:** poslovna logika i upiti u modelima i servisima, ne u viewima.
- **Ciljni monorepo:** `apps/web`, `apps/api`, `apps/admin`, `apps/worker`, `apps/status`
  + paketi `@app/ui`, `@app/db`, `@app/validators`, `@app/ai`, `@app/config`, `@app/auth`,
  `@app/telemetry`. Zod je jedini izvor istine za validaciju; tipovi idu od baze do gumba.
- **Postojeći demo:** vanilla JS moduli (`core.js`, `data.js`, `render.js`, `app.js`,
  `views.js`) i custom CSS. Ne uvoditi React/Tailwind rebuild bez nove ADR odluke.
- **Ne duplicirati:** teme, modale, tabove ni pretragu — proširiti postojeće.
- **Testni hookovi:** čuvati sve E2E ID-ove (`focus-heading`, `focus-average`,
  `focus-ects`, `focus-tasks`, `dashboard-more`, `quick-tasks-grid`, `courses-carousel`,
  `course-filter-pills`, `global-search-input`, `search-results-panel`, `planner-section`,
  `planner-form`, `planner-input`, `chart-grade-trend`, `chart-grade-donut`,
  `chart-course-progress`, `header-sync-text`, `assignments-nav-badge`, `inbox-badge`,
  `notification-badge`).

## 6. Funkcionalnosti (cilj ≥10 od 13)

Pretraživanje · višestruki filteri (≥3 uvjeta) · upload uz validaciju tipa i veličine ·
integracija vanjskog servisa · AJAX/`fetch` bez reloadanja · moderni JS/UI ·
interaktivni alati (datepicker, drag-and-drop) · WYSIWYG uređivač · upravljanje
korisnicima · print prikaz (`@media print`) · web košarica/narudžbe · MVC okvir ·
Git s čistim commitovima. U demu su već pokriveni pretraga, filteri, planer s punim
CRUD-om, favoriti, grafikoni, izvoz i AJAX sinkronizacija.

## 7. Produkcija, SEO i deploy

- Javni dio: jasna ponuda, čista semantika, `llms.txt`, struktura pogodna za
  pretraživače i AI agente.
- URL-driven state za filtere, tabove i modale gdje ima smisla; `aria-label` za akcije.
- Idempotency keys na kritičnim radnjama i plaćanjima; kontrola troškova i botova.
- Deploy putem SSH-a na ciljni poslužitelj (`studenti.sum.ba`, dodijeljena putanja).
- Dokumentacija: README s opisom, funkcionalnostima, tehnologijama, pokretanjem i
  popisom AI alata; ADR, ER opis i Use Case opisi.

## 8. Definition of done — obavezne provjere

Prije svakog commita, u ovom redoslijedu:

```powershell
node scripts/check.mjs
node node_modules/@playwright/test/cli.js test
```

Dodatno, kod vizualnih promjena: Lighthouse u svijetlom i tamnom načinu (cilj 1.0/1.0/1.0),
provjera mobilnog prelijevanja (0 px), 0 konzolnih grešaka i osvježen `docs/preview.png`.
Za promjene sheme: strukturna provjera SQL-a i pokretanje seeda na testnoj bazi.

## 9. Radni ritam

1. Razumjeti postojeće stanje (`git status`, relevantni fileovi) prije pisanja.
2. Najmanja izmjena koja potpuno rješava zahtjev — bez YAGNI slojeva.
3. Objasniti ključne arhitektonske odluke kratko i jasno.
4. Ne ostavljati `// TODO`, nedovršene sigurnosne provjere ni placeholder komentare.
5. Commit s jasnom porukom, push na `main`, kratak izvještaj: što je napravljeno,
   provjere, preskočeno, rizik.
6. AI alat i njegovi tipični zadaci navode se u `README.md`.
