-- Restore the administrator/content schema that exists in the linked project
-- but was missing from the repository migration history.

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'legal_acceptance_source') then
    create type public.legal_acceptance_source as enum ('SIGN_UP', 'ACCOUNT_RECONSENT');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'legal_document_status') then
    create type public.legal_document_status as enum ('DRAFT', 'PUBLISHED', 'RETIRED');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'legal_document_type') then
    create type public.legal_document_type as enum ('PRIVACY_NOTICE', 'TERMS_OF_USE', 'COOKIE_NOTICE');
  end if;
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'legal_review_status') then
    create type public.legal_review_status as enum ('PENDING_REVIEW', 'APPROVED');
  end if;
end;
$$;

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type public.legal_document_type not null,
  version text not null,
  title text not null,
  summary text not null,
  content text not null,
  status public.legal_document_status not null default 'DRAFT',
  review_status public.legal_review_status not null default 'PENDING_REVIEW',
  is_current boolean not null default false,
  effective_at timestamptz,
  approval_reference text,
  created_by uuid references auth.users (id) on delete set null,
  published_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint legal_documents_approval_reference check (
    review_status <> 'APPROVED'
    or char_length(btrim(approval_reference)) between 3 and 240
  ),
  constraint legal_documents_content_length check (char_length(btrim(content)) between 100 and 20000),
  constraint legal_documents_current_published check (not is_current or status = 'PUBLISHED'),
  constraint legal_documents_published_metadata check (
    status <> 'PUBLISHED' or (effective_at is not null and published_at is not null)
  ),
  constraint legal_documents_summary_length check (char_length(btrim(summary)) between 10 and 500),
  constraint legal_documents_title_length check (char_length(btrim(title)) between 5 and 160),
  constraint legal_documents_version_length check (char_length(btrim(version)) between 3 and 40),
  constraint legal_documents_type_version_unique unique (document_type, version)
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_key_format check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint site_settings_value_object check (jsonb_typeof(value) = 'object')
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  url text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  icon_image_path text,
  constraint social_links_https_url check (url ~ '^https://'),
  constraint social_links_icon_image_path_format check (
    icon_image_path is null
    or icon_image_path ~ '^social-icons/[0-9a-f-]{36}/[0-9a-f-]{36}\.(avif|jpg|png|webp)$'
  ),
  constraint social_links_icon_length check (char_length(btrim(icon)) between 2 and 40),
  constraint social_links_name_length check (char_length(btrim(name)) between 2 and 60),
  constraint social_links_sort_order_range check (sort_order between 0 and 1000)
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null,
  description text not null,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  image_path text,
  constraint team_members_description_length check (char_length(btrim(description)) between 10 and 600),
  constraint team_members_https_image check (image_url is null or image_url ~ '^https://'),
  constraint team_members_image_path_length check (image_path is null or char_length(image_path) between 1 and 512),
  constraint team_members_name_length check (char_length(btrim(name)) between 2 and 80),
  constraint team_members_role_length check (char_length(btrim(role_title)) between 2 and 100),
  constraint team_members_sort_order_range check (sort_order between 0 and 1000)
);

create table if not exists public.user_legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  legal_document_id uuid not null references public.legal_documents (id) on delete restrict,
  source public.legal_acceptance_source not null,
  accepted_at timestamptz not null default now(),
  constraint user_legal_acceptances_document_unique unique (user_id, legal_document_id)
);

create unique index if not exists legal_documents_current_type_unique
on public.legal_documents (document_type)
where is_current;

create index if not exists legal_documents_public_history_idx
on public.legal_documents (document_type, effective_at desc)
where status in ('PUBLISHED', 'RETIRED');

create index if not exists social_links_active_order_idx
on public.social_links (active, sort_order, name);

create index if not exists team_members_active_order_idx
on public.team_members (active, sort_order, name);

create index if not exists user_legal_acceptances_user_idx
on public.user_legal_acceptances (user_id, accepted_at desc);

drop trigger if exists legal_documents_set_updated_at on public.legal_documents;
create trigger legal_documents_set_updated_at
before update on public.legal_documents
for each row execute function private.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function private.set_updated_at();

drop trigger if exists social_links_set_updated_at on public.social_links;
create trigger social_links_set_updated_at
before update on public.social_links
for each row execute function private.set_updated_at();

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
before update on public.team_members
for each row execute function private.set_updated_at();

create or replace function public.accept_current_legal_documents()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_count integer;
  current_document_count integer;
  current_user_id uuid;
