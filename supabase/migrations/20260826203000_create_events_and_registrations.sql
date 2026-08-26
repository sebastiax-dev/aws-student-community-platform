create type public.event_status as enum ('PLANNED', 'ACTIVE', 'FINISHED');
create type public.event_modality as enum ('IN_PERSON', 'VIRTUAL', 'HYBRID');
create type public.registration_status as enum ('INITIATED', 'CONFIRMED', 'ATTENDED', 'CANCELLED', 'NO_SHOW');
create type public.registration_source as enum ('GOOGLE_FORMS', 'WEB_PLATFORM');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text not null,
  requirements text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  modality public.event_modality not null,
  location text not null,
  registration_url text,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  capacity integer,
  status public.event_status not null default 'PLANNED',
  image_path text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  updated_by uuid not null default auth.uid() references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_slug_length check (char_length(slug) between 3 and 120),
  constraint events_title_length check (char_length(btrim(title)) between 3 and 120),
  constraint events_summary_length check (char_length(btrim(summary)) between 10 and 240),
  constraint events_description_length check (char_length(btrim(description)) between 20 and 5000),
  constraint events_requirements_length check (requirements is null or char_length(requirements) <= 2000),
  constraint events_location_length check (char_length(btrim(location)) between 2 and 160),
  constraint events_time_order check (ends_at is null or ends_at > starts_at),
  constraint events_registration_window_order check (
    registration_opens_at is null
    or registration_closes_at is null
    or registration_closes_at > registration_opens_at
  ),
  constraint events_capacity_positive check (capacity is null or capacity between 1 and 10000),
  constraint events_registration_url_https check (registration_url is null or registration_url ~ '^https://'),
  constraint events_image_path_owned check (image_path is null or image_path like id::text || '/%'),
  constraint events_published_timestamp check (not is_published or published_at is not null)
);

create table public.event_private_details (
  event_id uuid primary key references public.events (id) on delete cascade,
  meeting_url text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_private_details_meeting_url_https check (meeting_url is null or meeting_url ~ '^https://'),
  constraint event_private_details_internal_notes_length check (internal_notes is null or char_length(internal_notes) <= 4000)
);

create table public.event_speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  role_title text,
  bio text,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_speakers_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint event_speakers_role_title_length check (role_title is null or char_length(role_title) <= 160),
  constraint event_speakers_bio_length check (bio is null or char_length(bio) <= 1000),
  constraint event_speakers_sort_order_nonnegative check (sort_order >= 0),
  constraint event_speakers_event_order_unique unique (event_id, sort_order)
);

create table public.event_agenda_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_agenda_items_title_length check (char_length(btrim(title)) between 2 and 160),
  constraint event_agenda_items_description_length check (description is null or char_length(description) <= 1000),
  constraint event_agenda_items_time_order check (ends_at is null or ends_at > starts_at),
  constraint event_agenda_items_sort_order_nonnegative check (sort_order >= 0),
  constraint event_agenda_items_event_order_unique unique (event_id, sort_order)
);

create table public.event_resources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null,
  url text not null,
  sort_order integer not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_resources_label_length check (char_length(btrim(label)) between 2 and 120),
  constraint event_resources_url_https check (url ~ '^https://'),
  constraint event_resources_sort_order_nonnegative check (sort_order >= 0),
  constraint event_resources_event_order_unique unique (event_id, sort_order)
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  source public.registration_source not null default 'GOOGLE_FORMS',
  status public.registration_status not null default 'INITIATED',
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_event_user_unique unique (event_id, user_id)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_events_action_known check (
    action in (
      'event.created',
      'event.updated',
      'event.published',
      'event.unpublished',
      'event.deleted',
      'registration.initiated',
      'registration.status_updated'
    )
  ),
  constraint audit_events_entity_type_known check (entity_type in ('event', 'event_registration')),
  constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index events_public_schedule_idx on public.events (starts_at, status) where is_published;
create index events_status_schedule_idx on public.events (status, starts_at);
create index event_speakers_event_idx on public.event_speakers (event_id);
create index event_agenda_items_event_idx on public.event_agenda_items (event_id, starts_at);
create index event_resources_event_idx on public.event_resources (event_id);
create index event_registrations_user_idx on public.event_registrations (user_id, registered_at desc);
create index event_registrations_event_status_idx on public.event_registrations (event_id, status);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);
create index audit_events_actor_idx on public.audit_events (actor_id, occurred_at desc);

create function private.set_event_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (select auth.uid()) is null then
      raise exception using errcode = '42501', message = 'EVENT_ACTOR_REQUIRED';
    end if;

    new.created_by = (select auth.uid());
    new.updated_by = (select auth.uid());
  else
    new.updated_at = now();
    new.updated_by = coalesce((select auth.uid()), old.updated_by);
  end if;

  if new.is_published and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

