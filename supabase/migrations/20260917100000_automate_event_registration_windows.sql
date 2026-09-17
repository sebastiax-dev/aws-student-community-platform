create or replace function public.initiate_event_registration(p_event_id uuid)
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

  if not found
    or not target_event.is_published
    or target_event.status = 'FINISHED'
    or (target_event.registration_opens_at is null and target_event.status <> 'ACTIVE') then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_AVAILABLE';
  end if;
  if target_event.registration_url is null then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_URL_MISSING';
  end if;
  if target_event.registration_opens_at is not null and now() < target_event.registration_opens_at then
    raise exception using errcode = 'P0001', message = 'REGISTRATION_NOT_OPEN';
  end if;
  if target_event.registration_closes_at is not null and now() >= target_event.registration_closes_at then
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

revoke all on function public.initiate_event_registration(uuid) from public, anon;
grant execute on function public.initiate_event_registration(uuid) to authenticated;