begin
  current_user_id := (select auth.uid());
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select count(*) into current_document_count
  from public.legal_documents
  where document_type in ('PRIVACY_NOTICE', 'TERMS_OF_USE')
    and status = 'PUBLISHED'
    and is_current;

  if current_document_count <> 2 then
    raise exception using errcode = 'P0001', message = 'CURRENT_LEGAL_DOCUMENTS_UNAVAILABLE';
  end if;

  insert into public.user_legal_acceptances (user_id, legal_document_id, source)
  select current_user_id, id, 'ACCOUNT_RECONSENT'
  from public.legal_documents
  where document_type in ('PRIVACY_NOTICE', 'TERMS_OF_USE')
    and status = 'PUBLISHED'
    and is_current
  on conflict (user_id, legal_document_id) do nothing;

  get diagnostics accepted_count = row_count;
  return accepted_count;
end;
$$;

create or replace function public.admin_adjust_user_points(
  p_user_id uuid,
  p_points integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  current_total integer;
begin
  actor_id := (select auth.uid());
  if actor_id is null or not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_points = 0 or p_points < -1000 or p_points > 1000 then
    raise exception using errcode = '22023', message = 'POINT_ADJUSTMENT_OUT_OF_RANGE';
  end if;
  if char_length(btrim(p_reason)) < 5 or char_length(btrim(p_reason)) > 240 then
    raise exception using errcode = '22023', message = 'POINT_ADJUSTMENT_REASON_INVALID';
  end if;

  select total_points into current_total
  from public.profiles
  where id = p_user_id
  for update;

  if current_total is null then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;
  if current_total + p_points < 0 then
    raise exception using errcode = '22023', message = 'POINT_TOTAL_CANNOT_BE_NEGATIVE';
  end if;

  insert into public.points_history (user_id, event_id, action, points, metadata, created_by)
  values (p_user_id, null, 'MANUAL_ADJUSTMENT', p_points, jsonb_build_object('reason', btrim(p_reason)), actor_id);

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'points.adjusted',
    'user',
    p_user_id,
    jsonb_build_object(
      'adjustment', p_points,
      'previous_total', current_total,
      'new_total', current_total + p_points,
      'reason', btrim(p_reason)
    )
  );
end;
$$;