create trigger events_set_metadata
before insert or update on public.events
for each row execute function private.set_event_metadata();

create trigger event_private_details_set_updated_at
before update on public.event_private_details
for each row execute function private.set_updated_at();

create trigger event_speakers_set_updated_at
before update on public.event_speakers
for each row execute function private.set_updated_at();

create trigger event_agenda_items_set_updated_at
before update on public.event_agenda_items
for each row execute function private.set_updated_at();

create trigger event_resources_set_updated_at
before update on public.event_resources
for each row execute function private.set_updated_at();

create trigger event_registrations_set_updated_at
before update on public.event_registrations
for each row execute function private.set_updated_at();

create function private.prevent_historical_event_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.published_at is not null and coalesce((select auth.role()), '') <> 'service_role' then
    raise exception using errcode = 'P0001', message = 'PUBLISHED_EVENT_DELETE_FORBIDDEN';
  end if;

  return old;
end;
$$;

create trigger events_prevent_historical_delete
before delete on public.events
for each row execute function private.prevent_historical_event_delete();

create function private.audit_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
  target_id uuid;
  target_status text;
  target_published boolean;
begin
  if tg_op = 'INSERT' then
    audit_action := 'event.created';
    target_id := new.id;
    target_status := new.status::text;
    target_published := new.is_published;
  elsif tg_op = 'DELETE' then
    audit_action := 'event.deleted';
    target_id := old.id;
    target_status := old.status::text;
    target_published := old.is_published;
  else
    if not old.is_published and new.is_published then
      audit_action := 'event.published';
    elsif old.is_published and not new.is_published then
      audit_action := 'event.unpublished';
    else
      audit_action := 'event.updated';
    end if;
    target_id := new.id;
    target_status := new.status::text;
    target_published := new.is_published;
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    audit_action,
    'event',
    target_id,
    jsonb_build_object('status', target_status, 'is_published', target_published)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger events_write_audit
after insert or update or delete on public.events
for each row execute function private.audit_event_mutation();

create function private.audit_registration_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
begin
  if tg_op = 'INSERT' then
    audit_action := 'registration.initiated';
  elsif new.status is distinct from old.status then
    audit_action := 'registration.status_updated';
  else
    return new;
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    audit_action,
    'event_registration',
    new.id,
    jsonb_build_object('event_id', new.event_id, 'status', new.status::text)
  );

  return new;
end;
$$;

create trigger event_registrations_write_audit
after insert or update on public.event_registrations
for each row execute function private.audit_registration_mutation();

