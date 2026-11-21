# Integracija Studia portala

Ovaj dokument opisuje kako prilagoditi i integrirati **Studia** demo portal u drugi sustav (statički hosting, LMS okruženje, intranet, vlastiti backend ili hibridni scenarij).

> **Važno (ADR-001):** za produkcijsku integraciju sa SUM-om koristi **Moodle temu** (`theme/studia/`), ne statički portal ni vanjski proxy. Statički build i načini A–C namijenjeni su demo/prezentaciji i testiranju sučelja s izmišljenim podacima. Detalji: [`DECISIONS.md`](DECISIONS.md).

## 1. Načini integracije

### A) Korištenje kao statički demo / predložak
- Koristi `index.html` + `assets/` kao gotovu aplikaciju.
- Podatke mijenjaš u `assets/js/data.js` (demo) ili uvodiš vlastiti izvor podataka.

### B) Konfiguracija bez većih izmjena jezgre
- Uključi `assets/js/config.js` (učitava se prije `data.js`) i postavi `window.STUDIA_CONFIG` prije njega.
- Pogledaj `studia.config.example.js` za dostupne opcije.

### C) Dublja integracija (zamjena podataka / adaptera)
- Zadrži UI i render logiku, a zamijeni izvor podataka i/ili Moodle adapter.
- Preporuka: definirati stabilan podatkovni ugovor (vidi `docs/DATA_MODEL.md`) i mapirati podatke iz ciljnih sustava.

### D) Ugradnja Moodle teme — preporučeni produkcijski smjer
- `theme/studia/` je Boost child tema za Moodle 4.5 (vidi `theme/studia/README.md`).
- Tema koristi nativnu Moodle autentikaciju/ovlasti i user preferences; ne uvodi vanjsku prijavu, token, REST endpoint ni dupliciranu bazu.
- Sav novi razvoj integracije ide ovamo; načini A–C ostaju demo alati.

## 2. Učitavanje i redoslijed skripti

Zadani redoslijed u `index.html`:
1. `assets/js/config.js` (integracijska konfiguracija)
2. `assets/vendor/lucide.min.js`
3. `assets/js/data.js`
4. `assets/js/core.js`
5. `assets/js/live-data.js` (normalizacija live podataka; snapshot demo podataka)
6. `assets/js/render.js`
7. `assets/js/views.js`
8. `assets/js/charts.js`
9. `assets/js/moodle-api.js`
10. `assets/js/app.js`

**Pravilo:** `config.js` mora biti dostupan prije ostalih aplikacijskih modula kako bi `window.STUDIA_CONFIG` i `window.Studia` bili dostupni. `live-data.js` mora biti učitan neposredno nakon `core.js` jer ovisi o `state` i demo konstantama iz `data.js`.

## 3. Runtime konfiguracija (`window.STUDIA_CONFIG`)

Primjer:

```html
<script>
  window.STUDIA_CONFIG = {
    branding: { productName: "Studia", institutionShort: "SUM" },
    features: { aiAssistant: false, liveProxy: true },
    links: { moodlePortal: "https://eucenje.sum.ba/moodle/" },
    integration: {
      dataSource: "demo",
      onAfterInit: function () { /* ... */ }
    }
  };
</script>
<script src="assets/js/config.js"></script>
```

### Ključne sekcije
- `app`: osnovne informacije (naziv, verzija, lokalizacija, demo postavke).
- `branding`: nazivi i boje/teme za vizualni identitet.
- `features`: uključivanje/isključivanje funkcionalnosti (ovisno o integraciji/primjeni).
- `storage`: prefiks ključeva i ponašanje lokalne pohrane.
- `integration`: izvor podataka, hookovi i adapteri.
- `ui`: zadani pogled i UI postavke.
- `links`: vanjske poveznice (Moodle portal, repozitorij itd.).
- `data`: (napredno) točka za override podataka — vidi podatkovni model.

