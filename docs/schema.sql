-- =============================================================================
-- Student SaaS Platform — PostgreSQL 16 + pgvector
-- Normalizirana shema, RLS multi-tenancy, RBAC, soft delete i demo seed.
--
-- Pretpostavke: PostgreSQL 16+, pgvector 0.5+ (HNSW indeks), sudo pristup za CREATE EXTENSION.
-- Primjena:  psql "$DATABASE_URL" -f docs/schema.sql
-- Lokalno:   docker compose -f infra/docker-compose.yml up -d
--
-- Skripta koristi CREATE ... IF NOT EXISTS i idempotentne INSERT ... ON CONFLICT,
-- pa se može ponovno pokrenuti na već inicijaliziranoj bazi. U produkciji koristiti
-- migracije iz infra/migrations/.
-- Nema stvarnih lozinki, tokena ni osobnih podataka — seed koristi user/admin/guest.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive e-mail/korisničko ime
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector, RAG pretraga

-- -----------------------------------------------------------------------------
-- 0. Helper funkcije (kontekst tenant-a i revizija)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app.current_institution_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.institution_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app.is_superadmin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.is_superadmin', true), 'false')::boolean;
$$;

-- Svaki upit aplikacije unutar transakcije zove ovu funkciju prije prvog SELECT-a.
-- set_config(..., true) = lokalno za transakciju, pa se kontekst ne prenosi dalje.
CREATE OR REPLACE FUNCTION app.set_tenant_context(
  p_institution uuid,
  p_user uuid,
  p_superadmin boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('app.institution_id', COALESCE(p_institution::text, ''), true);
  PERFORM set_config('app.current_user_id', COALESCE(p_user::text, ''), true);
  PERFORM set_config('app.is_superadmin', p_superadmin::text, true);
END $$;

-- -----------------------------------------------------------------------------
-- 1. Organizacija: institucija -> fakultet -> smjer -> kolegij -> upis
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  domain citext UNIQUE,
  country text NOT NULL DEFAULT 'HR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, short_name)
);

CREATE TABLE IF NOT EXISTS app.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES app.faculties(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text NOT NULL DEFAULT 'undergraduate',
  duration_years integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES app.faculties(id) ON DELETE CASCADE,
  program_id uuid REFERENCES app.programs(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  semester text NOT NULL DEFAULT 'zimski',
  ects integer NOT NULL DEFAULT 0 CHECK (ects >= 0),
  year_of_study integer NOT NULL DEFAULT 1 CHECK (year_of_study BETWEEN 1 AND 6),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, code)
);

-- -----------------------------------------------------------------------------
-- 2. Identitet, RBAC i sesije
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES app.institutions(id) ON DELETE SET NULL,
  username citext NOT NULL UNIQUE,
  email citext NOT NULL UNIQUE,
  -- NULL = korisnik se prijavljuje isključivo OAuth / WebAuthn / Magic Link putem.
  password_hash text,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  locale text NOT NULL DEFAULT 'hr',
  avatar_url text,
  last_login_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Upisi na kolegije ovdje jer ovise o tablici users.
CREATE TABLE IF NOT EXISTS app.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, academic_year)
);

CREATE TABLE IF NOT EXISTS app.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES app.institutions(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, institution_id)
);

CREATE TABLE IF NOT EXISTS app.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.role_permissions (
  role_id uuid NOT NULL REFERENCES app.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES app.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS app.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES app.roles(id) ON DELETE CASCADE,
  scope_type text NOT NULL DEFAULT 'institution' CHECK (scope_type IN ('global','institution','faculty','course','team')),
  scope_id uuid,
  granted_by uuid REFERENCES app.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id, scope_type, scope_id)
);

CREATE TABLE IF NOT EXISTS app.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  ip inet,
  user_agent text,
  device_label text,
  location text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','microsoft','github','aai','oidc','saml')),
  provider_account_id text NOT NULL,
  email citext,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS app.mfa_totp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
  secret_ciphertext bytea NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  credential_id bytea NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Data Engine: materijali, verzije, oznake, ocjene, spremljeni pogledi
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'script' CHECK (material_type IN ('script','exam','notes','slides','video')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  average_rating numeric(3,2) NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  page_count integer,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.material_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES app.materials(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  object_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  checksum_sha256 text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, version_no)
);

CREATE TABLE IF NOT EXISTS app.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, name)
);

