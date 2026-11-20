# Studia (theme_studia)

`theme_studia` je nativna Moodle tema za **SUM e-Učenje**, naslijeđena od `theme_boost` (Moodle 4.5). Donosi moderan Studia vizualni identitet, prilagođenu nadzornu ploču za studente, kompaktni brzi izbornik i podršku za svijetli/tamni način rada.

## Glavne značajke

- **Nasljeđivanje:** child tema `theme_boost`, bez izmjena Moodle core datoteka.
- **Vizualni identitet:** ljubičasto–indigo akcenti (`#6d28d9`, `#7c3aed`), zaobljene kartice, jasna tipografija i puno praznog prostora.
- **Nadzorna ploča:** hero pozdrav s aktivnim semestrom, kartice upisanih kolegija, nositelji i napredak dovršetka (completion) kada je dostupan.
- **Navigacija:** Boost drawer struktura + kompaktni Studia brzi izbornik (profil, moji kolegiji, ocjene, kalendar).
- **Dark mode:** prekidač u navbaru, odabir se sprema u Moodle korisničke postavke (`set_user_preference`) i primjenjuje se na serveru kroz `data-theme`/`data-bs-theme` kako ne bi bilo treperenja.
- **Sigurnost:** koristi isključivo Moodle sesije, `require_login()`, `require_sesskey()`, Moodle uloge i capability provjere; nema vlastite prijave, vanjskih REST API slojeva ni tokena u pregledniku/`localStorage`.
- **Responzivnost:** prilagođeno za tipične širine (npr. 1440, 1280, 900, 390 px) bez horizontalnog prelijevanja ključnih elemenata teme.

## Zahtjevi

- Moodle **4.5** (`$plugin->requires = 2024100700`)
- Instalirana i dostupna roditeljska tema **Boost** (`theme_boost`)
- PHP okruženje kompatibilno s vašom Moodle 4.5 instalacijom

## Struktura teme

- `version.php`, `config.php`, `lib.php`, `settings.php` – osnovna definicija i postavke teme
- `classes/output/core_renderer.php` – server-side logika prikaza (dark mode atributi, dashboard, prekidač, brzi izbornik)
- `layout/drawers.php`, `templates/` – Boost layout i Mustache predlošci
- `scss/pre.scss`, `scss/post.scss` – Studia varijable, Bootstrap overridei i prilagođeni stilovi
- `toggle.php` – sigurni POST endpoint za promjenu načina prikaza
- `amd/src/`, `amd/build/` – JS za interakcije brzog izbornika
- `lang/en/`, `lang/hr/` – jezični paketi

## Instalacija

1. **Kopirajte temu na server**
   - Kopirajte cijeli direktorij `theme/studia` u Moodle instalaciju tako da putanja bude:
     - `<moodle_root>/theme/studia`

2. **Provjerite dozvole datoteka**
   - Datoteke moraju biti čitljive web poslužitelju (uobičajeno kao i ostale Moodle teme).

3. **Pokrenite nadogradnju Moodlea**
   - Prijavite se kao administrator i otvorite početnu stranicu administracije ili idite na:
     - `Site administration → Notifications` (`/admin/index.php`)
   - Moodle će detektirati novi plugin i ponuditi nadogradnju baze. Potvrdite instalaciju.

4. **Odaberite temu (ako već nije aktivna)**
   - `Site administration → Appearance → Themes → Theme selector`
   - Postavite **Studia** kao zadanu temu (ili temu za željeni uređaj/kontekst).

5. **Očistite predmemorije**
   - `Site administration → Development → Purge caches` (`/admin/purgecaches.php`)
   - Ovo je preporučljivo nakon instalacije ili promjena SCSS-a/postavki.

## Postavke teme

`Site administration → Appearance → Themes → Studia`

- **Zadani način prikaza** (`defaultmode`): `light` ili `dark` za korisnike koji još nisu odabrali način.
- **Oznaka aktivnog semestra** (`semesterlabel`): ručni natpis u hero zaglavlju nadzorne ploče. Ako je prazno, tema automatski izračunava zimski/ljetni semestar i akademsku godinu.
- **Broj kolegija na nadzornoj ploči** (`dashboardcoursecount`): koliko kartica kolegija prikazati u hero sekciji (3–12).
- **Napredno:** dodatni SCSS prije/poslije tema stilova (`scsspre`, `scss`).

## Način rada dark modea

- Prekidač je forma koja šalje **POST** na `theme/studia/toggle.php` s `sesskey`.
- Endpoint provjerava `require_login()` i `require_sesskey()`, validira način (`light`/`dark`) i sprema ga putem `set_user_preference('theme_studia_mode', ...)`.
- `core_renderer::htmlattributes()` postavlja `data-theme` i `data-bs-theme` na `<html>` na temelju spremljene postavke, pa se ispravan način isporučuje u prvom HTML odgovoru (bez flasha).
- Nema API tokena i nema pohrane autentikacijskih podataka u `localStorage`.

## Nadzorna ploča i podaci

- Hero i kartice kolegija renderiraju se kroz `theme_studia\output\core_renderer` i Mustache predloške (`templates/dashboard.mustache`, `templates/course_card.mustache`).
- Kolegiji se dohvaćaju preko `enrol_get_my_courses()`.
- Nositelji se prikazuju preko `core_course_list_element::get_course_contacts()` uz Moodle provjere vidljivosti profila.
- Napredak se prikazuje preko `\core_completion\progress::get_course_progress_percentage()` kada je praćenje dovršetka dostupno.
- Standardni **My overview** blok na nadzornoj ploči vizualno je potisnut u korist Studia kartica, dok **Timeline** ostaje dostupan i stiliziran unutar teme.

## Razvojne napomene

- Tema ne mijenja Moodle core; prilagodbe su u `theme/studia`.
- Nakon promjena SCSS-a ili postavki pokrenite purge caches.
- PHP sintaksa može se provjeriti lokalno s: `php -l <datoteka>`.

## Licenca

GNU GPL v3 ili novija, u skladu s Moodle ekosustavom. Vidi zaglavlja datoteka i `COPYING.txt` u Moodle instalaciji.
