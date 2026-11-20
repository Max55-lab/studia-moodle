# Contributing to Studia

Hvala na interesu za doprinos projektu **Studia** (demo studentski portal i prateće komponente).

## Opseg projekta

Repozitorij sadrži:
- **Statički demo portal** (`index.html`, `assets/`) — live demo na GitHub Pages.
- **Moodle temu** (`theme/studia/`) — Boost child tema za Moodle 4.5.
- **Backend proxy primjer** (`server/`) — za live Moodle integraciju bez izlaganja tokena u pregledniku.

## Prije doprinosa

- Provjeri postojeće issue-e/PR-ove (ako postoje) kako ne bi duplicirao rad.
- Za veće promjene predloži pristup i opseg prije implementacije.
- Ne dodavaj stvarne osobne podatke, tajne ključeve, tokene, `.env` datoteke niti privatne materijale.

## Lokalno pokretanje

### Demo portal
```bash
python -m http.server 5500 --bind 127.0.0.1
# otvori http://127.0.0.1:5500/
```

### CSS (Tailwind)
```bash
npm install
npm run build:css
# ili: npm run watch:css
```

### Proxy (opcionalno, live način)
Pogledaj [`server/README.md`](server/README.md).

## Smjernice za promjene

- **Konzistentnost:** prati postojeći stil i strukturu datoteka. Ne radi refaktore koji nisu potrebni za zadatak.
- **Pristupačnost:** zadrži semantiku, fokus, kontrast, tipkovničku podršku i `aria` atribute gdje su relevantni.
- **Sigurnost:** ne izlaži tokene/ključeve u klijentu; sanitiziraj/escape-aj dinamički sadržaj; provjeri utjecaj na XSS/CSRF u integracijskim scenarijima.
- **Responzivnost:** provjeri ključne širine (npr. 390, 900, 1280, 1440 px) i da nema horizontalnog prelijevanja.
- **Demo podaci:** koristi isključivo izmišljene podatke.
- **Dokumentacija:** ažuriraj README/dokumente u `docs/` kada mijenjaš konfiguraciju, podatkovni model ili integracijske točke.

## Kvalitet i provjere

Prije predaje promjena preporučeno je:
- provjeriti sintaksu JS datoteka (`node --check` za relevantne datoteke),
- provjeriti ispravan JSON (`package.json`, konfiguracije),
- ručno testirati pogođene tokove u pregledniku (light/dark, mobilno, glavni scenariji),
- osigurati da GitHub Pages demo i dalje radi (deploy kopira `index.html` i `assets/`).

## Commit poruke

Preferiraj jasne, opisne poruke (što i zašto), npr.:
- `Poboljsaj kontrast i fokus stanja u tamnom nacinu`
- `Dodaj integracijski config i dokumentaciju podatkovnog modela`

## Licenca

Slanjem doprinosa pristaješ da se doprinos licencira pod licencom projekta (vidi [`LICENSE`](LICENSE)).