create function public.initiate_event_registration(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_registration public.event_registrations%rowtype;
  current_registration_count bigint;
  current_user_id uuid;
  registration_exists boolean;
  target_event public.events%rowtype;
begin
  current_user_id := (select auth.uid());
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select *
  into target_event
  from public.events
  where id = p_event_id
  for update;

  if not found or not target_event.is_published or target_event.status <> 'ACTIVE' then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_AVAILABLE';
  end if;
  if target_event.registration_url is null then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_URL_MISSING';
  end if;
  if target_event.registration_opens_at is not null and now() < target_event.registration_opens_at then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_NOT_OPEN';
  end if;
  if target_event.registration_closes_at is not null and now() > target_event.registration_closes_at then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_CLOSED';
  end if;

  select *
  into current_registration
  from public.event_registrations
  where event_id = p_event_id and user_id = current_user_id;
  registration_exists := found;

  if registration_exists and current_registration.status <> 'CANCELLED' then
    return target_event.registration_url;
  end if;

  if target_event.capacity is not null then
    select count(*)
    into current_registration_count
    from public.event_registrations
    where event_id = p_event_id and status <> 'CANCELLED';

    if current_registration_count >= target_event.capacity then
      raise exception using errcode = 'P0001', message = 'EVENT_FULL';
    end if;
  end if;

  if registration_exists then
    update public.event_registrations
    set status = 'INITIATED', source = 'GOOGLE_FORMS', registered_at = now()
    where id = current_registration.id;
  else
    insert into public.event_registrations (event_id, user_id, source, status)
    values (p_event_id, current_user_id, 'GOOGLE_FORMS', 'INITIATED');
  end if;

  return target_event.registration_url;
end;
$$;

revoke all on function private.set_event_metadata() from public, anon, authenticated;
revoke all on function private.prevent_historical_event_delete() from public, anon, authenticated;
revoke all on function private.audit_event_mutation() from public, anon, authenticated;
revoke all on function private.audit_registration_mutation() from public, anon, authenticated;
revoke all on function public.initiate_event_registration(uuid) from public, anon;
grant execute on function public.initiate_event_registration(uuid) to authenticated;

alter table public.events enable row level security;
alter table public.event_private_details enable row level security;
alter table public.event_speakers enable row level security;
alter table public.event_agenda_items enable row level security;
alter table public.event_resources enable row level security;
alter table public.event_registrations enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.events from anon, authenticated;
revoke all on table public.event_private_details from anon, authenticated;
revoke all on table public.event_speakers from anon, authenticated;
revoke all on table public.event_agenda_items from anon, authenticated;
revoke all on table public.event_resources from anon, authenticated;
revoke all on table public.event_registrations from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;

grant select (
  id,
  slug,
  title,
  summary,
  description,
  requirements,
  starts_at,
  ends_at,
  modality,
  location,
  registration_url,
  registration_opens_at,
  registration_closes_at,
  capacity,
  status,
  image_path,
  is_published,
  published_at,
  created_at,
  updated_at
) on public.events to anon, authenticated;
grant insert (
  id,
  slug,
  title,
  summary,
  description,
  requirements,
  starts_at,
  ends_at,
  modality,
  location,
  registration_url,
  registration_opens_at,
  registration_closes_at,
  capacity,
  status,
  image_path,
  is_published
) on public.events to authenticated;
grant update (
  slug,
  title,
  summary,
  description,
  requirements,
  starts_at,
  ends_at,
  modality,
  location,
  registration_url,
  registration_opens_at,
  registration_closes_at,
  capacity,
  status,
  image_path,
  is_published
) on public.events to authenticated;
grant delete on public.events to authenticated;

grant select, insert, update, delete on public.event_private_details to authenticated;
grant select on public.event_speakers to anon, authenticated;
grant insert, update, delete on public.event_speakers to authenticated;
grant select on public.event_agenda_items to anon, authenticated;
grant insert, update, delete on public.event_agenda_items to authenticated;
grant select on public.event_resources to anon, authenticated;
grant insert, update, delete on public.event_resources to authenticated;
grant select on public.event_registrations to authenticated;
grant update (status) on public.event_registrations to authenticated;
grant select on public.audit_events to authenticated;

create policy "Public reads published events"
on public.events
for select
to anon, authenticated
using (is_published);

create policy "Admins read all events"
on public.events
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins create events"
on public.events
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins update events"
on public.events
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins delete draft events"
on public.events
for delete
to authenticated
using ((select private.is_admin()));

create policy "Admins read private event details"
on public.event_private_details
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins create private event details"
on public.event_private_details
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins update private event details"
on public.event_private_details
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins delete private event details"
on public.event_private_details
for delete
to authenticated
using ((select private.is_admin()));

create policy "Public reads speakers of published events"
on public.event_speakers
for select
to anon, authenticated
using (
  exists (
    select 1 from public.events
    where events.id = event_speakers.event_id and events.is_published
  )
);

create policy "Admins read all event speakers"
on public.event_speakers
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins create event speakers"
on public.event_speakers
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins update event speakers"
on public.event_speakers
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins delete event speakers"
on public.event_speakers
for delete
to authenticated
using ((select private.is_admin()));

create policy "Public reads agenda of published events"
on public.event_agenda_items
for select
to anon, authenticated
using (
  exists (
    select 1 from public.events
    where events.id = event_agenda_items.event_id and events.is_published
  )
);

create policy "Admins read all agenda items"
on public.event_agenda_items
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins create agenda items"
on public.event_agenda_items
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins update agenda items"
on public.event_agenda_items
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins delete agenda items"
on public.event_agenda_items
for delete
to authenticated
using ((select private.is_admin()));

create policy "Public reads published resources of published events"
on public.event_resources
for select
to anon, authenticated
using (
  is_published
  and exists (
    select 1 from public.events
    where events.id = event_resources.event_id and events.is_published
  )
);

create policy "Admins read all event resources"
on public.event_resources
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins create event resources"
on public.event_resources
for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins update event resources"
on public.event_resources
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins delete event resources"
on public.event_resources
for delete
to authenticated
using ((select private.is_admin()));

create policy "Users read their own event registrations"
on public.event_registrations
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

create policy "Admins read all event registrations"
on public.event_registrations
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins update event registration status"
on public.event_registrations
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins read event audit records"
on public.audit_events
for select
to authenticated
using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'events',
  'events',
  true,
  5242880,
  array['image/avif', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins upload event assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'events'
  and (select private.is_admin())
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create policy "Admins replace event assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'events' and (select private.is_admin()))
with check (
  bucket_id = 'events'
  and (select private.is_admin())
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
);

create policy "Admins delete event assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'events' and (select private.is_admin()));

comment on table public.events is 'Public-safe event content. Private meeting links are stored separately.';
comment on table public.event_private_details is 'ADMIN-only event details that must never be exposed by public event queries.';
comment on table public.event_registrations is 'Idempotent internal registration tracking before redirecting to the external registration provider.';
comment on table public.audit_events is 'Append-only audit trail for event and registration mutations.';
comment on function public.initiate_event_registration(uuid) is 'Creates or reuses a registration under a per-event lock and returns its external registration URL.';
