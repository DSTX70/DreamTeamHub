create table if not exists ops_settings (
  key text primary key,
  value jsonb not null,
  locked boolean not null default false,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

create table if not exists ops_settings_audit (
  id bigserial primary key,
  key text not null,
  prev_value jsonb,
  new_value jsonb,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

create or replace function log_ops_settings_changes()
returns trigger as $$
begin
  insert into ops_settings_audit(key, prev_value, new_value, updated_by)
  values (OLD.key, OLD.value, NEW.value, NEW.updated_by);
  return NEW;
end; $$ language plpgsql;

drop trigger if exists trg_ops_settings_audit on ops_settings;
create trigger trg_ops_settings_audit
before update on ops_settings
for each row execute function log_ops_settings_changes();

insert into ops_settings(key, value, locked, updated_by)
values (
  'uploads',
  jsonb_build_object(
    'enabled', true,
    'allowlist','json,csv,zip,webp,png,svg,txt,md',
    'max_mb',25,
    'visible_to','pod'
  ),
  false,
  'seed'
)
on conflict (key) do nothing;
