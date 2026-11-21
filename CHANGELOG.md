# Changelog

Sve značajnije promjene ovog projekta bilježe se u ovoj datoteci.

Format je informativan i temeljen na [Keep a Changelog](https://keepachangelog.com/) pristupu (prilagođeno projektu).

## [Unreleased]

### Added
- **Priprema za obranu projekta:** `docs/OBRANA.md` s 6-minutnim scenarijem izlaganja, redoslijedom demonstracije, arhitektonskim odlukama, odgovorima na najčešća pitanja (autentikacija, RLS, normalizacija, CRUD, AI alati) i predloškom podjele posla. Bez osobnih imena.
- **Proširena E2E pokrivenost:** planer test sada pokriva i inline uređivanje (dodaj → uredi → završi → reload → obriši), a novi test provjerava print medij (navigacija skrivena, sadržaj vidljiv, animacije isključene). Ukupno 7 Playwright testova.
- **Print prikaz:** dodan je `@media print` sloj koji za A4 ispis skriva navigaciju, zaglavlje, modale i kontrole, uklanja animacije i sjene i zadržava samo sadržaj trenutnog prikaza. Provjereno u Playwrightu (`page.pdf`, bez konzolnih grešaka).
- **Završna projektna dokumentacija:** `docs/USE-CASE.md` (6 aktora, 22 use casea, kritični tokovi i 403 pravila), `docs/PLAN-RASTA.md` (izbor niše, ICP, paketi, PLG petlje, KPI i rizici) i `llms.txt` za AI agente. Time su pokrivene sve isporuke koje su bile ponuđene za 24-modularnu specifikaciju.
- **Sistemska pravila za AI alate:** `AGENTS.md` definira granicu između produkcijske `theme_studia` teme i demo portala, UI/UX i WCAG standarde, sigurnosna pravila (403 na serveru, hashiranje, tajne), normaliziranu bazu i RLS, obavezne provjere prije commita te popis zaštićenih E2E hookova. `.cursorrules` je kratki pokazivač na ista pravila.
- **Arhitektura i SQL shema Student SaaS Platforme:** `docs/ARTITEKTURA.md` opisuje monorepo, 24 modula, RBAC, RLS i faze implementacije; `docs/schema.sql` sadrži 67 normaliziranih tablica, RLS politike po instituciji, RBAC, pgvector indeks, revizijski log i generički seed bez osobnih podataka. Nacrt je neovisan o postojećem demo portalu i ADR-001.
- **Usklađenost sa zahtjevima projekta:** README sada sadrži cilj, korisnike, tim, tehnologije i popis korištenih AI alata; planer ima puni CRUD (dodavanje, uređivanje, završavanje, brisanje) s inline uređivanjem i perzistencijom. Prikazani identitet je generički `user` bez osobnih podataka.
- **Pokret i mikro-interakcije:** postepeni ulazak nadzorne ploče, lagani hero sjaj i klizna akcentna linija, hover reakcije kartica, gumba i brzih veza, animirane obavijesti i planer. Brojači (prosjek, ECTS, zadaće) animiraju se samo pri prvom prikazu, a pozdrav se prilagođava dobu dana. Sve poštuje `prefers-reduced-motion` i koristi isključivo transform/opacity.
- **Live Moodle podaci u portalu:** proxy sada uz `summary` vraća i normalizirani `data`; `assets/js/live-data.js` preslikava ga u `COURSES`, `GRADE_HISTORY`, `MATERIALS`, `ASSIGNMENTS` i obavijesti, pa grafikoni i kartice koriste stvarne Moodle podatke. Povratak u demo način vraća originalni dataset.
- Mock Moodle proxy (`scripts/mock-moodle-proxy.js`, `npm run mock:proxy`) za testiranje live toka bez tokena.
- CI sada pokreće `node scripts/check.mjs` i PHP lint Moodle teme (do sada samo JS sintaksa).
- Osvježene dokumentacijske snimke (`docs/preview.png`, `grades.png`, `materials.png`) s planerom, grafikonima i novim prikazima.
- Lighthouse audit portala: accessibility 1.0 (ispravljen kontrast u tamnom načinu i neusklađena `aria-label` imena).
- Proxy hardening: odbijanje neodobrenih origin-a (403), ograničavanje broja sync zahtjeva (429) i sigurnosna zaglavlja odgovora.
- Automatizirani browser smoke-testovi (Playwright, `npm run test:e2e`) i statički server za testove (`scripts/static-server.js`), sa 7 testova koji se pokreću i u CI-ju.
- **ADR-001 — theme-first integracija** (`docs/DECISIONS.md`): `theme_studia` je jedini produkcijski smjer za SUM; statički portal i proxy su eksplicitno demo/laboratorijski alati.
- Upozorenja u Moodle modalu i dokumentaciji da live proxy nije zamjena za Moodleovu autentifikaciju i autorizaciju.

### Changed
- **Potpuni redizajn „Studia 3” od početka:** cijeli vizualni sloj (`assets/css/style.css`) i struktura nadzorne ploče zamijenjeni su novim sustavom — tamna navigacijska traka, tamni hero s jednim sljedećim rokom, tri odvojena sažetka, violetni primarni i narančasti signalni akcent. Filtari, brze veze i sklopljena arhiva detalja redizajnirani su u novom sustavu klasa uz očuvanje svih ID-ova i testnih hookova. Ista paleta prenesena je u `theme/studia/scss/post.scss`. Lighthouse ostaje 1.0 u svjetlom i tamnom načinu, Playwright 6/6, mobilno bez prelijevanja.
- **Manje navigacijskog šuma:** bočni izbornik ima 7 umjesto 11 stavki (uklonjeni duplicirani profil, planer, Meet i AI unos), a kartice kolegija prikazuju samo kod, naziv, napredak i detalje.
- `README.md`, `docs/INTEGRATION.md`, `docs/PRIVACY.md` i `theme/studia/README.md` reorganizirani oko odluke theme-first (sigurnosni model teme, ograničenja proxyja).

### Fixed
- Lighthouse: nedovoljan kontrast na karticama kolegija i u popisima u tamnom načinu; `aria-label` gumba koji nije sadržavao vidljivi tekst.
- „Moj planer“ u glavnom portalu: dodavanje, završavanje i brisanje osobnih zadataka s opcionalnim rokom, lokalna perzistencija i brzi pristup iz navigacije.
- Favoriti kolegija (zvjezdica na kartici + filtar „Favoriti“), preneseni iz demo-sitea u glavnu aplikaciju.
- Vizualizacije na nadzornoj ploči (`assets/js/charts.js`): kretanje prosjeka ocjena, distribucija ocjena i napredak po kolegijima.
- Ispravka scrolla: `body { overflow-x: clip }` umjesto `hidden` (fallback zadržan).
- Pristupačnost: uklonjen ugniježđeni interaktivni element na kartici kolegija — otvaranje detalja sada ide preko zasebnog gumba „Detalji“ (kartica više nema `role="button"`).
- Hardening: sanitizacija favorita učitanih iz `localStorage` i očuvanje pozicije karusela pri označavanju favorita.
- Smoke-provjere u `scripts/check.mjs`: obavezni HTML ID-ovi, odsutnost dupliciranih ID-ova i redoslijed učitavanja scriptova.
- Integracijska i produkcijska priprema: konfiguracijski sloj (`assets/js/config.js`), primjer konfiguracije, dokumentacija za integraciju, podatkovni model, arhitekturu, privatnost i sigurnost.
- Dokumenti projekta: `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `LICENSE`, `.editorconfig`, `.prettierrc.json`.
- CI workflow za osnovne provjere kvalitete (`.github/workflows/ci.yml`).
- Unaprijeđenja izgleda i dosljednosti sučelja statičkog portala (stilovi, komponente, tamni/svijetli način, responzivnost).

### Changed
- Filteri ocjena grade se dinamički iz dostupnih semestara, pa rade i s live podacima.
- Ažurirani `README.md`, `docs/INTEGRATION.md`, `docs/DATA_MODEL.md` i `server/README.md` za novi live ugovor.
- Ažuriran `README.md` s uputama za integraciju, konfiguraciju i održavanje.
- Ažuriran `.gitignore` i projektne skripte za lakši razvoj i provjere.

### Notes
- `theme/studia/` sadrži Moodle 4.5 (Boost child) temu i dio je repozitorija kao integracijska komponenta.
- Live demo ostaje statički (GitHub Pages: `index.html` + `assets/`); napredne integracije (npr. proxy) ovise o zasebnom okruženju.

## [1.0.0] - 2026-11-18

### Added
- Inicijalni Studia studentski portal: nadzorna ploča, profil, inbox, kolegiji/UniHub, ocjene i ECTS, materijali, obavijesti, zadaće, raspored, Meet sobe, AI demo, Moodle demo/live adapter.
- Responzivan dizajn, light/dark tema, lokalno pohranjivanje stanja i demo podaci.
- GitHub Pages deploy workflow i dokumentacijske snimke zaslona.
