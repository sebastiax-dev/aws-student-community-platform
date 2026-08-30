create or replace function public.admin_list_attendance(
  p_event_id uuid default null,
  p_search text default ''
)
returns table (
  registration_id uuid,
  event_id uuid,
  user_id uuid,
  display_name text,
  email text,
  event_title text,
  event_starts_at timestamptz,
  registration_status public.registration_status,
  attended boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_search text := btrim(coalesce(p_search, ''));
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not (select private.is_admin()) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  return query
  select
    registration.id,
    registration.event_id,
    registration.user_id,
    profile.display_name,
    user_record.email,
    event.title,
    event.starts_at,
    registration.status,
    coalesce(attendance_record.attended, false)
  from public.event_registrations as registration
  inner join public.events as event on event.id = registration.event_id
  inner join public.profiles as profile on profile.id = registration.user_id
  inner join auth.users as user_record on user_record.id = registration.user_id
  left join public.attendance as attendance_record
    on attendance_record.event_id = registration.event_id
    and attendance_record.user_id = registration.user_id
  where (p_event_id is null or registration.event_id = p_event_id)
    and (
      normalized_search = ''
      or profile.display_name ilike '%' || normalized_search || '%'
      or user_record.email ilike '%' || normalized_search || '%'
      or event.title ilike '%' || normalized_search || '%'
    )
  order by event.starts_at desc, profile.display_name asc;
end;
$$;

revoke all on function public.admin_list_attendance(uuid, text) from public, anon;
grant execute on function public.admin_list_attendance(uuid, text) to authenticated;
