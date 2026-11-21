# Use Case opisi — Student SaaS Platform

Aktori, tokovi i sigurnosna pravila za ciljnu platformu opisanu u
[`ARTITEKTURA.md`](ARTITEKTURA.md). Ovo je dizajn artefakt; postojeći demo portal
i Moodle tema `theme_studia` ostaju nepromijenjeni (ADR-001).

---

## 1. Aktori

| Aktor | Opis | Uloga u `roles` |
| --- | --- | --- |
| Super administrator | upravlja cijelim sustavom i institucijama | `SuperAdmin` |
| Moderator fakulteta | moderira materijale i korisnike svoje domene | `FacultyModerator` |
| Nositelj kolegija | verificira materijale i vodi kolegij | `CourseLead` |
| Student Pro | upload, AI, timovi, pretplata | `StudentPro` |
| Student Free | pregled i osnovni upload bez AI | `StudentFree` |
| Gost | vidi javne stranice i materijale | `GuestViewer` |
| Sustav | cron, webhookovi, worker poslovi | interni servis |

---

## 2. Popis use caseova

| ID | Naziv | Primarni aktor | Modul | Rezultat |
| --- | --- | --- | --- | --- |
| UC-01 | Prijava i odabir fakulteta | Student | 1, 13 | personalizirana nadzorna ploča |
| UC-02 | Prijava akademskim SSO-om | Student | 1 | sesija bez nove lozinke |
| UC-03 | Uključivanje 2FA i oporavak | Student | 1 | TOTP + recovery kodovi |
| UC-04 | Pregled aktivnih uređaja i odjava | Student | 1 | `sessions.revoked_at` |
| UC-05 | Upload skripte uz validaciju | Student | 4, 19 | nova `materials` + `material_versions` |
| UC-06 | Verifikacija skripte | CourseLead | 1, 4 | status `verified`, +bodovi autoru |
| UC-07 | Pretraga i filtriranje materijala | Student/Gost | 3, 4 | filtrirani rezultati, spremljeni pogled |
| UC-08 | Ocjena i komentar uz stranicu | Student | 4, 6 | `ratings`, `material_comments` |
| UC-09 | AI pitanje nad skriptom s citatima | Student Pro | 5 | odgovor s `citations` iz `ai_embeddings` |
| UC-10 | Generiranje probnog kviza | Student Pro | 5, 23 | izlaz feature flaga `ai_quiz_generator` |
| UC-11 | Kreiranje projektnog tima i poziv | Student | 6, 20 | `teams`, `team_members`, obavijest |
| UC-12 | Zajedničko uređivanje bilješki | Tim | 6, 19 | `notes`, `note_versions`, presence |
| UC-13 | Praćenje rokova i ECTS-a | Student | 17 | grafikon i `deadlines`, `grades` |
| UC-14 | Upravljanje osobnim planerom (CRUD) | Student | 3 | dodaj/uredi/završi/obriši zadatak |
| UC-15 | Uvoz i izvoz podataka | Student | 4 | CSV/XLSX/JSON/PDF |
| UC-16 | Postavljanje obavijesti po kanalu | Student | 7 | `notification_preferences` |
| UC-17 | Pretplata i prelazak na Pro | Student | 2 | `subscriptions`, `invoices` |
| UC-18 | Generiranje API ključa i webhooka | Integrator | 8 | `api_keys`, `webhook_endpoints` |
| UC-19 | Moderacija i suspenzija korisnika | Moderator | 10 | `audit_logs`, `users.status` |
| UC-20 | Impersonation korisnika | SuperAdmin | 10 | vidljiv banner + audit zapis |
| UC-21 | Izvoz i brisanje podataka (GDPR) | Student | 11 | `gdpr_exports`, meko brisanje |
| UC-22 | Uključivanje feature flaga po fakultetu | SuperAdmin | 10, 23 | postepeni rollout |

---

## 3. Detaljni tokovi (kritični)

### UC-05 — Upload skripte
1. Student odabire kolegij i datoteku (PDF, slika, max 25 MB).
2. `POST /api/v1/materials` — Zod validacija tipa, veličine i checksuma.
3. `requirePermission('material:upload')` → inače **403**.
4. `set_tenant_context(institution_id, user_id)` unutar transakcije.
5. Datoteka ide u S3/R2; kreira se `materials` (status `pending`) i prva verzija.
6. Worker u redu čeka parsiranje PDF-a, thumbnail i embedding.
7. Moderator ili CourseLead poziva UC-06.

### UC-09 — AI pitanje nad skriptom
1. Student postavi pitanje u kontekstu otvorenog materijala.
2. `requirePermission('ai:use')` i provjera kvote iz `quotas` → inače 403 / 429.
3. Pitanje se ugradi u vektor, pretraže se `ai_embeddings` (HNSW, kosinus).
4. Model dobiva samo relevantne chunkove; odgovor mora sadržavati `citations`
   (dokument, verzija, stranica).
5. `usage_records` bilježi tokene; trošak se ograničava mekom i tvrdom kvotom.
6. Ako AI servis padne, circuit breaker vraća jasnu poruku i sprema posao u `jobs`.

### UC-06 — Verifikacija skripte
1. CourseLead otvara red čekanja svojeg kolegija.
2. `requirePermission('material:verify', materialId)` → inače **403**.
3. Status prelazi u `verified`, piše se `audit_logs`, autor dobiva bodove.
4. Ako je workflow rule `material.verified` aktivna, šalje se obavijest
   pretplatnicima kolegija.

### UC-19 — Moderacija korisnika
1. Moderator pretražuje račune unutar svoje institucije (RLS).
2. Promjena statusa u `suspended` zahtijeva `admin:access`.
3. `UPDATE app.users SET status = ... WHERE id = ...` — obavezan `WHERE`.
4. Audit log bilježi actor, prijašnje i novo stanje, IP i user-agent.

---

## 4. Sigurnosna pravila u svakom use caseu

- Svaka zaštićena ruta: **prvo identitet, zatim dozvola**, pa tek onda podaci.
- Nedozvoljen pristup → **HTTP 403 Forbidden** s jasnom porukom.
- Neovlašteni pokušaj pisanja u tuđi tenant → RLS odbija i upit vraća 0 redaka.
- Sve mutacije imaju CSRF token, validaciju ulaza i audit zapis kritičnih akcija.
- `GuestViewer` smije čitati samo `courses.is_public = true` i javne linkove.
- Impersonation je dopušten samo `SuperAdmin`-u, uz banner i obavezni audit zapis.

---

## 5. Mapa na bazu

| Use case | Tablice |
| --- | --- |
| UC-01/02/03/04 | `users`, `sessions`, `oauth_accounts`, `mfa_totp`, `recovery_codes`, `webauthn_credentials` |
| UC-05/06/07/08/15 | `materials`, `material_versions`, `tags`, `ratings`, `material_comments`, `saved_views`, `media_assets` |
| UC-09/10/17 | `ai_conversations`, `ai_messages`, `ai_embeddings`, `usage_records`, `quotas`, `subscriptions` |
| UC-11/12/14 | `teams`, `team_members`, `notes`, `note_versions`, `presence`, `tasks` |
| UC-13/16 | `deadlines`, `grades`, `analytics_events`, `notifications`, `notification_preferences` |
| UC-18/19/20/21/22 | `api_keys`, `webhook_endpoints`, `audit_logs`, `gdpr_exports`, `feature_flags` |

Potpuni DDL, RLS politike i seed nalaze se u [`schema.sql`](schema.sql).
