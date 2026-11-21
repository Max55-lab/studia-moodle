# Student SaaS Platform — arhitektura i plan implementacije

Ovaj dokument je projektni nacrt za 24 modula opisane u zahtjevu. Opisuje ciljnu arhitekturu,
monorepo strukturu, sigurnosni model i redoslijed izrade. **Ne mijenja postojeći statički demo**
(`index.html`, `assets/`) ni odluku ADR-001: `theme_studia` ostaje produkcijski smjer za SUM,
a portal i proxy su demo/laboratorijski alati. Ovaj dokument je zaseban konceptualni
nacrt koji se može realizirati u novom monorepu ili postupno preseliti iz dema.

---

## 1. Cilj i korisnici

**Problem:** studentski materijali, rokovi, ocjene i bilješke razasuti su po e-kolegijima,
grupama za razmjenu poruka i osobnim datotekama. Student gubi vrijeme tražeći informacije.

**Rješenje:** jedna platforma za objedinjavanje kolegija, skripti, bilješki, timova, rokova,
ECTS-a i AI asistenta nad vlastitim materijalima.

**Korisnici i uloge (RBAC):**

| Uloga | Opseg | Tipične radnje |
| --- | --- | --- |
| `SuperAdmin` | cijeli sustav | upravljanje institucijama, globalne postavke, impersonation |
| `FacultyModerator` | fakultet | moderacija skripti, dodjela moderatora, izvještaji |
| `CourseLead` | kolegij | verifikacija materijala, upravljanje timovima |
| `StudentPro` | vlastiti + timski resursi | upload, AI, kvizovi, projekti |
| `StudentFree` | vlastiti resursi | pregled, ograničeni AI, osnovni planer |
| `GuestViewer` | javni sadržaj | pregled javnih skripti i direktorija |

Pravilo: **svaka zaštićena ruta provjerava identitet i ulogu na poslužitelju prije
izvršavanja**. Nedozvoljen pristup vraća `403 Forbidden` s jasnom porukom. Skrivanje
gumba u korisničkom sučelju nije autorizacija.

---

## 2. Monorepo struktura (Turborepo + pnpm)

```
student-saas/
├── apps/
│   ├── web/                     # Next.js App Router (student portal)
│   ├── admin/                   # Super-admin panel (God Mode)
│   ├── api/                     # tRPC / OpenAPI REST (/api/v1)
│   ├── worker/                  # BullMQ potrošači, cron, PDF/embedding jobovi
│   └── status/                  # javna status stranica
├── packages/
│   ├── ui/                      # @app/ui — design system, pristupačne komponente
│   ├── db/                      # @app/db — Drizzle schema, migracije, RLS politike, seed
│   ├── validators/              # @app/validators — Zod sheme za ulaz/izlaz
│   ├── ai/                      # @app/ai — RAG, tool calling, cost control
│   ├── config/                  # @app/config — ESLint, TS, Tailwind, env schema
│   ├── auth/                    # @app/auth — sesije, RBAC, MFA, OAuth/SAML adapteri
│   └── telemetry/               # @app/telemetry — Sentry, audit, feature flags
├── infra/
│   ├── docker-compose.yml       # Postgres + pgvector, Redis, MinIO (lokalno)
│   ├── migrations/              # SQL migracije (zero-downtime)
│   └── deploy/                  # SSH/systemd/Caddy za studenti.sum.ba
├── docs/
│   ├── ARTITEKTURA.md           # ovaj dokument
│   ├── schema.sql               # potpuna SQL shema + RLS + seed
│   └── DECISIONS.md             # ADR-001 i novi ADR-002 (monorepo)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── AGENTS.md                    # pravila za AI alate
```

**Zajednički paketi** sprječavaju dupliciranje tipova i validacija. End-to-end type safety:
Zod shema je jedini izvor istine; Drizzle izvodi tipove baze; tRPC ih prenosi do React
komponente. Promjena stupca javi grešku pri `pnpm typecheck` prije deploya.

---

## 3. Tehnološke odluke

