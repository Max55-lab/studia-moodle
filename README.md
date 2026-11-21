# Studia — studentski portal, demo i integracijska osnova

[![Deploy na GitHub Pages](https://github.com/Max55-lab/studia-moodle/actions/workflows/deploy.yml/badge.svg)](https://github.com/Max55-lab/studia-moodle/actions/workflows/deploy.yml)
[![CI](https://github.com/Max55-lab/studia-moodle/actions/workflows/ci.yml/badge.svg)](https://github.com/Max55-lab/studia-moodle/actions/workflows/ci.yml)

**Studia** je responzivni studentski portal (demo) inspiriran SUM e-učenjem, s naglaskom na preglednom sučelju, lokalnoj demo interaktivnosti i pripremi za prilagodbu/integraciju u druge sustave.

**Live demo:** <https://max55-lab.github.io/studia-moodle/>

![Pregled nadzorne ploče](docs/preview.png)

> Demo koristi isključivo izmišljene podatke i ne provodi stvarnu autentikaciju. Live demo na GitHub Pages servira statički sadržaj (`index.html` + `assets/`).

## Što je uključeno u repozitorij

- **Web portal (statički demo):** `index.html`, `assets/` — glavni preglednik demo aplikacije.
- **Moodle tema:** `theme/studia/` — Boost child tema za Moodle 4.5 (nativna Moodle autentikacija/ovlasti, user preferences, SCSS/templejti).
- **Moodle proxy primjer:** `server/` — Node.js proxy za live sinkronizaciju bez izlaganja tokena u pregledniku.
- **Integracijska i projektna dokumentacija:** `docs/`, `studia.config.example.js`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`.

## Ključne značajke portala

- **Pregledi:** nadzorna ploča, profil, inbox, kolegiji/UniHub, ocjene i ECTS, materijali, obavijesti, zadaće, raspored, Meet sobe, AI demo asistent.
- **Planer i favoriti:** osobni zadaci s rokom (dodavanje, završavanje, brisanje) i označavanje kolegija favoritima uz filtar „Favoriti“.
- **Vizualizacije:** kretanje kumulativnog prosjeka ocjena, distribucija ocjena i napredak po kolegijima (inline SVG/CSS, bez vanjskih biblioteka).
- **UX:** svijetli/tamni način, responzivan prikaz (desktop/tablet/mobilno), pretraga, filtri, modali, toast poruke, izvoz (npr. `.ics`, CSV) i demo preuzimanja.
- **Demo stanje:** dio postavki i radnji sprema se lokalno u pregledniku (`localStorage`) isključivo za potrebe demonstracije.
- **Moodle adapter:** demo način i live način preko backend proxyja (token ostaje na poslužitelju).

| Ocjene i ECTS | Materijali kolegija |
| --- | --- |
| ![Ocjene i ECTS bodovi](docs/grades.png) | ![Materijali kolegija](docs/materials.png) |

## Brzi početak

### Pokretanje lokalno (preporučeno)

```bash
# iz korijena repozitorija
python -m http.server 5500 --bind 127.0.0.1
```

Otvori: <http://127.0.0.1:5500/>

> Moguće je otvoriti i `index.html` izravno, ali lokalni server je preporučen zbog dosljednog učitavanja resursa.

### CSS (Tailwind)

Generirani CSS je već uključen (`assets/css/tailwind.css`). Ako mijenjaš klase/stilove koji ovise o Tailwind buildu:

```bash
npm install
npm run build:css
# razvoj: npm run watch:css
```

### Osnovne provjere

```bash
npm run check
```

Pokreće osnovne provjere (JSON, sintaksa JS datoteka, prisutnost ključnih datoteka).

## Konfiguracija i integracija

Portal je pripremljen za prilagodbu kroz runtime konfiguraciju i dokumentirane integracijske točke.

- **Konfiguracija:** `assets/js/config.js` (učitava se prije ostalih aplikacijskih skripti)
- **Primjer:** `studia.config.example.js`
- **Vodič integracije:** [`docs/INTEGRATION.md`](docs/INTEGRATION.md)
- **Podatkovni model:** [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)
- **Arhitektura:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

Primjer (inline override prije `config.js`):

```html
<script>
  window.STUDIA_CONFIG = {
    branding: { productName: "Studia", institutionShort: "SUM" },
    features: { aiAssistant: false },
    links: { moodlePortal: "https://eucenje.sum.ba/moodle/" }
  };
</script>
<script src="assets/js/config.js" defer></script>
```

Dostupan je i globalni namespace `window.Studia` (konfiguracija, lifecycle hookovi/eventi i osnovni API nakon inicijalizacije).

## Moodle integracija

### Demo način
- Zadano aktivan, bez mrežnih zahtjeva.
- Koristi ugrađene demo podatke za prikaz sinkronizacije i sažetaka.

### Live način (preko proxyja)
- Front-end šalje zahtjev proxy servisu; proxy koristi Moodle Web Service token i vraća normalizirane podatke.
- **Token se ne smije nalaziti u pregledniku, `localStorage` ili front-end kodu.**

Primjer pokretanja proxyja (Node 18+):

```bash
cd server
# postavi varijable okruženja (primjer)
# MOODLE_TOKEN=... MOODLE_URL=https://eucenje.sum.ba/moodle ALLOWED_ORIGIN=https://max55-lab.github.io
node moodle-proxy.js
```

Detalji: [`server/README.md`](server/README.md)

## Moodle tema (`theme/studia`)

U repozitoriju se nalazi i Moodle 4.5 Boost child tema:
- nativna Moodle autentikacija i autorizacija (bez vlastite prijave),
- prikaz prilagođen Studia vizualnom identitetu,
- korisničke preference (npr. način prikaza) kroz Moodle mehanizme.

Upute za instalaciju i postavke: [`theme/studia/README.md`](theme/studia/README.md)

## Struktura projekta (sažetak)

```text
.
├── index.html                  # statički portal (live demo ulazna točka)
├── assets/
│   ├── css/                    # stilovi (tailwind build + custom)
│   ├── js/                     # config, data, core, render, views, adapteri, app
│   ├── img/, fonts/, vendor/   # resursi
├── docs/                       # integracija, podatkovni model, arhitektura, privatnost
├── server/                     # Moodle proxy primjer
├── theme/studia/               # Moodle 4.5 tema
├── .github/workflows/          # CI i deploy
├── studia.config.example.js     # primjer integracijske konfiguracije
└── README.md
```

## Kvaliteta, sigurnost i privatnost

- **Pristupačnost:** semantika, fokus stanja, tipkovnička podrška, ARIA oznake i poštivanje `prefers-reduced-motion` (gdje je primjenjivo).
- **Sigurnost:** bez izlaganja tajni u klijentu; integracije trebaju poslužiteljsku autentikaciju/autorizaciju i obradu podataka. Vidi [`SECURITY.md`](SECURITY.md).
- **Privatnost:** demo koristi izmišljene podatke; lokalna pohrana služi samo za demo stanje/preferencije. Vidi [`docs/PRIVACY.md`](docs/PRIVACY.md).
- **CI:** osnovne provjere sintakse i valjanosti konfiguracije (`.github/workflows/ci.yml`).

## Deploy

- **GitHub Pages:** workflow `.github/workflows/deploy.yml` objavljuje `index.html` i `assets/` na svaki push na `main` (ili ručno pokretanje).
- **Repo-only sadržaj:** dokumentacija, tema, proxy i konfiguracijski primjeri nalaze se u repozitoriju i nisu nužno dio statičkog Pages artefakta.

## Doprinos i licenca

- Smjernice za doprinos: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Evidencija promjena: [`CHANGELOG.md`](CHANGELOG.md)
- Licenca: [`LICENSE`](LICENSE)

## Napomene i ograničenja

- Aplikacija je u zadanoj konfiguraciji **demo** (bez baze, bez stvarnog korisničkog računa, bez produkcijskih garancija).
- Za produkcijsku upotrebu potrebno je implementirati odgovarajuće backend sustave, sigurnosne kontrole, upravljanje podacima i usklađenost s pravilima/propisima ciljnog okruženja.
- Dio akademskih podataka u stvarnim sustavima može dolaziti iz više izvora (npr. Moodle + IS/SIS), pa integracija zahtijeva mapiranje i usklađivanje podatkovnog modela.