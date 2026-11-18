# Studia — studentski portal Sveučilišta u Mostaru

[![Deploy na GitHub Pages](https://github.com/Max55-lab/studia-moodle/actions/workflows/deploy.yml/badge.svg)](https://github.com/Max55-lab/studia-moodle/actions/workflows/deploy.yml)

Responzivan front-end demo studentskog portala izrađen prema priloženom dizajnu.
Portal objedinjuje kolegije, ocjene i ECTS, materijale, zadaće, raspored, Moodle
obavijesti i studentsku zajednicu (UniHub) na jednom mjestu.

Sve radi u običnom pregledniku, bez poslužiteljske strane. Podaci su demo podaci
u `assets/js/data.js`, a radnje poput predaje zadaće, čitanja poruka i postavki
podsjetnika pamte se u `localStorage`. Moodle adapter ima **demo** i **live**
način; live način koristi priloženi backend proxy koji čuva API token izvan
preglednika.

**Live demo:** <https://max55-lab.github.io/studia-moodle/>

![Pregled nadzorne ploče](docs/preview.png)

Stranica se automatski objavljuje na GitHub Pages pri svakom pushu na `main`
preko workflowa `.github/workflows/deploy.yml`.

## Pokretanje

Najbrže: dvaput klikni `index.html`.

Preporučeno (zbog lokalnih fontova i SVG slika):

```powershell
cd C:\Users\max\Desktop\SCHOOL_PORTAL
python -m http.server 5500 --bind 127.0.0.1
```

Zatim otvori <http://127.0.0.1:5500/>.

### Ponovno generiranje CSS-a

Tailwind CSS je već kompajliran u `assets/css/tailwind.css`, pa za korištenje
portala nije potreban Node. Ako mijenjaš HTML ili JavaScript klase:

```powershell
npm.cmd install
npm.cmd run build:css
```

## Moodle API: demo i live način

Moodle modal u zaglavlju i bočnoj navigaciji sada je sinkronizacijski centar.

- **Demo** (zadano) — ne šalje mrežne zahtjeve. Simulira sinkronizaciju i
  prikazuje broj kolegija, ocjena, materijala i zadaća. Radi na GitHub Pagesu.
- **Live proxy** — šalje `POST /api/moodle/sync` na tvoj backend proxy. Proxy
  čita token iz environment varijable, poziva Moodle WebService i vraća samo
  normalizirani sažetak. Token se **nikada** ne šalje u preglednik, ne upisuje
  se u `localStorage` i ne prikazuje u modalu.

### Pokretanje proxyja

Potreban je Node 18+ i Moodle WebService token s dopuštenim funkcijama.

```powershell
cd C:\Users\max\Desktop\SCHOOL_PORTAL
$env:MOODLE_TOKEN = "tvoj_moodle_token"
$env:MOODLE_URL = "https://eucenje.sum.ba/moodle"
$env:ALLOWED_ORIGIN = "https://max55-lab.github.io"
node server/moodle-proxy.js
```

Proxy zatim radi na `http://127.0.0.1:8787`. U modalu odaberi **Live proxy** i
upisi njegov URL. Za javno dostupnu verziju koristi HTTPS hosting (Render,
Railway, Fly.io, VPS ili vlastiti poslužitelj) — GitHub Pages ne može izvršavati
backend kod.

Detalji, environment varijable i sigurnosne napomene nalaze se u
[`server/README.md`](server/README.md).

> Napomena: dio podataka (ocjene, ECTS, upisani kolegiji) u stvarnom sustavu SUM
> dolazi iz Studomata / ISVU, a ne iz Moodlea. Moodle obično daje sadržaj
> kolegija, zadaće, forumske obavijesti i bodove aktivnosti. Proxy je zato
> primjer i lako se proširuje dodatnim izvorima podataka.

## Struktura projekta

```text
SCHOOL_PORTAL/
├── index.html                  # svi pogledi, modali i osnovna struktura
├── package.json                # skripte za Tailwind build
├── tailwind.config.js          # Studia paleta, fontovi i sjene
├── README.md
├── server/
│   ├── moodle-proxy.js         # Node backend proxy (token ostaje na poslužitelju)
│   └── README.md               # upute za live Moodle integraciju
└── assets/
    ├── css/
    │   ├── tailwind.src.css    # Tailwind ulazna datoteka
    │   ├── tailwind.css        # generirani, minificirani Tailwind
    │   └── style.css           # fontovi, animacije, kalendar, pristupačnost
    ├── js/
    │   ├── data.js             # svi demo podaci: kolegiji, ocjene, materijali, obavijesti
    │   ├── core.js             # tema, navigacija, pretraga, modali, pohrana, pomoćne funkcije
    │   ├── render.js           # kolegiji, ocjene, materijali, obavijesti, zadaće, inbox
    │   ├── views.js            # raspored, Meet sobe, oglasi i mini kalendar
    │   ├── moodle-api.js       # demo/live Moodle adapter
    │   └── app.js              # modali, predaje, AI asistent, događaji, pokretanje
    ├── fonts/                  # Plus Jakarta Sans (lokalno, WOFF2)
    ├── img/                    # favicon i avatar studenta
    └── vendor/
        └── lucide.min.js       # lokalna kopija Lucide ikona
```

### Gdje što mijenjati

| Želiš promijeniti… | Otvori |
| --- | --- |
| Tekstove, kartice, tablicu, strukturu pogleda | `index.html` |
| Demo studenta, kolegije, ocjene, materijale, obavijesti, raspored | `assets/js/data.js` |
| Boje, fontove, sjene | `tailwind.config.js` i `assets/css/style.css` |
| Raspored, kalendar i Meet sobe | `assets/js/views.js` |
| Demo/live Moodle adapter i proxy URL | `assets/js/moodle-api.js` |
| Backend proxy i Moodle WebService pozivi | `server/moodle-proxy.js` |
| Interakcije i tokove radnji | `assets/js/app.js` |
| Ikone | lokalni `assets/vendor/lucide.min.js` + atribut `data-lucide` |

## Pogledi i značajke

- **Nadzorna ploča** — hero sa sljedećim predavanjem, brze zadaće, carousel
  kolegija s filtrima, tablica/lista nadolazećih obveza, statistika i profesori.
- **Profil studenta** — podaci o studiju, prisustvo, upisani semestri, mini
  kalendar s rokovima i oglasna ploča. Gumb generira demo potvrdu o studiranju.
- **Inbox i obavijesti** — poruke profesora i Moodle sustava, označavanje
  pročitanim, otvaranje detalja i brojač nepročitanih.
- **Kolegiji i UniHub** — svi kolegiji, pretraga skripti, preuzimanje demo
  materijala i objava nove skripte s provjerom formata i veličine datoteke.
- **Ocjene i ECTS** — prosjek ponderiran ECTS bodovima, napredak prema 180 ECTS,
  distribucija ocjena, filtri po semestru, tablica/kartice i CSV izvoz.
- **Materijali kolegija** — 25 primjera po kolegijima i sekcijama, filtri po
  kolegiju i tipu, pretraga, oznaka "Novo" i demo preuzimanje ili Moodle link.
- **Centar obavijesti** — zvono u zaglavlju, brojač nepročitanih, panel s
  obavijestima, označavanje pročitanim i skok na povezani pogled. Postavke
  podsjetnika (rokovi, ocjene, materijali, forumi) i testni podsjetnik.
- **Zadaće i kolokviji** — filtri po statusu, detalji zadaće, prilaganje
  datoteke i predaja. Predane zadaće mijenjaju statistiku i brojače.
- **Raspored predavanja** — tjedni raspored s aktualnim datumima, oznakom
  "Danas" i izvozom cijelog rasporeda i rokova u `.ics` kalendar.
- **Google Meet sobe** — demo sobe po kolegijima; gumb kopira Meet poveznicu.
- **AI asistent** — demo chat s pripremljenim odgovorima za Laravel, baze
  podataka, UI/UX i plan učenja.
- **Moodle API** — demo/live adapter sa statusom, zadnjom sinkronizacijom i
  sažetkom povučenih podataka. Live način ide preko backend proxyja i ne
  izlaže token u pregledniku.
- **Tema i akademski kontekst** — svijetli/tamni način rada i odabir fakulteta,
  godine i semestra pamte se između posjeta.

Demo datum je fiksiran na **18. 11. 2026.** kako bi rokovi, mini kalendar i
"sljedeće predavanje" uvijek bili smisleni.

## Pristupačnost

- Skip link, fokus-stilovi i ARIA stanja na navigaciji i modalima.
- Upravljanje fokusom pri otvaranju/zatvaranju modala i mobilnog izbornika.
- Zatvaranje modala tipkom `Escape` i klikom na pozadinu.
- Poštivanje `prefers-reduced-motion` i `prefers-color-scheme` pri prvom posjetu.
- Tablica rokova na mobitelu zamijenjena je čitljivim karticama.

## Ograničenja demoa

Demo način nema bazu podataka, prijavu ni stvarne Moodle pozive. Predaja zadaće,
upload skripte, preuzimanje materijala, CSV izvoz i potvrda samo su lokalne demo
radnje. AI asistent vraća unaprijed pripremljene odgovore, a Meet poveznice su
primjeri. Live način radi tek uz pokrenuti proxy i valjan Moodle token; pojedine
Moodle funkcije ovise o dopuštenjima korisnika i postavkama WebServicea.

## Testirano

Playwright provjere u Chromiumu na širinama 1440, 1280, 900 i 390 px:

- nema horizontalnog prelijevanja stranice ni grešaka u konzoli,
- rade pretraga, filtri, carousel, modali, predaja zadaće, inbox i UniHub,
- rade ocjene, ECTS izračuni, CSV izvoz, materijali i oznake "Novo",
- rade centar obavijesti, označavanje pročitanim, postavke i testni podsjetnik,
- rade demo sinkronizacija, live validacija proxy URL-a i status Moodlea,
- rade preuzimanja (skripta, materijala, ocjena, potvrde, `.ics`) i mobilni izbornik,
- rade svijetla i tamna tema te mobilni prikaz tablica i kartica.