CREATE TABLE IF NOT EXISTS app.material_tags (
  material_id uuid NOT NULL REFERENCES app.materials(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES app.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (material_id, tag_id)
);

CREATE TABLE IF NOT EXISTS app.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES app.materials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  value integer NOT NULL CHECK (value BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.material_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES app.materials(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES app.material_comments(id) ON DELETE CASCADE,
  page_number integer,
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  resolved boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL DEFAULT 'material',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns text[] NOT NULL DEFAULT '{}',
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, entity_type)
);

CREATE TABLE IF NOT EXISTS app.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  object_key text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  thumbnail_key text,
  width integer,
  height integer,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, object_key)
);

-- -----------------------------------------------------------------------------
-- 4. Kolaboracija: timovi, bilješke, verzije, live presence
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','archived')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES app.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','lead','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  team_id uuid REFERENCES app.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  -- Block-based editor: niz blokova {type, content, meta}.
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  note_id uuid NOT NULL REFERENCES app.notes(id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  content jsonb NOT NULL,
  author_id uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, version_no)
);

CREATE TABLE IF NOT EXISTS app.presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('material','note','team')),
  resource_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_type, resource_id)
);

-- -----------------------------------------------------------------------------
-- 5. Učenje: zadaci, rokovi, ocjene, AI i automatizacija
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  team_id uuid REFERENCES app.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  due_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES app.courses(id) ON DELETE CASCADE,
  value numeric(3,2) NOT NULL CHECK (value BETWEEN 1 AND 5),
  ects integer NOT NULL DEFAULT 0 CHECK (ects >= 0),
  graded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, graded_at)
);

CREATE TABLE IF NOT EXISTS app.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  material_id uuid REFERENCES app.materials(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Novi razgovor',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES app.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content text NOT NULL,
  -- Obavezni citati: [{document, version, page}].
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  material_version_id uuid REFERENCES app.material_versions(id) ON DELETE CASCADE,
  note_id uuid REFERENCES app.notes(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  embedding vector(1536) NOT NULL,
  source_page integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (material_version_id IS NOT NULL OR note_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS app.usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  metric text NOT NULL CHECK (metric IN ('ai_tokens','storage_gb','api_calls','material_uploads')),
  amount numeric(14,4) NOT NULL DEFAULT 0,
  unit text NOT NULL,
  period_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.workflow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  name text NOT NULL,
  trigger_event text NOT NULL,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. Billing: paketi, pretplate, računi, kuponi
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app.users(id) ON DELETE SET NULL,
  team_id uuid REFERENCES app.teams(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES app.plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','canceled','paused')),
  billing_interval text NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly','yearly','lifetime')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  provider text NOT NULL DEFAULT 'stripe',
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES app.subscriptions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE RESTRICT,
  number text NOT NULL UNIQUE,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  pdf_url text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  percent_off integer CHECK (percent_off BETWEEN 1 AND 100),
  amount_off numeric(10,2),
  max_redemptions integer,
  times_redeemed integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES app.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 7. Obavijesti, API, webhookovi i pozadinski poslovi
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  group_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_app','email','web_push','off')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_type, channel)
);

CREATE TABLE IF NOT EXISTS app.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT '{}',
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret_hash text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  endpoint_id uuid NOT NULL REFERENCES app.webhook_endpoints(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed')),
  attempts integer NOT NULL DEFAULT 0,
  response text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES app.institutions(id) ON DELETE CASCADE,
  queue text NOT NULL DEFAULT 'default',
  name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','completed','failed')),
  attempts integer NOT NULL DEFAULT 0,
  run_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. Super-admin, sigurnost, legal i feature flags
-- -----------------------------------------------------------------------------
-- Append-only; revizijski zapis se nikad ne mijenja niti briše iz aplikacije.
CREATE TABLE IF NOT EXISTS app.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES app.institutions(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES app.users(id) ON DELETE SET NULL,
  impersonated boolean NOT NULL DEFAULT false,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percent integer NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.maintenance_state (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.gdpr_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  format text NOT NULL DEFAULT 'json' CHECK (format IN ('json','zip')),
  object_url text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('tos','privacy','cookie','copyright')),
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip inet,
  UNIQUE (user_id, document_type, version)
);

CREATE TABLE IF NOT EXISTS app.byok_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai','anthropic','database')),
  key_ciphertext bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. Enterprise data layer, onboarding, rast i analitika
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','number','select','date','relation')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, entity_type, key)
);

CREATE TABLE IF NOT EXISTS app.field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES app.custom_fields(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, entity_id)
);

CREATE TABLE IF NOT EXISTS app.quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('user','team','institution')),
  subject_id uuid NOT NULL,
  resource text NOT NULL,
  limit_value integer NOT NULL DEFAULT 0,
  used_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id, resource)
);

