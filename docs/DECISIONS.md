# Arhitektonske odluke (ADR)

## ADR-001 — Theme-first integracija sa SUM-om

**Status:** prihvaćeno · **Datum:** 2026-11-21

### Kontekst

Statički portal Studia ima demo podatke i eksperimentalni Moodle proxy koji
zahtijeva poslužiteljski token. Za ozbiljnu integraciju sa SUM-ovim sustavima
bilo bi potrebno dodatno razraditi:

- autentifikaciju korisnika (tko smije pristupiti podacima),
- autorizaciju (koje podatke i radnje pojedina uloga smije vidjeti),
- integracije sa stvarnim izvorima podataka (Moodle, Studomat/ISVU, EduID).

Svaki od tih slojeva uvodi novu površinu napada: nove endpointa, token, CORS
pravila, sesije i sinhronizacijske poslužitelje. To je rizik koji za ovaj
projekt nije opravdan.

### Odluka

**Primarni i jedini produkcijski smjer je `theme_studia` — nativna tema za
Moodle 4.5.** Integracija se oslanja isključivo na mehanizme koje Moodle već
ima:

| Potreba | Rješenje u temi |
| --- | --- |
| Prijava korisnika | Moodleova prijava (nema vlastite login stranice) |
| Autorizacija | Moodle uloge, capabilityji i `require_login()` |
| Podaci | Moodleova baza i njegovi rendereri / templatei |
| Tokeni | Ne postoje — nema vanjskog REST klijenta ni tokena |
| Korisne postavke | Moodle user preference + `require_sesskey()` pri promjeni |
| Podaci u pregledniku | Nema osjetljivih podataka u `localStorage` |

Statički portal i `server/moodle-proxy.js` ostaju **demo / laboratorijski
prototip**. Njih koristimo za razvoj sučelja, prezentaciju i testiranje toka
podataka s izmišljenim podacima (`scripts/mock-moodle-proxy.js`). Ne smiju se
koristiti s pravim studentskim podacima ni s pravim Moodle tokenom u
produkciji.

### Posljedice

- Sav novi razvoj integracije ide u `theme/studia/` (SCSS, Mustache, renderer,
  AMD modul), ne u novi backend ni u novi API.
- Proxy je eksplicitno označen kao demo u kodu, UI-u i dokumentaciji; novi
  sigurnosni zahtjevi (revizija endpointa, WAF, rate limiting) nisu zamjena za
  Moodleov sigurnosni model.
- Testovi i CI i dalje pokrivaju oba dijela, ali se smoke-test proxyja koristi
  samo s mock podacima.
- Ako se u budućnosti ipak krene u vanjsku integraciju, potrebna je nova ADR
  koja razmatra EduID/OAuth, reviziju i pravni okvir obrade osobnih podataka.

### Vezani dokumenti

- [`theme/studia/README.md`](../theme/studia/README.md) — instalacija i sigurnosni model teme
- [`INTEGRATION.md`](INTEGRATION.md) — integracijski putovi
- [`PRIVACY.md`](PRIVACY.md) — obrada podataka

---

## ADR-002 — Referentni poslužitelj za server-side autorizaciju i pravu bazu

**Status:** prihvaćeno · **Datum:** 2026-11-21

### Kontekst

Zahtjev predmeta traži server-side autorizaciju (HTTP 403), trajnu pohranu u
pravoj bazi i najmanje četiri uloge. ADR-001 i dalje vrijedi za produkcijski
smjer Sveučilišta u Mostaru (`theme_studia` + Moodle), pa se ti zahtjevi **ne smiju**
riješiti dodavanjem vlastite prijave u statički demo portal ni u
`server/moodle-proxy.js`.

Postoji potreba za izvedivim, provjerljivim artefaktom koji pokazuje kako bi
izgledao sigurnosni sloj ciljnog sustava iz `docs/ARTITEKTURA.md` i
`docs/schema.sql`, bez mijenjanja produkcijskog smjera i bez novih ovisnosti
(okruženje nema dopuštenje za `npm install`, PostgreSQL ni Docker).

### Odluka

Dodaje se **zasebna referentna implementacija** u `server/reference/`:

- **Isključivo ugrađeni Node moduli:** `node:sqlite` (trajna baza), `node:http`
  (HTTP poslužitelj), `node:crypto` (scrypt hash, sesije, CSRF). Nema novih
  paketa, nema mrežne instalacije.
- **Prava baza:** SQLite datoteka s relacijama, `FOREIGN KEY` i normaliziranim
  `users` / `roles` / `permissions` / `role_permissions` / `user_roles` /
  `sessions` / `materials` / `audit_logs`. To je izvodivi pandan dijela
  PostgreSQL sheme iz `docs/schema.sql`.
- **Autorizacija na poslužitelju:** svaka zaštićena ruta prvo dohvaća identitet
  iz sesije, zatim provjerava dozvolu; neovlašten pristup vraća **403 Forbidden**
  s jasnom porukom. Skrivanje gumba u klijentu nikad nije autorizacija.
- **Sigurnost:** hashirane lozinke (scrypt + salt), tokeni sesija pohranjeni kao
  SHA-256 digesti, CSRF token obavezan za mutacije, striktni CORS, CSP, HSTS i
  jednostavno ograničavanje broja pokušaja prijave.
- **Više stanara (tenanti):** institucija se uvijek izvodi iz prijavljene sesije,
  nikad iz tijela zahtjeva. Upiti filtriraju po `institution_id`; u PostgreSQL
  varijanti tu ulogu ima RLS s `app.set_tenant_context(...)`.
- **Generički podaci:** samo izmišljeni korisnici (`@demo.sum.ba`,
  `@demo.other.ba`) i jednak demo password naveden u dokumentaciji. Nema pravih
  studentskih podataka ni tajni.

### Posljedice

- `theme_studia` ostaje **jedini produkcijski smjer** za SUM (ADR-001 ne mijenja
  se). Referentni API nije spojen na statički portal ni na demo proxy.
- Referentni poslužitelj služi za obranu predmeta, testove i kao most prema
  budućoj PostgreSQL implementaciji iz faza 1–5 `docs/ARTITEKTURA.md`.
- Prelazak referentnog API-ja u produkciju zahtijeva novu ADR odluku, pravni
  okvir obrade podataka i stvarni Moodle/EduID identitet.
- Testovi (`tests/api/reference-api.test.js`) idu u `node scripts/check.mjs`,
  ali ne utječu na E2E testove demo portala ni na njegove hookove.

### Vezani dokumenti

- [`server/reference/README.md`](../server/reference/README.md) — pokretanje i endpointi
- [`USE-CASE.md`](USE-CASE.md) — 403 pravila i tokovi
- [`schema.sql`](schema.sql) — ciljna PostgreSQL shema (RLS, RBAC)
