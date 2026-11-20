# Arhitektura

Pregled arhitekture Studia repozitorija i preporuke za održavanje/integraciju.

## 1. Komponente repozitorija

- **Statički portal (glavna aplikacija):** `index.html` + `assets/`
  - Namjena: live demo i temelj za front-end integracije.
  - Deploy: GitHub Pages objavljuje `index.html` i `assets/` (vidi `.github/workflows/deploy.yml`).
- **Moodle tema:** `theme/studia/`
  - Boost child tema za Moodle 4.5; koristi nativne Moodle mehanizme (sesija, capability, user preferences).
- **Proxy primjer:** `server/`
  - Node.js proxy za live Moodle pozive bez izlaganja tokena klijentu.

## 2. Front-end struktura

### Ulaz i prikaz
- `index.html`: struktura svih pogleda, modala i sidrnih elemenata.
- `assets/css/style.css`: prilagođeni stilovi, animacije, pristupačnost i dorade.
- `assets/css/tailwind.css`: generirani Tailwind CSS (build artefakt).

### JavaScript moduli (redoslijed učitavanja)
1. `assets/js/config.js` — runtime konfiguracija i integracijski namespace (`window.STUDIA_CONFIG`, `window.Studia`).
2. `assets/vendor/lucide.min.js` — ikone.
3. `assets/js/data.js` — demo podaci i konstante.
4. `assets/js/core.js` — zajedničko stanje, pomoćne funkcije, tema, navigacija, modali, pohrana, pretraga.
5. `assets/js/render.js` — render funkcije za većinu pogleda/lista/sažetaka.
6. `assets/js/views.js` — raspored, Meet sobe, oglasi, kalendar i kompozitni render.
7. `assets/js/moodle-api.js` — demo/live Moodle adapter.
8. `assets/js/app.js` — događaji, akcije korisnika, tokovi i inicijalizacija (`init`).

### Tijek podataka (pojednostavljeno)
- **Izvor:** demo konstante u `data.js` (ili prilagođeni izvor u integraciji).
- **Stanje:** `state` u `core.js` (filteri, odabiri, radne kopije, postavke).
- **Render:** funkcije u `render.js`/`views.js` ažuriraju DOM na temelju stanja i podataka.
- **Interakcije:** `app.js` veže evente i poziva promjene stanja + render + persist.
- **Persistencija:** `localStorage` za preferencije i demo stanje (gdje je omogućeno).

## 3. Konfiguracija i integracijske točke

- **`window.STUDIA_CONFIG`**: centralna točka za branding, značajke, linkove, hookove i integracijske postavke.
- **`window.Studia`**: javni namespace za pristup konfiguraciji i pomoćnim integracijskim metodama.
- **Adapteri:** Moodle adapter je izdvojen (`moodle-api.js`); dodatni adapteri mogu se uvoditi kroz integracijski sloj.
- **Podatkovni ugovor:** vidi `docs/DATA_MODEL.md`.

## 4. Build i isporuka

- **Tailwind:** izvor `assets/css/tailwind.src.css` -> izlaz `assets/css/tailwind.css` (`npm run build:css`).
- **GitHub Pages:** workflow kopira samo `index.html` i `assets/` u artefakt deploya.
- **Proxy:** zaseban Node proces (`server/moodle-proxy.js`), deploya se neovisno o statičkom hostingu.

## 5. Preporuke za daljnji razvoj

- **Modularizacija:** postupno izdvajati domenske module (npr. grades, materials, notifications) i smanjivati globalno stanje.
- **Testabilnost:** izdvajati čistu logiku (filtriranje, izračuni, mapiranja) u funkcije pogodne za unit testove.
- **Ugovori:** verzionirati i dokumentirati konfiguraciju i podatkovni model pri svakoj promjeni.
- **Sigurnost:** sve vanjske podatke tretirati kao nepouzdane; autentikaciju/ovlasti rješavati na poslužitelju.
- **Performanse:** pratiti veličinu bundla/skripti i optimizirati render pri rastu podataka.
