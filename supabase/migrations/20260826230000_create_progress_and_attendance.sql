create type public.point_action as enum (
  'REGISTRATION',
  'ATTENDANCE',
  'ATTENDANCE_REVERSAL',
  'MANUAL_ADJUSTMENT'
);

alter table public.profiles
  add column total_points integer not null default 0,
  add column total_certifications integer not null default 0,
  add constraint profiles_total_points_nonnegative check (total_points >= 0),
  add constraint profiles_total_certifications_nonnegative check (total_certifications >= 0);

create table public.points_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete restrict,
  action public.point_action not null,
  points integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint points_history_points_nonzero check (points <> 0 and points between -10000 and 10000),
  constraint points_history_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint points_history_known_values check (
    (action = 'REGISTRATION' and points = 10 and event_id is not null)
    or (action = 'ATTENDANCE' and points = 20 and event_id is not null)
    or (action = 'ATTENDANCE_REVERSAL' and points = -20 and event_id is not null)
    or action = 'MANUAL_ADJUSTMENT'
  )
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  attended boolean not null default false,
  recorded_at timestamptz,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_event_user_unique unique (event_id, user_id),
  constraint attendance_recorded_timestamp check ((attended and recorded_at is not null) or not attended)
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete restrict,
  certificate_name text not null,
  issued_at date not null default current_date,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users (id) on delete set null,
  constraint certifications_name_length check (char_length(btrim(certificate_name)) between 3 and 160),
  constraint certifications_revocation_pair check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create unique index points_history_registration_once_idx
on public.points_history (user_id, event_id)
where action = 'REGISTRATION';

create index points_history_user_created_idx
on public.points_history (user_id, created_at desc);

create index points_history_event_idx
on public.points_history (event_id, created_at desc)
where event_id is not null;

create index attendance_event_attended_idx
on public.attendance (event_id, attended);

create index attendance_user_attended_idx
on public.attendance (user_id, attended);

create index certifications_user_issued_idx
on public.certifications (user_id, issued_at desc);

create index certifications_event_active_idx
on public.certifications (event_id, issued_at desc)
where revoked_at is null;

create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function private.set_updated_at();

create function private.apply_point_history_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_delta integer;
  target_user_id uuid;
begin
  if tg_op = 'INSERT' then
    total_delta := new.points;
    target_user_id := new.user_id;
  else
    total_delta := -old.points;
    target_user_id := old.user_id;
  end if;

  update public.profiles
  set total_points = greatest(0, total_points + total_delta)
  where id = target_user_id;

  if tg_op = 'INSERT' then
    return new;
  end if;

  return old;
end;
$$;

create function private.apply_certification_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total_delta integer := 0;
  target_user_id uuid;
begin
  if tg_op = 'INSERT' then
    target_user_id := new.user_id;
    if new.revoked_at is null then
      total_delta := 1;
    end if;
  elsif tg_op = 'DELETE' then
    target_user_id := old.user_id;
    if old.revoked_at is null then
      total_delta := -1;
    end if;
  else
    target_user_id := new.user_id;
    if old.revoked_at is null and new.revoked_at is not null then
      total_delta := -1;
    elsif old.revoked_at is not null and new.revoked_at is null then
      total_delta := 1;
    end if;
  end if;

  if total_delta <> 0 then
    update public.profiles
    set total_certifications = greatest(0, total_certifications + total_delta)
    where id = target_user_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create function private.award_registration_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.points_history (user_id, event_id, action, points, metadata, created_by, created_at)
  values (
    new.user_id,
    new.event_id,
    'REGISTRATION',
    10,
    jsonb_build_object('registration_id', new.id),
    (select auth.uid()),
    new.registered_at
  )
  on conflict (user_id, event_id) where action = 'REGISTRATION' do nothing;

  return new;
end;
$$;

create function private.award_attendance_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_action public.point_action;
  target_points integer;
