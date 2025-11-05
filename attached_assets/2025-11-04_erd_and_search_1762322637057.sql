-- 2025-11-04_erd_and_search.sql
-- Purpose: ERD (i³ hierarchy, roles/agents, knowledge links, Work Orders, Ops events)
--          + search prerequisites (extensions, indexes, optional tsv triggers).

-- ===== Extensions =====
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ===== Enums =====
do $$ begin
  create type autonomy_level as enum ('L0','L1','L2','L3');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lifecycle_status as enum ('pilot','live','watch','rollback');
exception when duplicate_object then null; end $$;

-- ===== Core hierarchy =====
create table if not exists company (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists business_unit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id) on delete cascade,
  name text not null,
  slug text not null unique
);

create table if not exists brand (
  id uuid primary key default gen_random_uuid(),
  bu_id uuid not null references business_unit(id) on delete cascade,
  name text not null,
  slug text not null,
  unique (bu_id, slug)
);

create table if not exists product (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brand(id) on delete cascade,
  name text not null,
  type text,
  slug text not null,
  unique (brand_id, slug)
);

create table if not exists project (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  title text not null,
  status text not null default 'active',
  due_date date
);

create table if not exists task (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  assignee_agent_id uuid,
  due_date date
);

-- ===== Roles & Agents =====
create table if not exists role_def (
  handle text primary key,            -- canonical role handle (e.g., "product_owner")
  name text not null,
  description text
);

create table if not exists agent (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_handle text references role_def(handle) on delete set null,
  autonomy autonomy_level not null default 'L1',
  status lifecycle_status not null default 'pilot',
  next_gate int check (next_gate between 1 and 4),
  success_pct numeric(5,2),           -- rolling
  p95_s numeric(6,2),                 -- rolling
  cost_usd numeric(8,3),              -- rolling median/avg
  tags text[]
);

create index if not exists idx_agent_role on agent(role_handle);
create index if not exists idx_agent_perf on agent(status, next_gate);

-- Optional: agent assignment to a context (e.g., BU/Brand/Product/Project)
create table if not exists agent_assignment (
  agent_id uuid not null references agent(id) on delete cascade,
  owner_type text not null check (owner_type in ('BU','BRAND','PRODUCT','PROJECT')),
  owner_id uuid not null,
  primary key (agent_id, owner_type, owner_id)
);

-- ===== Knowledge links (Google Drive folders) =====
create table if not exists knowledge_link (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('BU','BRAND','PRODUCT')),
  owner_id uuid not null,
  role text not null check (role in ('read','draft','publish')),
  drive_folder_id text not null
);
create index if not exists idx_knowledge_owner on knowledge_link(owner_type, owner_id);

-- ===== Work Orders & Runs (draft-first; budgets/logs) =====
create table if not exists work_order (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner text not null,
  autonomy autonomy_level not null default 'L1',
  inputs text not null,
  output text not null,
  caps_runs_per_day int not null default 100,
  caps_usd_per_day numeric(8,3) not null default 2.000,
  kpi_success_min int not null default 90,
  kpi_p95_max numeric(6,2) not null default 3.00,
  playbook text,
  stop text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists work_order_run (
  id uuid primary key default gen_random_uuid(),
  wo_id uuid not null references work_order(id) on delete cascade,
  agent_name text not null,
  status text not null,               -- queued|running|done|failed
  ms int not null,
  cost numeric(8,3) not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  mirror text                         -- "Drafts ready → /drafts/path"
);
create index if not exists idx_wor_woid_time on work_order_run(wo_id, started_at desc);

-- ===== Ops events (for audit dashboards) =====
create table if not exists ops_event (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor text,                         -- user/agent id or name
  kind text not null,                 -- e.g., "PROMOTE", "WO_START", "PUBLISH", "ERROR"
  owner_type text, owner_id uuid,     -- optional context (BU/Brand/Product/Project)
  message text,
  meta jsonb
);
create index if not exists idx_ops_event_time on ops_event(at desc);
create index if not exists idx_ops_event_kind on ops_event(kind);

-- ===== Search plumbing =====
-- Trigram indexes for forgiving matches
create index if not exists idx_brand_name_trgm    on brand   using gin (name gin_trgm_ops);
create index if not exists idx_product_name_trgm  on product using gin (name gin_trgm_ops);
create index if not exists idx_project_title_trgm on project using gin (title gin_trgm_ops);
create index if not exists idx_task_title_trgm    on task    using gin (title gin_trgm_ops);
create index if not exists idx_agent_name_trgm    on agent   using gin (name gin_trgm_ops);

-- Optional FTS columns + triggers (simple vector on name/title)
alter table if exists project  add column if not exists tsv tsvector;
alter table if exists product  add column if not exists tsv tsvector;
alter table if exists brand    add column if not exists tsv tsvector;
alter table if exists task     add column if not exists tsv tsvector;
alter table if exists agent    add column if not exists tsv tsvector;

create index if not exists idx_project_tsv on project using gin (tsv);
create index if not exists idx_product_tsv on product using gin (tsv);
create index if not exists idx_brand_tsv   on brand   using gin (tsv);
create index if not exists idx_task_tsv    on task    using gin (tsv);
create index if not exists idx_agent_tsv   on agent   using gin (tsv);

create or replace function tsv_update() returns trigger as $$
begin
  new.tsv := to_tsvector('simple', unaccent(coalesce(new.name, new.title, '')));
  return new;
end $$ language plpgsql;

drop trigger if exists tsv_project on project;
create trigger tsv_project before insert or update on project
for each row execute procedure tsv_update();

drop trigger if exists tsv_product on product;
create trigger tsv_product before insert or update on product
for each row execute procedure tsv_update();

drop trigger if exists tsv_brand on brand;
create trigger tsv_brand before insert or update on brand
for each row execute procedure tsv_update();

drop trigger if exists tsv_task on task;
create trigger tsv_task before insert or update on task
for each row execute procedure tsv_update();

drop trigger if exists tsv_agent on agent;
create trigger tsv_agent before insert or update on agent
for each row execute procedure tsv_update();
