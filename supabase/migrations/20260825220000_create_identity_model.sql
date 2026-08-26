create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.app_role as enum ('USER', 'ADMIN');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 2 and 80),
  constraint profiles_avatar_path_owned check (
    avatar_path is null
    or avatar_path like id::text || '/%'
  )
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'USER',
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_roles_role_idx on public.user_roles (role);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_display_name text;
begin
  requested_display_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(requested_display_name, 'Miembro'));

  insert into public.user_roles (user_id, role)
  values (new.id, 'USER');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'ADMIN'
  );
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_path) on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;

create policy "Users read their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy "Admins read all profiles"
on public.profiles
for select
to authenticated
using ((select private.is_admin()));

create policy "Users update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = id
);

create policy "Users read their own role"
on public.user_roles
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

create policy "Admins read all roles"
on public.user_roles
for select
to authenticated
using ((select private.is_admin()));

comment on table public.profiles is 'User-editable identity fields associated one-to-one with auth.users.';
comment on table public.user_roles is 'Application authorization roles. Client roles have read-only access through RLS.';
comment on function private.is_admin() is 'Returns whether the current authenticated user has the ADMIN application role.';
