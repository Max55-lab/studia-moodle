# Changelog

Sve značajnije promjene ovog projekta bilježe se u ovoj datoteci.

Format je informativan i temeljen na [Keep a Changelog](https://keepachangelog.com/) pristupu (prilagođeno projektu).

## [Unreleased]

### Added
- **Live Moodle podaci u portalu:** proxy sada uz `summary` vraća i normalizirani `data`; `assets/js/live-data.js` preslikava ga u `COURSES`, `GRADE_HISTORY`, `MATERIALS`, `ASSIGNMENTS` i obavijesti, pa grafikoni i kartice koriste stvarne Moodle podatke. Povratak u demo način vraća originalni dataset.
- Mock Moodle proxy (`scripts/mock-moodle-proxy.js`, `npm run mock:proxy`) za testiranje live toka bez tokena.
- CI sada pokreće `node scripts/check.mjs` i PHP lint Moodle teme (do sada samo JS sintaksa).
- Osvježene dokumentacijske snimke (`docs/preview.png`, `grades.png`, `materials.png`) s planerom, grafikonima i novim prikazima.
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
