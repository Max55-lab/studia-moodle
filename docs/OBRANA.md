# Priprema za obranu projekta (5–7 minuta)

Generički scenarij bez osobnih imena. Namijenjen je studentima koji brane Studia
portal; svaki član tima treba samostalno moći objasniti svoj doprinos.

---

## 1. Struktura izlaganja (6 minuta)

| Vrijeme | Što reći | Gdje pokazati |
| --- | --- | --- |
| 0:00–0:40 | Problem i cilj: podaci o kolegijima, ocjenama, rokovima i materijalima razasuti su po više sustava. Cilj je jedan pregledan Studentski portal. | `README.md` → *O projektu* |
| 0:40–1:20 | Korisnici i opseg: studenti; nastavnici koriste nativnu Moodle temu. Demo koristi izmišljene podatke i generičkog `user`. | `index.html` — nadzorna ploča |
| 1:20–2:20 | Arhitektura: statički portal + demo proxy + produkcijska tema `theme_studia`. ADR-001 objašnjava zašto autentikacija ostaje u Moodleu. | `docs/DECISIONS.md` |
| 2:20–3:40 | Funkcionalnosti: fokus nadzorne ploče, pretraga, filteri, planer s CRUD-om, favoriti, grafikoni, export, tamni način, live sinkronizacija. | demonstracija uživo |
| 3:40–4:30 | Podaci i baza: demo u `localStorage` i `data.js`; ciljni model u `docs/schema.sql` — 67 tablica, RLS, RBAC, pgvector. | `docs/schema.sql` |
| 4:30–5:30 | Kvaliteta: `node scripts/check.mjs`, 7 Playwright testova, Lighthouse 1.0/1.0/1.0, 0 konzolnih grešaka, mobilno bez prelijevanja. | terminal / CI |
| 5:30–6:00 | Ograničenja i sljedeći korak: nema prave baze ni prijave u demu; za produkciju je potrebna nova ADR odluka. | `docs/ARTITEKTURA.md` |

---

## 2. Redoslijed demonstracije uživo

1. **Nadzorna ploča** — pokaži samo sljedeći rok, prosjek, ECTS i broj zadaća.
   Otvori `<details id="dashboard-more">` da pokažeš da je ostatak arhive sklopljen.
2. **Planer (CRUD)** — dodaj zadatak, klikni olovku, uredi naziv, Enter za spremanje,
   označi kao dovršen, reload, pa obriši. Istakni perzistenciju u `localStorage`.
3. **Kolegiji i favoriti** — označi kolegij favoritom, uključi filtar „Favoriti", reload.
4. **Pretraga i filteri** — upiši u `#global-search-input`, pokaži rezultate i `Esc`.
   `Ctrl+K` fokusira istu pretragu bez dupliciranja palete.
5. **Grafikoni** — kretanje prosjeka, distribucija ocjena, napredak po kolegijima (inline SVG).
6. **Tamni način** — prebaci temu i reload da pokažeš da se postavka pamti.
7. **Live demo sinkronizacija** — pokreni `node scripts/mock-moodle-proxy.js`, u modalu
   uključi live na `http://127.0.0.1:8788`, pa se vrati u demo način.
8. **Print** — `Ctrl+P`, pokaži da ispis nema navigacije ni gumba.

Ako nešto ne radi uživo, imaj spremnu snimku `docs/preview.png`.

---

## 3. Ključne arhitektonske odluke (što reći)

- **ADR-001, theme-first:** produkcijski smjer je Moodle child tema `theme_studia`.
  Portal i `server/moodle-proxy.js` su isključivo demo/laboratorij. Time izbjegavamo
  vlastitu prijavu, tokene i novu površinu napada.
- **Bez novih ovisnosti:** izmjene su u HTML-u, vlastitom CSS-u i vanilla JS modulima
  (`core.js`, `data.js`, `render.js`, `views.js`, `app.js`). Tailwind je već bio u projektu.
- **Stabilni hookovi:** svi E2E ID-ovi su očuvani, pa postoji 7 automatiziranih testova.
- **Animacije:** samo `transform` i `opacity`, uz `prefers-reduced-motion`; brojači u
  reduced načinu prikazuju odmah konačnu vrijednost. Lighthouse pristupačnost ostaje 1.0.