begin
  if tg_op = 'INSERT' and new.attended then
    target_action := 'ATTENDANCE';
    target_points := 20;
  elsif tg_op = 'UPDATE' and new.attended is distinct from old.attended then
    target_action := case when new.attended then 'ATTENDANCE' else 'ATTENDANCE_REVERSAL' end;
    target_points := case when new.attended then 20 else -20 end;
  else
    return new;
  end if;

  insert into public.points_history (user_id, event_id, action, points, metadata, created_by)
  values (
    new.user_id,
    new.event_id,
    target_action,
    target_points,
    jsonb_build_object('attendance_id', new.id),
    new.recorded_by
  );

  return new;
end;
$$;

create function private.enforce_attendance_registration_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'ATTENDED' and not exists (
    select 1
    from public.attendance
    where event_id = new.event_id
      and user_id = new.user_id
      and attended
  ) then
    raise exception using errcode = 'P0001', message = 'ATTENDANCE_RECORD_REQUIRED';
  end if;

  return new;
end;
$$;

create trigger points_history_apply_total
after insert or delete on public.points_history
for each row execute function private.apply_point_history_total();

create trigger certifications_apply_total
after insert or update of revoked_at or delete on public.certifications
for each row execute function private.apply_certification_total();

create trigger event_registrations_award_points
after insert on public.event_registrations
for each row execute function private.award_registration_points();

create trigger attendance_award_points
after insert or update of attended on public.attendance
for each row execute function private.award_attendance_points();

insert into public.points_history (user_id, event_id, action, points, metadata, created_at)
select
  registration.user_id,
  registration.event_id,
  'REGISTRATION',
  10,
  jsonb_build_object('registration_id', registration.id, 'backfilled', true),
  registration.registered_at
from public.event_registrations as registration
on conflict (user_id, event_id) where action = 'REGISTRATION' do nothing;

insert into public.attendance (event_id, user_id, attended, recorded_at, recorded_by, created_at, updated_at)
select
  registration.event_id,
  registration.user_id,
  true,
  registration.updated_at,
  null,
  registration.created_at,
  registration.updated_at
from public.event_registrations as registration
where registration.status = 'ATTENDED'
on conflict (event_id, user_id) do nothing;

create trigger event_registrations_require_attendance
before update of status on public.event_registrations
for each row execute function private.enforce_attendance_registration_status();

