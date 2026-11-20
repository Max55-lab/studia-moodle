# Privatnost i rukovanje podacima

## Opseg

Ovaj dokument odnosi se na **demo** Studia portal i prateće komponente u ovom repozitoriju. Zadana aplikacija koristi izmišljene podatke i ne provodi stvarnu autentikaciju.

## Koji se podaci koriste

- **Demo podaci:** studenti, kolegiji, ocjene, materijali, obavijesti, rokovi i sl. su izmišljeni i definirani u `assets/js/data.js` (ili ekvivalentnom izvoru u prilagodbi).
- **Korisnički unos u demu:** radnje poput označavanja pročitanog, predaje (simulacija), postavki podsjetnika i odabira teme koriste se za prikaz ponašanja sučelja.

## Lokalna pohrana (preglednik)

Aplikacija može koristiti `localStorage` za pohranu preferencija i demo stanja (npr. tema, akademski kontekst, pročitane stavke, postavke, status sinkronizacije). Ključevi su tipično prefiksirani (zadano `studia:*`).

- Pohrana je lokalna uređaju/pregledniku korisnika.
- U demo kontekstu ne bi trebalo pohranjivati stvarne osobne ili osjetljive podatke.
- Korisnik može očistiti podatke brisanjem pohrane web-mjesta u pregledniku.

## Mrežni pozivi i integracije

- **Demo način:** nema stvarnih poziva prema vanjskim sustavima za korisničke podatke.
- **Live/proxy integracije:** kada su konfigurirane, zahtjevi se šalju na definirani proxy/servis. Takve integracije moraju osigurati siguran prijenos (HTTPS), pravilno upravljanje pristupom i zaštitu tajni (tokeni isključivo na poslužitelju).

## Preporuke za produkcijsku upotrebu

- Koristiti samo podatke za koje postoji pravna osnova i jasna svrha obrade.
- Primijeniti načela minimizacije podataka i ograničenja pristupa.
- Osigurati transparentnost (obavijesti o privatnosti, kolačići/pohrana, prava korisnika) u skladu s primjenjivim propisima.
- Ne logirati osjetljive podatke; zaštititi komunikaciju i tajne.

## Odgovornost integratora

Pri integraciji u stvarne sustave (LMS, SIS, API) integrator je odgovoran za usklađenost s privatnosnim i sigurnosnim zahtjevima ciljnog okruženja.
