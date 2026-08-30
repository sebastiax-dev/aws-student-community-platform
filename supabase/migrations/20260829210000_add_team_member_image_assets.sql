alter table public.team_members
  add column if not exists image_path text;

alter table public.team_members
  drop constraint if exists team_members_image_path_length;

alter table public.team_members
  add constraint team_members_image_path_length
  check (image_path is null or char_length(image_path) between 1 and 512);

create policy "Admins upload team member site assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-assets'
  and (storage.foldername(name))[1] = 'team-members'
  and (select private.is_admin())
);

create policy "Admins update team member site assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-assets'
  and (storage.foldername(name))[1] = 'team-members'
  and (select private.is_admin())
)
with check (
  bucket_id = 'site-assets'
  and (storage.foldername(name))[1] = 'team-members'
  and (select private.is_admin())
);

create policy "Admins delete team member site assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-assets'
  and (storage.foldername(name))[1] = 'team-members'
  and (select private.is_admin())
);