create or replace function public.admin_list_users(p_search text)
returns table (
  user_id uuid,
  email text,
  display_name text,
  role public.app_role,
  created_at timestamptz,
  total_points integer,
  total_certifications integer,
  registration_count bigint,
  attendance_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  return query
  select
    profile.id,
    account.email::text,
    profile.display_name,
    user_role.role,
    profile.created_at,
    profile.total_points,
    profile.total_certifications,
    count(distinct registration.id),
    count(distinct attendance_record.id) filter (where attendance_record.attended)
  from public.profiles as profile
  join auth.users as account on account.id = profile.id
  join public.user_roles as user_role on user_role.user_id = profile.id
  left join public.event_registrations as registration on registration.user_id = profile.id
  left join public.attendance as attendance_record on attendance_record.user_id = profile.id
  where btrim(p_search) = ''
    or profile.display_name ilike '%' || btrim(p_search) || '%'
    or account.email ilike '%' || btrim(p_search) || '%'
  group by profile.id, account.email, user_role.role
  order by profile.created_at desc
  limit 200;
end;
$$;

create or replace function public.admin_set_certification_total(p_user_id uuid, p_total integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  active_event_total integer;
  active_manual_total integer;
  current_total integer;
  difference integer;
begin
  actor_id := (select auth.uid());
  if actor_id is null or not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_total < 0 or p_total > 100 then
    raise exception using errcode = '22023', message = 'CERTIFICATION_TOTAL_OUT_OF_RANGE';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  select
    count(*) filter (where event_id is not null),
    count(*) filter (where event_id is null)
  into active_event_total, active_manual_total
  from public.certifications
  where user_id = p_user_id and revoked_at is null;

  current_total := active_event_total + active_manual_total;
  if p_total < active_event_total then
    raise exception using errcode = 'P0001', message = 'EVENT_CERTIFICATIONS_CANNOT_BE_REMOVED';
  end if;

  difference := p_total - current_total;
  if difference > 0 then
    insert into public.certifications (user_id, event_id, certificate_name, issued_at, created_by)
    select p_user_id, null, 'Reconocimiento administrativo ' || (active_manual_total + sequence_number)::text, current_date, actor_id
    from generate_series(1, difference) as sequence_number;
  elsif difference < 0 then
    update public.certifications
    set revoked_at = now(), revoked_by = actor_id
    where id in (
      select id
      from public.certifications
      where user_id = p_user_id and event_id is null and revoked_at is null
      order by issued_at desc, created_at desc
      limit abs(difference)
    );
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (actor_id, 'certification.total_adjusted', 'user', p_user_id, jsonb_build_object('previous_total', current_total, 'new_total', p_total));
end;
$$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
begin
  actor_id := (select auth.uid());
  if actor_id is null or not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_user_id = actor_id and p_role <> 'ADMIN' then
    raise exception using errcode = 'P0001', message = 'ADMIN_CANNOT_REMOVE_OWN_ROLE';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  update public.user_roles
  set role = p_role, assigned_by = actor_id
  where user_id = p_user_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (actor_id, 'user.role_updated', 'user', p_user_id, jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.approve_and_publish_legal_document(p_document_id uuid, p_approval_reference text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_document public.legal_documents%rowtype;
begin
  actor_id := (select auth.uid());
  if actor_id is null or not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_approval_reference is null or char_length(btrim(p_approval_reference)) not between 3 and 240 then
    raise exception using errcode = '22023', message = 'LEGAL_APPROVAL_REFERENCE_REQUIRED';
  end if;

  select * into target_document
  from public.legal_documents
  where id = p_document_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'LEGAL_DOCUMENT_NOT_FOUND';
  end if;
  if target_document.status <> 'DRAFT' then
    raise exception using errcode = 'P0001', message = 'LEGAL_DOCUMENT_NOT_DRAFT';
  end if;
  if target_document.effective_at is null then
    raise exception using errcode = 'P0001', message = 'LEGAL_EFFECTIVE_DATE_REQUIRED';
  end if;

  update public.legal_documents
  set is_current = false, status = 'RETIRED'
  where document_type = target_document.document_type and is_current;

  update public.legal_documents
  set approval_reference = btrim(p_approval_reference),
      is_current = true,
      published_at = now(),
      published_by = actor_id,
      review_status = 'APPROVED',
      status = 'PUBLISHED'
  where id = target_document.id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'legal_document.published',
    'legal_document',
    target_document.id,
    jsonb_build_object(
      'approval_reference', btrim(p_approval_reference),
      'document_type', target_document.document_type::text,
      'version', target_document.version
    )
  );
end;
$$;

create or replace function public.create_legal_document(
  p_document_type public.legal_document_type,
  p_version text,
  p_title text,
  p_summary text,
  p_content text,
  p_effective_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  new_document_id uuid;
begin
  actor_id := (select auth.uid());
  if actor_id is null or not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  insert into public.legal_documents (document_type, version, title, summary, content, effective_at, created_by)
  values (p_document_type, btrim(p_version), btrim(p_title), btrim(p_summary), btrim(p_content), p_effective_at, actor_id)
  returning id into new_document_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (actor_id, 'legal_document.created', 'legal_document', new_document_id, jsonb_build_object('document_type', p_document_type::text, 'version', btrim(p_version)));

  return new_document_id;
end;
$$;

revoke all on function public.accept_current_legal_documents() from public, anon;
revoke all on function public.admin_adjust_user_points(uuid, integer, text) from public, anon;
revoke all on function public.admin_list_users(text) from public, anon;
revoke all on function public.admin_set_certification_total(uuid, integer) from public, anon;
revoke all on function public.admin_set_user_role(uuid, public.app_role) from public, anon;
revoke all on function public.approve_and_publish_legal_document(uuid, text) from public, anon;
revoke all on function public.create_legal_document(public.legal_document_type, text, text, text, text, timestamptz) from public, anon;

grant execute on function public.accept_current_legal_documents() to authenticated, service_role;
grant execute on function public.admin_adjust_user_points(uuid, integer, text) to authenticated, service_role;
grant execute on function public.admin_list_users(text) to authenticated, service_role;
grant execute on function public.admin_set_certification_total(uuid, integer) to authenticated, service_role;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.approve_and_publish_legal_document(uuid, text) to authenticated, service_role;
grant execute on function public.create_legal_document(public.legal_document_type, text, text, text, text, timestamptz) to authenticated, service_role;

alter table public.legal_documents enable row level security;
alter table public.site_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.team_members enable row level security;
alter table public.user_legal_acceptances enable row level security;

revoke all on table public.legal_documents from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.social_links from anon, authenticated;
revoke all on table public.team_members from anon, authenticated;
revoke all on table public.user_legal_acceptances from anon, authenticated;

grant select (id, document_type, version, title, summary, content, status, review_status, is_current, effective_at, published_at)
on table public.legal_documents to anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant select on table public.social_links to anon, authenticated;
grant select on table public.team_members to anon, authenticated;
grant select on table public.user_legal_acceptances to authenticated;
grant insert, update on table public.site_settings to authenticated;
grant insert, update, delete on table public.social_links to authenticated;
grant insert, update, delete on table public.team_members to authenticated;

-- The local Supabase role is intentionally separate from authenticated.  Keep
-- the service role fully privileged so server-only actions and integration
-- tests can exercise the same API paths without weakening end-user RLS.
grant all on table
  public.attendance,
  public.audit_events,
  public.certifications,
  public.event_agenda_items,
  public.event_private_details,
  public.event_registrations,
  public.event_resources,
  public.event_speakers,
  public.events,
  public.legal_documents,
  public.points_history,
  public.profiles,
  public.site_settings,
  public.social_links,
  public.team_members,
  public.user_legal_acceptances,
  public.user_roles
to service_role;

grant all on all sequences in schema public to service_role;

do $$
begin
  drop policy if exists "Admins read all legal documents" on public.legal_documents;
  create policy "Admins read all legal documents" on public.legal_documents
    for select to authenticated using ((select private.is_admin()));

  drop policy if exists "Published legal documents are public" on public.legal_documents;
  create policy "Published legal documents are public" on public.legal_documents
    for select to anon, authenticated using (status in ('PUBLISHED', 'RETIRED'));

  drop policy if exists "Admins read all legal acceptances" on public.user_legal_acceptances;
  create policy "Admins read all legal acceptances" on public.user_legal_acceptances
    for select to authenticated using ((select private.is_admin()));

  drop policy if exists "Users read their own legal acceptances" on public.user_legal_acceptances;
  create policy "Users read their own legal acceptances" on public.user_legal_acceptances
    for select to authenticated using ((select auth.uid()) = user_id);

  drop policy if exists "Public reads site settings" on public.site_settings;
  create policy "Public reads site settings" on public.site_settings
    for select to anon, authenticated using (true);

  drop policy if exists "Admins insert site settings" on public.site_settings;
  create policy "Admins insert site settings" on public.site_settings
    for insert to authenticated
    with check ((select private.is_admin()) and updated_by = (select auth.uid()));

  drop policy if exists "Admins update site settings" on public.site_settings;
  create policy "Admins update site settings" on public.site_settings
    for update to authenticated
    using ((select private.is_admin()))
    with check ((select private.is_admin()) and updated_by = (select auth.uid()));

  drop policy if exists "Public reads active social links" on public.social_links;
  create policy "Public reads active social links" on public.social_links
    for select to anon, authenticated using (active);

  drop policy if exists "Admins read all social links" on public.social_links;
  create policy "Admins read all social links" on public.social_links
    for select to authenticated using ((select private.is_admin()));

  drop policy if exists "Admins insert social links" on public.social_links;
  create policy "Admins insert social links" on public.social_links
    for insert to authenticated
    with check ((select private.is_admin()) and updated_by = (select auth.uid()));

  drop policy if exists "Admins update social links" on public.social_links;
  create policy "Admins update social links" on public.social_links
    for update to authenticated
    using ((select private.is_admin()))
    with check ((select private.is_admin()) and updated_by = (select auth.uid()));

  drop policy if exists "Admins delete social links" on public.social_links;
  create policy "Admins delete social links" on public.social_links
    for delete to authenticated using ((select private.is_admin()));

  drop policy if exists "Public reads active team members" on public.team_members;
  create policy "Public reads active team members" on public.team_members
    for select to anon, authenticated using (active);

  drop policy if exists "Admins read all team members" on public.team_members;
  create policy "Admins read all team members" on public.team_members
    for select to authenticated using ((select private.is_admin()));

  drop policy if exists "Admins insert team members" on public.team_members;
  create policy "Admins insert team members" on public.team_members
    for insert to authenticated
    with check ((select private.is_admin()) and updated_by = (select auth.uid()));

  drop policy if exists "Admins update team members" on public.team_members;
  create policy "Admins update team members" on public.team_members
    for update to authenticated
    using ((select private.is_admin()))
    with check ((select private.is_admin()) and updated_by = (select auth.uid()));

  drop policy if exists "Admins delete team members" on public.team_members;
  create policy "Admins delete team members" on public.team_members
    for delete to authenticated using ((select private.is_admin()));
end;
$$;