| Sloj | Tehnologija | Razlog |
| --- | --- | --- |
| Frontend | Next.js App Router, React, Tailwind, Radix-based UI | SSR, streaming, pristupačnost |
| Stanje | TanStack Query + Zustand | optimistični update i rollback, lokalno UI stanje |
| Backend | tRPC + strogo tipizirani REST `/api/v1` | interni i javni API s istim validatorima |
| Baza | PostgreSQL 16 + pgvector + Drizzle ORM | RLS, full-text, vektorska pretraga |
| Keš/redovi | Redis, BullMQ | rate limit, sesije, asinkroni poslovi |
| Pohrana | S3 / Cloudflare R2 | skripti, slike, PDF, privatni download linkovi |
| Auth | NextAuth + OIDC/SAML, WebAuthn, TOTP | akademski IdP, MFA, passkeys |
| Nadzor | Sentry, OpenTelemetry, status stranica | error tracking i APM |
| Deploy | Docker + SSH/Caddy na `studenti.sum.ba` | jednostavan studentski hosting |

---

## 4. Mapa modula na komponente

| # | Modul | Paket/servis | Ključne tablice |
| --- | --- | --- | --- |
| 1 | Auth & Security | `auth`, `web`, `api` | `users`, `roles`, `permissions`, `user_roles`, `sessions`, `mfa_*` |
| 2 | Billing | `api`, `worker` | `plans`, `subscriptions`, `invoices`, `usage_records`, `coupons` |
| 3 | UI/UX | `ui`, `web` | — (command palette, hotkeys, skeletoni, PWA) |
| 4 | Data Engine | `api`, `db` | `materials`, `versions`, `tags`, `ratings`, `saved_views` |
| 5 | AI & Workflows | `ai`, `worker` | `ai_conversations`, `ai_messages`, `ai_embeddings`, `workflow_rules` |
| 6 | Real-Time | `api`, `web` | `presence`, `material_comments`, `note_versions` |
| 7 | Notifications | `api`, `worker` | `notifications`, `notification_preferences` |
| 8 | API & Ecosystem | `api` | `api_keys`, `webhook_endpoints`, `webhook_deliveries` |
| 9 | Jobs & Infrastructure | `worker` | `jobs`, `cache_invalidation` |
| 10 | Super-Admin | `admin` | `feature_flags`, `audit_logs`, `maintenance_state` |
| 11 | Legal & Compliance | `api`, `worker` | `gdpr_exports`, `audit_logs`, `consents` |
| 12 | DevOps & QA | `config`, CI | — (lint, typecheck, test, Sentry, backup) |
| 13 | Customer Success | `web` | `onboarding_state`, `tours`, `feedback_items` |
| 14 | Growth / PLG | `web`, `api` | `referrals`, `public_links`, `waitlist` |
| 15 | i18n / l10n | `ui`, `web` | `translations`, korisnički `locale` stupac |
| 16 | Enterprise Data Layer | `db`, `api` | `custom_fields`, `field_values`, `organizations` |
| 17 | BI & Analytics | `admin`, `web` | `analytics_events`, `scheduled_reports` |
| 18 | Edge & Performance | `web`, `infra` | — (middleware, AVIF/WebP, PgBouncer) |
| 19 | Rich Content & Media | `ui`, `worker` | `notes`, `note_versions`, `document_templates` |
| 20 | Org Management | `api`, `admin` | `teams`, `team_members`, `quotas` |
| 21 | Zero-Trust | `infra`, `api` | `audit_logs`, `sessions`, `byok_keys` |
| 22 | Mobile & Offline | `web` (PWA) | `offline_drafts` (IndexedDB, ne u SQL) |
| 23 | A/B & Telemetry | `telemetry` | `feature_flags`, `analytics_events` |
| 24 | DX & Architecture | monorepo | `turbo.json`, generirani ER/API docs |

---

## 5. Sigurnosni model

