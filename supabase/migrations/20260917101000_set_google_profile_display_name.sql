create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_display_name text;
begin
  requested_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), '')
  );

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(requested_display_name, 'Miembro'));

  insert into public.user_roles (user_id, role)
  values (new.id, 'USER');

  return new;
end;
$$;