CREATE TABLE IF NOT EXISTS app.onboarding_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE REFERENCES app.users(id) ON DELETE CASCADE,
  step integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  tour_key text NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tour_key)
);

CREATE TABLE IF NOT EXISTS app.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  name text NOT NULL,
  body text NOT NULL,
  variables text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  invitee_id uuid REFERENCES app.users(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed_up','rewarded')),
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.public_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('material','note','team','report')),
  resource_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  password_hash text,
  expires_at timestamptz,
  views integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  email citext NOT NULL,
  invited_by uuid REFERENCES app.users(id) ON DELETE SET NULL,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','invited','joined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, email)
);

CREATE TABLE IF NOT EXISTS app.feedback_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','planned','shipped','closed')),
  votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.analytics_events (
  id bigserial PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES app.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES app.courses(id) ON DELETE SET NULL,
  name text NOT NULL,
  recipients text[] NOT NULL DEFAULT '{}',
  cadence text NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('daily','weekly','monthly')),
  format text NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf','xlsx')),
  next_run_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.translations (
  locale text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (locale, key)
);

CREATE TABLE IF NOT EXISTS app.offline_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES app.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 10. Indeksi, full-text i vektorska pretraga
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_materials_course ON app.materials(course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_materials_status ON app.materials(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_materials_fts ON app.materials
  USING gin (to_tsvector('croatian', coalesce(title,'') || ' ' || coalesce(description,'')));
CREATE INDEX IF NOT EXISTS idx_notes_fts ON app.notes
  USING gin (to_tsvector('croatian', coalesce(title,'') || ' ' || coalesce(content::text,'')));
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_vector ON app.ai_embeddings
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_embeddings_material ON app.ai_embeddings(material_version_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON app.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON app.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON app.sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due ON app.tasks(user_id, due_at) WHERE done = false AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grades_user ON app.grades(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_time ON app.analytics_events(event_name, occurred_at DESC);

-- -----------------------------------------------------------------------------
-- 11. Automatski triggeri za updated_at (sve tablice koje imaju stupac)
-- -----------------------------------------------------------------------------
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'app' AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON app.%I', t.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON app.%I '
      'FOR EACH ROW EXECUTE FUNCTION app.set_updated_at()', t.table_name);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 12. Row-Level Security — izolacija po instituciji
-- Sve tablice s institution_id dobivaju istu politiku. Superadmin i eksplicitni
-- servicing context (app.is_superadmin) jedini zaobilaze izolaciju.
-- -----------------------------------------------------------------------------
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'app' AND column_name = 'institution_id'
    GROUP BY table_name
  LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t.table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON app.%I', t.table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON app.%I FOR ALL '
      'USING (app.is_superadmin() OR institution_id = app.current_institution_id()) '
      'WITH CHECK (app.is_superadmin() OR institution_id = app.current_institution_id())',
      t.table_name);
  END LOOP;
END $$;

-- Institucije same po sebi nemaju institution_id.
ALTER TABLE app.institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS institution_isolation ON app.institutions;
CREATE POLICY institution_isolation ON app.institutions FOR ALL
  USING (app.is_superadmin() OR id = app.current_institution_id())
  WITH CHECK (app.is_superadmin() OR id = app.current_institution_id());

-- Globalne tablice ( permissions, plans, feature_flags, translations,
-- maintenance_state ) namjerno ostaju bez RLS-a: javni su kontekst, ne podaci
-- pojedinog tenanta.

-- Korisnik uvijek vidi samog sebe, čak i ako mu institucija nije postavljena.
DROP POLICY IF EXISTS users_self_access ON app.users;
CREATE POLICY users_self_access ON app.users FOR SELECT
  USING (id = app.current_user_id() OR app.is_superadmin());

-- Brisanje je meko: aplikacija nikad ne izdaje fizički DELETE nad ovim tablicama.
COMMENT ON COLUMN app.materials.deleted_at IS 'Soft delete; trash zadržava zapis 30 dana.';
COMMENT ON COLUMN app.notes.deleted_at IS 'Soft delete; moguć povrat iz Trash-a.';
COMMENT ON TABLE app.audit_logs IS 'Append-only revizijski trag; ne mijenjati iz aplikacije.';
COMMENT ON TABLE app.ai_embeddings IS 'pgvector indeks za RAG; svaki odgovor mora navesti citat iz chunk_text.';

-- -----------------------------------------------------------------------------
-- 13. Seed — isključivo generički korisnici i izmišljeni podaci
-- -----------------------------------------------------------------------------
-- Vlasnik tablice zaobilazi RLS, ali eksplicitno postavljamo superadmin kontekst
-- kako bi seed radio i kada se skripta pokreće pod ograničenom ulogom.
SELECT app.set_tenant_context(NULL, NULL, true);

INSERT INTO app.institutions (id, name, short_name, domain, country) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sveučilište u Mostaru', 'SUM', 'sum.ba', 'HR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.faculties (id, institution_id, name, short_name) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001',
   'Fakultet prirodoslovno-matematičkih i odgojnih znanosti', 'FPMOZ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.programs (id, institution_id, faculty_id, name, level, duration_years) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011', 'Računarstvo', 'undergraduate', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.courses (id, institution_id, faculty_id, program_id, code, name, semester, ects, year_of_study, is_public) VALUES
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021',
   'FPMOZINB505', 'Razvoj web aplikacija', 'zimski', 6, 5, true),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021',
   'FPMOZINB402', 'Baze podataka', 'zimski', 5, 4, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.users (id, institution_id, username, email, password_hash, display_name, status, locale) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
   'admin', 'admin@demo.sum.ba', NULL, 'Super Admin', 'active', 'hr'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001',
   'user', 'user@demo.sum.ba', NULL, 'user', 'active', 'hr'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001',
   'guest', 'guest@demo.sum.ba', NULL, 'Guest Viewer', 'active', 'hr'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001',
   'moderator', 'moderator@demo.sum.ba', NULL, 'Faculty Moderator', 'active', 'hr')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.roles (id, institution_id, key, name, is_system) VALUES
  ('00000000-0000-0000-0000-000000000201', NULL, 'SuperAdmin', 'Super Administrator', true),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'FacultyModerator', 'Faculty Moderator', true),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'CourseLead', 'Course Lead', true),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', 'StudentPro', 'Student Pro', true),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000001', 'StudentFree', 'Student Free', true),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000001', 'GuestViewer', 'Guest Viewer', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.permissions (id, key, description) VALUES
  ('00000000-0000-0000-0000-000000000301', 'material:read', 'Čitanje materijala'),
  ('00000000-0000-0000-0000-000000000302', 'material:upload', 'Upload materijala'),
  ('00000000-0000-0000-0000-000000000303', 'material:verify', 'Verifikacija materijala'),
  ('00000000-0000-0000-0000-000000000304', 'material:delete', 'Brisanje materijala'),
  ('00000000-0000-0000-0000-000000000305', 'course:manage', 'Upravljanje kolegijem'),
  ('00000000-0000-0000-0000-000000000306', 'admin:access', 'Pristup administraciji'),
  ('00000000-0000-0000-0000-000000000307', 'ai:use', 'Korištenje AI asistenta')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
