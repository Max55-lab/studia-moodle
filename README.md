# Studia — studentski portal Sveučilišta u Mostaru

Responzivan front-end demo studentskog portala izrađen prema priloženom dizajnu.
Portal objedinjuje kolegije, zadaće, raspored, Moodle obavijesti i studentsku
zajednicu (UniHub) na jednom mjestu.

Sve radi u običnom pregledniku, bez poslužiteljske strane. Podaci su demo podaci
u `assets/js/data.js`, a radnje poput predaje zadaće i čitanja poruka pamte se u
`localStorage`.

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

## Struktura projekta

```text
SCHOOL_PORTAL/
├── index.html                  # svi pogledi, modali i osnovna struktura
├── package.json                # skripte za Tailwind build
├── tailwind.config.js          # Studia paleta, fontovi i sjene
├── README.md
└── assets/
    ├── css/
    │   ├── tailwind.src.css    # Tailwind ulazna datoteka
    │   ├── tailwind.css        # generirani, minificirani Tailwind
    │   └── style.css           # fontovi, animacije, kalendar, pristupačnost
    ├── js/
    │   ├── data.js             # svi demo podaci i definicije statusa
    │   ├── core.js             # tema, navigacija, pretraga, modali, pomoćne funkcije
    │   ├── render.js           # kolegiji, zadaće, inbox, skripte i statistika
    │   ├── views.js            # raspored, Meet sobe, oglasi i mini kalendar
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
| Demo studenta, kolegije, zadaće, poruke, raspored | `assets/js/data.js` |
| Boje, fontove, sjene | `tailwind.config.js` i `assets/css/style.css` |
| Raspored, kalendar i Meet sobe | `assets/js/views.js` |
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
- **Zadaće i kolokviji** — filtri po statusu, detalji zadaće, prilaganje
  datoteke i predaja. Predane zadaće mijenjaju statistiku i brojače.
- **Raspored predavanja** — tjedni raspored s aktualnim datumima, oznakom
  "Danas" i izvozom cijelog rasporeda i rokova u `.ics` kalendar.
- **Google Meet sobe** — demo sobe po kolegijima; gumb kopira Meet poveznicu.
- **AI asistent** — demo chat s pripremljenim odgovorima za Laravel, baze
  podataka, UI/UX i plan učenja.
- **Moodle API** — demo modal za povezivanje s `eucenje.sum.ba`; stanje se
  pamti u `localStorage`.
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

Nema baze podataka, prijave ni stvarnog Moodle API-ja. Predaja zadaće, upload
skripte, preuzimanje materijala i potvrda samo su lokalne demo radnje. AI
asistent vraća unaprijed pripremljene odgovore, a Meet poveznice su primjeri.

## Testirano

Playwright provjere u Chromiumu na širinama 1440, 1280, 900 i 390 px:

- nema horizontalnog prelijevanja stranice ni grešaka u konzoli,
- rade pretraga, filtri, carousel, modali, predaja zadaće, inbox i UniHub,
- rade preuzimanja (skripta, potvrda, `.ics`) i mobilni izbornik,
- rade svijetla i tamna tema te mobilni prikaz tablice rokova.