- **Dizajn artefakti za enterprise verziju:** `AGENTS.md`, `docs/ARTITEKTURA.md`,
  `docs/schema.sql`, `docs/USE-CASE.md` i `docs/PLAN-RASTA.md` opisuju ciljni sustav,
  ali ga ne pretvaraju u ovaj demo.

---

## 4. Najvjerojatnija pitanja i kratki odgovori

**Zašto nema prave baze podataka?**
Zato što je javni demo na GitHub Pagesu — statički hosting nema server. Demo stanje
(planer, favoriti, tema) sprema se u `localStorage`. Ciljni model s PostgreSQL-om,
RLS-om i migracijama opisan je u `docs/schema.sql` i nije dio produkcijskog smjera
iz ADR-001.

**Kako je riješena autentikacija i autorizacija?**
U produkciji ih u potpunosti pruža Moodle: `require_login()`, uloge, capabilityji i
`require_sesskey()`. U demu nema prijave jer nema pravih podataka. U ciljnom modelu
svaka zaštićena ruta prvo provjerava identitet, zatim dozvolu, a neovlašten pristup
vraća HTTP 403 — skrivanje gumba nije autorizacija.

**Je li baza normalizirana? Koliko ima tablica i stranih ključeva?**
Ciljna shema ima 67 tablica u shemi `app`. Korisnik je u jednoj tablici `users`, a
uloge i dozvole u normaliziranim tablicama `roles`, `permissions`, `role_permissions`
i `user_roles`. Svaka tablica ima `id` kao primarni ključ i najmanje jedan `FOREIGN KEY`
gdje god postoji vlasništvo; mnogo-na-mnogo veze idu kroz prelazne tablice.

**Što je RLS i zašto je bitan?**
Row-Level Security je PostgreSQL mehanizam koji na razini baze ograničava redove koje
korisnik vidi. Svaki upit postavi `app.set_tenant_context(...)` u transakciji, a
politika dopušta samo redove iste institucije. Time se izolacija ne oslanja samo na
kod aplikacije.

**Koje CRUD operacije postoje u demu?**
Planer ima sve četiri: dodavanje, uređivanje (inline polje, Enter sprema, Escape
odustaje), označavanje dovršenim i brisanje, uz perzistenciju. Favoriti kolegija imaju
dodavanje/uklanjanje i filtar.

**Koji AI alati su korišteni i kako je provjerena sigurnost?**
Claude u OpenCode okruženju korišten je za dizajn, kod, testove i dokumentaciju
(navedeno u README-u). Sav AI-generirani kod ručno je pregledan i provjeren kroz
`check`, Playwright i Lighthouse. U repozitoriju nema lozinki, tokena ni osobnih
podataka; prikazani identitet je `user`.

**Kako se aplikacija pokreće i objavljuje?**
Lokalno: statički server na `assets/` i `node scripts/mock-moodle-proxy.js` za demo
live tok. Provjere: `node scripts/check.mjs` i `node node_modules/@playwright/test/cli.js test`.
Objava je GitHub Pages iz `main`, a repozitorij je Javni link u README-u.

**Što bi bio sljedeći korak?**
Nova ADR odluka, pa zaseban monorepo s PostgreSQL-om, pravom prijavom, Redis redovima
i nadzorom — prema `docs/ARTITEKTURA.md`, u pet faza.

---

## 5. Praktična izmjena po zahtjevu nastavnika — kako se pripremiti

- Znaš gdje su podaci: `assets/js/data.js` (`STUDENT`, `COURSES`, `MATERIALS`, ...).
- Znaš gdje se crta sučelje: `assets/js/render.js`.
- Znaš gdje su događaji: `assets/js/app.js` (`handleDocumentClick`, `handleKeydown`).
- Znaš gdje su boje i animacije: `assets/css/style.css`.
- Poslije izmjene pokreni `node scripts/check.mjs` i Playwright testove.

---

## 6. Podjela posla (uprati prije predaje)

- **Član 1 — dizajn i frontend:** `index.html`, `assets/css/style.css`, `render.js`,
  vizualne provjere i `docs/preview.png`.
- **Član 2 — podaci i integracija:** `data.js`, `core.js`, `app.js`, `server/`, testovi
  i dokumentacija.

Oba člana moraju znati cijeli tok demonstracije i odgovoriti na pitanja iz odjeljka 4.
Imena i individualne doprinose upisati u `README.md` prije predaje.