JOIN app.permissions p ON p.key = ANY(CASE r.key
  WHEN 'SuperAdmin' THEN ARRAY['material:read','material:upload','material:verify','material:delete','course:manage','admin:access','ai:use']
  WHEN 'FacultyModerator' THEN ARRAY['material:read','material:verify','material:delete','course:manage']
  WHEN 'CourseLead' THEN ARRAY['material:read','material:verify','course:manage','ai:use']
  WHEN 'StudentPro' THEN ARRAY['material:read','material:upload','ai:use']
  WHEN 'StudentFree' THEN ARRAY['material:read','material:upload']
  ELSE ARRAY['material:read']
END)
ON CONFLICT DO NOTHING;

INSERT INTO app.user_roles (id, institution_id, user_id, role_id, scope_type) VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 'global'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000204', 'institution'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000206', 'institution'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000202', 'faculty')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.plans (id, code, name, price_monthly, price_yearly, limits) VALUES
  ('00000000-0000-0000-0000-000000000501', 'free', 'Student Free', 0, 0,
   '{"ai_tokens": 1000, "storage_gb": 1, "teams": 1}'::jsonb),
  ('00000000-0000-0000-0000-000000000502', 'pro', 'Student Pro', 6.99, 59.99,
   '{"ai_tokens": 50000, "storage_gb": 10, "teams": 10}'::jsonb),
  ('00000000-0000-0000-0000-000000000503', 'team', 'Team / Faculty', 19.99, 179.99,
   '{"ai_tokens": 250000, "storage_gb": 100, "teams": 100}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.enrollments (id, institution_id, user_id, course_id, academic_year, status) VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000031',
   '2026./2027.', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.materials (id, institution_id, course_id, uploader_id, title, description, material_type, status, average_rating, downloads, page_count) VALUES
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000102',
   'Skripta: Routing i kontroleri', 'Poglavlja 1–6, primjeri iz laboratorijskih vježbi.',
   'script', 'verified', 4.70, 128, 42),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000102',
   'Ispitni rok — Eloquent ORM', 'Rješenja s kolokvija iz zimskog semestra.',
   'exam', 'pending', 0, 0, 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.material_versions (id, institution_id, material_id, version_no, object_key, mime_type, size_bytes, checksum_sha256, uploaded_by) VALUES
  ('00000000-0000-0000-0000-000000000711', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000701', 1, 'seed/script-routing-v1.pdf', 'application/pdf',
   524288, '0000000000000000000000000000000000000000000000000000000000000000',
   '00000000-0000-0000-0000-000000000102')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.tags (id, institution_id, name) VALUES
  ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000001', 'routing'),
  ('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000001', 'kolokvij')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.material_tags (material_id, tag_id) VALUES
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000721'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000722')
ON CONFLICT DO NOTHING;