create function public.set_event_attendance(p_event_id uuid, p_user_id uuid, p_attended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  registration_id uuid;
  registration_status public.registration_status;
  attendance_id uuid;
  did_change boolean := false;
begin
  actor_id := (select auth.uid());
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  select id, status
  into registration_id, registration_status
  from public.event_registrations
  where event_id = p_event_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'EVENT_REGISTRATION_NOT_FOUND';
  end if;

  if p_attended then
    insert into public.attendance (event_id, user_id, attended, recorded_at, recorded_by)
    values (p_event_id, p_user_id, true, now(), actor_id)
    on conflict (event_id, user_id) do update
    set attended = true,
        recorded_at = now(),
        recorded_by = actor_id
    where public.attendance.attended is distinct from true
    returning id into attendance_id;

    did_change := attendance_id is not null;
    if registration_status <> 'ATTENDED' then
      update public.event_registrations
      set status = 'ATTENDED'
      where id = registration_id;
      did_change := true;
    end if;
  else
    update public.attendance
    set attended = false,
        recorded_at = null,
        recorded_by = actor_id
    where event_id = p_event_id
      and user_id = p_user_id
      and attended
    returning id into attendance_id;

    did_change := attendance_id is not null;
    if registration_status = 'ATTENDED' then
      update public.event_registrations
      set status = 'CONFIRMED'
      where id = registration_id;
      did_change := true;
    end if;
  end if;

  if did_change then
    insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
    values (
      actor_id,
      'attendance.recorded',
      'attendance',
      coalesce(attendance_id, (select id from public.attendance where event_id = p_event_id and user_id = p_user_id)),
      jsonb_build_object('attended', p_attended, 'event_id', p_event_id, 'user_id', p_user_id)
    );
  end if;
end;
$$;

create function public.issue_certificate(p_user_id uuid, p_event_id uuid, p_certificate_name text, p_issued_at date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  certificate_id uuid;
  normalized_name text;
begin
  actor_id := (select auth.uid());
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  normalized_name := btrim(p_certificate_name);
  if char_length(normalized_name) < 3 or char_length(normalized_name) > 160 then
    raise exception using errcode = '22023', message = 'CERTIFICATE_NAME_INVALID';
  end if;
  if p_issued_at is null then
    raise exception using errcode = '22023', message = 'CERTIFICATE_ISSUED_AT_REQUIRED';
  end if;
  if p_event_id is not null and not exists (
    select 1
    from public.attendance
    where event_id = p_event_id
      and user_id = p_user_id
      and attended
  ) then
    raise exception using errcode = 'P0001', message = 'ATTENDANCE_REQUIRED_FOR_CERTIFICATE';
  end if;

  insert into public.certifications (user_id, event_id, certificate_name, issued_at, created_by)
  values (p_user_id, p_event_id, normalized_name, p_issued_at, actor_id)
  returning id into certificate_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'certificate.issued',
    'certification',
    certificate_id,
    jsonb_build_object('event_id', p_event_id, 'user_id', p_user_id)
  );

  return certificate_id;
end;
$$;

create function public.revoke_certificate(p_certificate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_certificate public.certifications%rowtype;
begin
  actor_id := (select auth.uid());
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  update public.certifications
  set revoked_at = now(),
      revoked_by = actor_id
  where id = p_certificate_id
    and revoked_at is null
  returning * into target_certificate;

  if not found then
    raise exception using errcode = 'P0001', message = 'ACTIVE_CERTIFICATE_NOT_FOUND';
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor_id,
    'certificate.revoked',
    'certification',
    target_certificate.id,
    jsonb_build_object('event_id', target_certificate.event_id, 'user_id', target_certificate.user_id)
  );
end;
$$;

alter table public.audit_events
  drop constraint audit_events_action_known,
  drop constraint audit_events_entity_type_known,
  add constraint audit_events_action_known check (
    action in (
      'event.created',
      'event.updated',
      'event.published',
      'event.unpublished',
      'event.deleted',
      'registration.initiated',
      'registration.status_updated',
      'attendance.recorded',
      'certificate.issued',
      'certificate.revoked'
    )
  ),
  add constraint audit_events_entity_type_known check (
    entity_type in ('event', 'event_registration', 'attendance', 'certification')
  );

revoke all on function private.apply_point_history_total() from public, anon, authenticated;
revoke all on function private.apply_certification_total() from public, anon, authenticated;
revoke all on function private.award_registration_points() from public, anon, authenticated;
revoke all on function private.award_attendance_points() from public, anon, authenticated;
revoke all on function private.enforce_attendance_registration_status() from public, anon, authenticated;
revoke all on function public.set_event_attendance(uuid, uuid, boolean) from public, anon;
revoke all on function public.issue_certificate(uuid, uuid, text, date) from public, anon;
revoke all on function public.revoke_certificate(uuid) from public, anon;
grant execute on function public.set_event_attendance(uuid, uuid, boolean) to authenticated;
grant execute on function public.issue_certificate(uuid, uuid, text, date) to authenticated;
grant execute on function public.revoke_certificate(uuid) to authenticated;

alter table public.points_history enable row level security;
alter table public.attendance enable row level security;
alter table public.certifications enable row level security;

revoke all on table public.points_history from anon, authenticated;
revoke all on table public.attendance from anon, authenticated;
revoke all on table public.certifications from anon, authenticated;

grant select on table public.points_history to authenticated;
grant select on table public.attendance to authenticated;
grant select on table public.certifications to authenticated;

create policy "Users read own points history"
on public.points_history
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins read all points history"
on public.points_history
for select
to authenticated
using ((select private.is_admin()));

create policy "Users read own attendance"
on public.attendance
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins read all attendance"
on public.attendance
for select
to authenticated
using ((select private.is_admin()));

create policy "Users read own certifications"
on public.certifications
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins read all certifications"
on public.certifications
for select
to authenticated
using ((select private.is_admin()));

comment on table public.points_history is 'Immutable ledger of points earned or reversed by participation actions.';
comment on table public.attendance is 'Per-event attendance recorded only through the protected administrative function.';
comment on table public.certifications is 'Certification history with revocation retained for auditability.';
