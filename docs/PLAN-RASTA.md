# Plan niše, rasta i komercijalizacije — Student SaaS Platform

Dokument je generički: ne sadrži imena, osobne podatke ni stvarne cijene klijenata.
Nadovezuje se na [`ARTITEKTURA.md`](ARTITEKTURA.md) i [`schema.sql`](schema.sql).
Odluka ADR-001 i dalje vrijedi za SUM — ovo je zaseban konceptualni plan.

---

## 1. Odabir niše

**Niša:** međusveučilišna razmjena studentskih materijala i kolaborativno učenje
na hrvatskom/BCS tržištu, s akademskim SSO-om kao ulaznom barijerom.

**Zašto ova niša:**
- Problem je ponavljajući i sezonski (svaki semestar novi rokovi, ispiti, skripte).
- Korisnik ima jasan „aha" trenutak: pronađe skriptu za kolegij u manje od minute.
- Podaci se prirodno grupiraju po fakultetu → kolegiju → godini, što odgovara
  modelu multi-tenancyja i RLS politika iz sheme.
- Tržište je dovoljno malo za fokus, ali dovoljno veliko za mrežni efekt (studenti
  istog kolegija dijele materijale).

**ICP (idealni profil korisnika):** student 2.–5. godine tehničkog ili
ekonomskog fakulteta koji već koristi e-kolegij, ima projektne timove i povremeno
traži tuđe bilješke ili probne ispite.

**Kupci (plaćajuća strana):** pojedinačni `StudentPro` korisnici i studentske
udruge / nastavnici koji kupuju `Team` paket za cijeli kolegij.

---

## 2. Problem → rješenje → vrijednost

| Problem danas | Modul platforme | Mjerljiva vrijednost |
| --- | --- | --- |
| Materijali razasuti po grupama i e-kolegijima | 4. Data Engine + pretraga | vrijeme do prve skripte < 60 s |
| Nema povjerenja u tuđe skripte | 1. RBAC + 4. verifikacija + ocjene | udio verificiranih materijala > 60 % |
| Rokovi se gube | 5. automatizacija + 7. obavijesti | broj propuštenih rokova po studentu ↓ |
| Samostalno učenje je sporo | 5. AI Copilot + RAG | prosečno vrijeme do odgovora < 30 s |
| Timovi nemaju zajednički prostor | 6. Real-time + 19. bilješke | broj aktivnih timova po kolegiju ↑ |

---

## 3. Paketi i cijene (orijentacijski, bez stvarnog naplaćivanja)

| Paket | Cijena | Sadržaj | Ograničenja iz `plans.limits` |
| --- | --- | --- | --- |
| `Student Free` | 0 EUR | pregled i upload materijala, osnovni planer | 1 000 AI tokena, 1 GB, 1 tim |
| `Student Pro` | ~6,99 EUR/mj | RAG nad vlastitim skriptama, kvizovi, offline | 50 000 tokena, 10 GB, 10 timova |
| `Team / Faculty` | ~19,99 EUR/mj po timu | per-seat, dijeljeni bilješci, moderator, izvještaji | 250 000 tokena, 100 GB, 100 timova |

Mehanizmi iz modula 2: 14-dnevni trial, kuponi za studentske udruge, prorated
upgrade/downgrade putem Billing Portala, PDV prema lokaciji, dunning i anketa pri
otkazivanju. U schemi su to `plans`, `subscriptions`, `invoices`, `coupons`,
`usage_records` i `quotas`.

---

## 4. PLG petlje rasta

1. **Materijal → korisnik:** student preuzme skriptu → vidi „Spremi u svoj kolegij"
   → onboarding s odabirom fakulteta → prvi upload.
2. **Tim → korisnik:** poziv u projektni tim šalje obavijest e-mailom i in-app →
   novi korisnik bez registracije na prazan ekran.
3. **Referral:** jedinstveni pozivni link iz `referrals` → oba studenta dobivaju
   AI kredite → poziva kolege s godine.
4. **Javni sadržaj → SEO:** javni linkovi i stranice kolegija (`public_links`,
   `courses.is_public`) indeksiraju se i donose organski promet.
5. **AI → zadržavanje:** generirani kviz iz skripte → NPS mikro-anketa → povratna
   informacija hrani `feedback_items` i javni roadmap.

---

## 5. Faze (12 mjeseci, bez osobnih imena)

| Mjesec | Cilj | Ključna metrika |
| --- | --- | --- |
| 1–2 | Onboarding, RBAC, RLS, prvi upload | 100 korisnika, 50 materijala |
| 3–4 | Pretraga, filteri, timovi, obavijesti | D7 retencija > 25 % |
| 5–6 | AI Copilot s citatima, `Student Pro` | konverzija u Pro > 3 % |
| 7–8 | Akademski SSO, fakultetski pilot | 1 fakultet, 300 aktivnih studenata |
| 9–10 | Team paket, API i webhookovi | 5 timova plaća mjesečno |
| 11–12 | Status stranica, Sentry, PWA | uptime 99,9 %, MRR raste mjesec od mjeseca |

---

## 6. KPI i mjerenje

- **Akvizicija:** registracije po kanalu, omjer pozivnica i prihvaćanja.
- **Aktivacija:** registracija → odabir fakulteta → prvi upload/preuzimanje.
- **Zadržavanje:** DAU/MAU, D7/D30, broj aktivnih timova.
- **Monetizacija:** trial → Pro konverzija, MRR/ARR, churn, LTV/CAC.
- **Kvaliteta:** udio verificiranih materijala, točnost AI citata, broj prijava.

Svi događaji idu u `analytics_events`; praćenje lijevka i feature flagovi koriste
`feature_flags`. Session replay mora imati maskiranje osobnih podataka.

---

## 7. Rizici i ublažavanja

| Rizik | Ublažavanje |
| --- | --- |
| Autorska prava nastavnih materijala | verzionirani Uvjeti, `copyright` privola, verifikacija i brzi takedown |
| Sezonskost (ispitna razdoblja) | tjedni sažeci, podsjetnici i arhiva starih godina drže aktivnost |
| AI troškovi | token kvote, semantičko keširanje, fallback model, BYOK za fakultete |
| Povjerenje u tuđe skripte | ocjene, verifikacija od strane `CourseLead`-a, audit log |
| Konkurencija velikih platformi | lokalizacija, akademski SSO i uska fokusiranost na kolegij |

---

## 8. Što je potrebno prije stvarne prodaje

1. Nova ADR odluka koja razmatra napuštanje theme-first smjera (ADR-001).
2. Pravni okvir obrade osobnih podataka i ugovor s fakultetom.
3. Produkcijska baza, backupi, Sentry i status stranica iz faze 5 arhitekture.
4. Stvarni deploy i E2E testovi za prijavu, upload, AI i naplatu.

Plan je konceptualni artefakt — ne mijenja postojeći demo ni produkcijski smjer teme.