INSERT INTO app.teams (id, institution_id, course_id, owner_id, name, description, status) VALUES
  ('00000000-0000-0000-0000-000000000731', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000102',
   'Tim za projekt iz RWA', 'Dvočlani tim za završni projekt.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.team_members (id, institution_id, team_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000741', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000731', '00000000-0000-0000-0000-000000000102', 'owner')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.notes (id, institution_id, owner_id, course_id, team_id, title, content) VALUES
  ('00000000-0000-0000-0000-000000000751', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000031',
   '00000000-0000-0000-0000-000000000731', 'Bilješke — MVC i Eloquent',
   '[{"type":"heading","content":"Kontroleri"},{"type":"paragraph","content":"Route -> Controller -> Model -> View."}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.tasks (id, institution_id, user_id, course_id, team_id, title, done, due_at) VALUES
  ('00000000-0000-0000-0000-000000000761', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000031', NULL,
   'Predati projektni zadatak', false, '2026-11-27T09:00:00+01'),
  ('00000000-0000-0000-0000-000000000762', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', NULL, '00000000-0000-0000-0000-000000000731',
   'Priprema prezentacije', false, '2026-11-30T18:00:00+01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.deadlines (id, institution_id, course_id, title, due_at) VALUES
  ('00000000-0000-0000-0000-000000000771', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000031', 'Kolokvij — Web aplikacije', '2026-11-27T09:00:00+01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.grades (id, institution_id, user_id, course_id, value, ects, graded_at) VALUES
  ('00000000-0000-0000-0000-000000000781', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000031',
   4.70, 6, '2026-10-15T12:00:00+02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.subscriptions (id, institution_id, user_id, plan_id, status, billing_interval, trial_ends_at) VALUES
  ('00000000-0000-0000-0000-000000000791', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000501',
   'active', 'monthly', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.notifications (id, institution_id, user_id, type, title, body, link) VALUES
  ('00000000-0000-0000-0000-0000000007A1', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', 'deadline', 'Novi rok',
   'Kolokvij iz Web aplikacija je 27. 11. 2026.', '/raspored')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.feature_flags (id, key, description, enabled, rollout_percent) VALUES
  ('00000000-0000-0000-0000-0000000007B1', 'ai_quiz_generator', 'AI generator probnih kvizova', true, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.maintenance_state (id, enabled, message) VALUES
  (true, false, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.translations (locale, key, value) VALUES
  ('hr', 'nav.dashboard', 'Nadzorna ploča'),
  ('hr', 'nav.courses', 'Kolegiji'),
  ('en', 'nav.dashboard', 'Dashboard'),
  ('en', 'nav.courses', 'Courses')
ON CONFLICT (locale, key) DO NOTHING;

INSERT INTO app.onboarding_state (id, institution_id, user_id, step, completed, answers) VALUES
  ('00000000-0000-0000-0000-0000000007C1', '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000102', 4, true,
   '{"role":"StudentPro","program":"Računarstvo","year":2}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app.quotas (id, institution_id, subject_type, subject_id, resource, limit_value, used_value) VALUES
  ('00000000-0000-0000-0000-0000000007D1', '00000000-0000-0000-0000-000000000001',
   'user', '00000000-0000-0000-0000-000000000102', 'ai_tokens', 50000, 1240)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 14. Kratka provjera uspješnosti
-- -----------------------------------------------------------------------------
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'app') AS broj_tablica,
  (SELECT count(*) FROM information_schema.policies WHERE schemaname = 'app') AS broj_politika,
  (SELECT count(*) FROM app.users) AS broj_korisnika,
  (SELECT count(*) FROM app.materials) AS broj_materijala;

COMMIT;
