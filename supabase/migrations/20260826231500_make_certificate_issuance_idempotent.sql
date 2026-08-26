create unique index certifications_active_event_name_unique_idx
on public.certifications (user_id, event_id, lower(certificate_name))
where event_id is not null and revoked_at is null;

create or replace function public.issue_certificate(p_user_id uuid, p_event_id uuid, p_certificate_name text, p_issued_at date)
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

  select id
  into certificate_id
  from public.certifications
  where user_id = p_user_id
    and event_id is not distinct from p_event_id
    and lower(certificate_name) = lower(normalized_name)
    and revoked_at is null;

  if found then
    return certificate_id;
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