> Napomena: dio opcija služi kao stabilni ugovor za integratore; konkretna primjena ovisi o verziji i mjestu korištenja u kodu. Provjeri `CHANGELOG.md` kod nadogradnji.

## 4. Hookovi i događaji

### Hookovi (konfiguracija)
- `integration.onBeforeInit(ctx)` — prije inicijalizacije aplikacije.
- `integration.onAfterInit(ctx)` — nakon inicijalizacije.
- `integration.onReady(ctx)` — kada je aplikacija spremna (ako je podržano u ciljnoj verziji).

### DOM događaji
- `studia:*` custom eventi (npr. `studia:ready`, `studia:init`) mogu se emitirati preko `window.Studia.emit(name, detail)` i koristiti za integracijske reakcije.

## 5. Zamjena izvora podataka

### Demo izvor
- Zadano: `assets/js/data.js` definira demo konstante (`STUDENT`, `COURSES`, `ASSIGNMENTS`, `MATERIALS`, itd.).

### Vanjski izvor (preporučeni pristup)
1. Definiraj mapiranje iz izvornog sustava u Studia podatkovni model (`docs/DATA_MODEL.md`).
2. Osiguraj podatke prije rendera (npr. generiranjem `data.js` u build koraku ili prilagodbom učitavanja).
3. Za dinamičke integracije koristi adapter/proxy sloj na poslužitelju (npr. `server/` za Moodle primjer).

## 6. Moodle integracija

- **Demo:** bez mrežnih zahtjeva, koristi lokalne podatke.
- **Live (proxy):** preglednik komunicira s proxy endpointom; proxy čuva token i poziva Moodle Web Service API.
- Proxy uz `summary` vraća i `data` (normalizirane kolegije, ocjene, materijale, zadaće i obavijesti). `assets/js/live-data.js` preslikava taj payload u oblik koji koriste `COURSES`, `GRADE_HISTORY`, `MATERIALS`, `ASSIGNMENTS` i `state`, nakon čega `renderAll()` osvježava cijeli UI — uključujući grafikone.
- Stari proxy koji vraća samo `summary` i dalje radi; tada se prikazuju demo podaci, a brojke u statusu dolaze iz proxyja.
- Prijelazom u demo način vraća se demo dataset; povratkom u live ponovno se primjenjuje posljednji dataset iz memorije (ne iz `localStorage`).
- Nikada ne stavljati Moodle token u front-end kod ili `localStorage`. Stvarni studentski podaci iz live načina također se ne pohranjuju u `localStorage`.

Za lokalno testiranje bez tokena: `node scripts/mock-moodle-proxy.js` (zadani port `8788`), zatim u modalu upisati `http://127.0.0.1:8788`.

Detalji: [`server/README.md`](../server/README.md), [`docs/DATA_MODEL.md`](DATA_MODEL.md), `assets/js/moodle-api.js`, `assets/js/live-data.js`.

## 7. Ugradnja u postojeću stranicu/sustav

- **Najjednostavnije:** ugrađivanje cijelog portala (iframe ili zasebna ruta) uz prilagođeni `config` i podatke.
- **Selektivno:** izdvajanje specifičnih pogleda/komponenti zahtijeva prilagodbu HTML/JS modula (vidi `docs/ARCHITECTURE.md`).
- **Moodle:** koristiti `theme/studia` za nativno iskustvo unutar Moodlea; statički portal koristiti kao demo ili zasebni front-end.

## 8. Sigurnost, privatnost i produkcija

- Implementirati autentikaciju/autorizaciju i validaciju na poslužitelju.
- Sanitizirati i kontrolirati sve vanjske podatke.
- Ne pohranjivati osjetljive podatke u klijentu.
- Jasno komunicirati korisnicima što se sprema lokalno.

Vidi: [`SECURITY.md`](../SECURITY.md), [`docs/PRIVACY.md`](PRIVACY.md).
