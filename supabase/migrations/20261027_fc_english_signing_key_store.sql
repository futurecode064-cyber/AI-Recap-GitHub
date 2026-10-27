create schema if not exists app_private;
create table if not exists app_private.fc_english_signing (
  id smallint primary key check (id = 1),
  store_password text not null,
  keystore_b64 text not null,
  key_alias text not null,
  created_at timestamptz not null default now()
);
alter table app_private.fc_english_signing enable row level security;
revoke all on table app_private.fc_english_signing from public, anon, authenticated, service_role;