### 5.1 Autentikacija
E-mail/lozinka (Argon2id hash), Magic Link, OAuth 2.0 (Google, Microsoft, GitHub),
SAML 2.0 / OIDC za akademske IdP-ove, WebAuthn passkeys i TOTP MFA s recovery kodovima.

### 5.2 Autorizacija — 403 na serveru
Svaki API handler prolazi kroz `requireAuth()` zatim `requirePermission('material:verify')`.
Dozvole se ne izvode iz klijenta. Primjer:

```ts
export const verifyMaterial = protectedProcedure
  .input(z.object({ materialId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    await ctx.auth.requirePermission("material:verify", input.materialId);
    // tek sada upit nad bazom
  });
```

Ako korisnik nema dozvolu, middleware baca `FORBIDDEN` → HTTP 403.

### 5.3 Multi-tenancy i RLS
Svaki upit postavlja `SET LOCAL app.current_user_id` i `app.current_institution_id`
unutar transakcije. PostgreSQL RLS politike koriste helper funkcije
`current_user_id()` i `current_institution_id()` iz `docs/schema.sql`. Time se izolacija
provodi **i u bazi**, ne samo u aplikacijskom kodu.

### 5.4 Mreža
Redis rate limiting po IP-u i korisniku, strogi CORS, CSRF tokeni za mutacije,
CSP zaglavlja, HSTS, TLS 1.3, enkripcija osjetljivih polja (BYOK opcionalno).

---

## 6. ER model (sažetak)

Potpuni DDL je u [`docs/schema.sql`](schema.sql). Skupina entiteta:

- **Organizacija:** `institutions → faculties → programs → courses → enrollments`
- **Identitet:** `users ↔ roles ↔ permissions` preko `user_roles` i `role_permissions`; `sessions`
- **Sadržaj:** `materials → material_versions`, `tags ↔ materials`, `ratings`, `comments`
- **Kolaboracija:** `teams ↔ users`, `notes → note_versions`, `presence`
- **Učenje:** `tasks`, `deadlines`, `grades`, `ai_*`, `workflow_rules`
- **Poslovanje:** `plans → subscriptions → invoices`, `usage_records`, `coupons`
- **Operacije:** `notifications`, `api_keys`, `webhooks`, `audit_logs`, `feature_flags`, `gdpr_exports`

Relacije su 1:N preko `FOREIGN KEY`, mnogo:mnogo preko prelaznih tablica, s `ON DELETE`
pravilima i mekim brisanjem (`deleted_at`) tamo gdje poslovna logika traži povrat.
Svaka tablica ima `id UUID PRIMARY KEY`, `created_at`, `updated_at` i trigger za ažuriranje.

---

## 7. Faze implementacije

1. **Core Auth & Multi-tenancy** — institucije, korisnici, RBAC, RLS, sesije, MFA, 403.
2. **Data Engine & Materials** — kolegiji, upload, verzije, tagovi, pretraga, filteri, soft delete.
3. **Real-Time & Rich Editor** — presence, komentari, blok-uređivač, povijest verzija.
4. **AI Copilot & RAG** — pgvector embeddingi, citati, tool calling, kontrola troškova.
5. **Billing, Super-Admin & Observability** — Stripe, analitika, feature flags, Sentry, backupi.

Svaka faza završava seed skriptom i Playwright E2E testom kritičnog toka.

---

## 8. Testiranje i isporuka

- `pnpm check` → ESLint, TypeScript strict, Zod schema check.
- `pnpm test` → unit testovi (ECTS, dozvole, billing), integracijski (API + testna baza).
- `pnpm test:e2e` → Playwright: prijava, upload, AI upit, naplata, administracija.
- CI na svakom PR-u; deploy putem SSH-a na dodijeljenu putanju `studenti.sum.ba`.

---

## 9. Napomene

- U javni repozitorij ne unose se lozinke, tokeni ni osobni podaci. Seed koristi generičke
  korisnike (`user`, `admin`, `guest`).
- Ovaj dokument je dizajn artefakt; za produkciju je potrebna zasebna ADR odluka koja
  mijenja ili nadopunjuje ADR-001 prije napuštanja theme-first smjera.
