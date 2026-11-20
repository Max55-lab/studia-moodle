# Security Policy

## Podržani opseg

Ovaj repozitorij primarno sadrži **demo aplikaciju** (statički front-end) i prateće komponente (Moodle tema, proxy primjer). Demo način ne zamjenjuje sigurnosne kontrole produkcijskog sustava.

## Prijava ranjivosti

Ako otkriješ sigurnosni problem:

1. **Nemoj** javno objavljivati detalje (issue, PR opis, diskusije) prije dogovora o ispravku.
2. Prijavi problem održavatelju repozitorija privatnim kanalom (npr. GitHub Security Advisory / privatni kontakt vlasnika repozitorija), uz:
   - opis problema i utjecaja,
   - korake za reprodukciju (ako je moguće),
   - pogođene datoteke/komponente,
   - prijedlog mitigacije (opcionalno).

## Smjernice i očekivanja

- **Tajne i tokeni:** nikada ne hardkodirati niti slati API tokene/ključeve u klijent (preglednik), `localStorage`, logove ili commitove. Live integracije moraju koristiti poslužiteljsku stranu/proxy.
- **Autentikacija i ovlasti:** demo nema stvarnu autentikaciju; u stvarnim integracijama osloniti se na mehanizme ciljnog sustava (npr. Moodle sesije, capability provjere, CSRF zaštita).
- **XSS/unos podataka:** dinamički sadržaj mora biti sigurno obrađen/escape-an prije prikaza; oprez kod integracije vanjskih izvora.
- **Ovisnosti:** povremeno ažurirati ovisnosti i provjeravati poznate ranjivosti (npr. `npm audit`) u razvojnom okruženju.
- **Privatnost:** ne koristiti stvarne osobne ili osjetljive podatke u demo okruženju; vidi [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Napomena

Demo lokalno pohranjivanje (postavke/oznake) služi isključivo za prikaz ponašanja sučelja i ne predstavlja sigurnosnu pohranu podataka.
