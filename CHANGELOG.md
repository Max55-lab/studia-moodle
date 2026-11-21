# Changelog

Sve značajnije promjene ovog projekta bilježe se u ovoj datoteci.

Format je informativan i temeljen na [Keep a Changelog](https://keepachangelog.com/) pristupu (prilagođeno projektu).

## [Unreleased]

### Added
- „Moj planer“ u glavnom portalu: dodavanje, završavanje i brisanje osobnih zadataka s opcionalnim rokom, lokalna perzistencija i brzi pristup iz navigacije.
- Favoriti kolegija (zvjezdica na kartici + filtar „Favoriti“), preneseni iz demo-sitea u glavnu aplikaciju.
- Vizualizacije na nadzornoj ploči (`assets/js/charts.js`): kretanje prosjeka ocjena, distribucija ocjena i napredak po kolegijima.
- Ispravka scrolla: `body { overflow-x: clip }` umjesto `hidden` (fallback zadržan).
- Integracijska i produkcijska priprema: konfiguracijski sloj (`assets/js/config.js`), primjer konfiguracije, dokumentacija za integraciju, podatkovni model, arhitekturu, privatnost i sigurnost.
- Dokumenti projekta: `CONTRIBUTING.md`, `CHANGELOG.md`, `SECURITY.md`, `LICENSE`, `.editorconfig`, `.prettierrc.json`.
- CI workflow za osnovne provjere kvalitete (`.github/workflows/ci.yml`).
- Unaprijeđenja izgleda i dosljednosti sučelja statičkog portala (stilovi, komponente, tamni/svijetli način, responzivnost).

### Changed
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
