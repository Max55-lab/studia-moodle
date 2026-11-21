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
