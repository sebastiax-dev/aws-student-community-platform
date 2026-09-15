begin;

select plan(33);

select ok(to_regclass('public.profiles') is not null, 'profiles table exists');
select ok(to_regclass('public.user_roles') is not null, 'user_roles table exists');
select ok(to_regclass('public.events') is not null, 'events table exists');
select ok(to_regclass('public.event_speakers') is not null, 'event_speakers table exists');
select ok(to_regclass('public.points_history') is not null, 'points_history table exists');
select ok(to_regclass('public.attendance') is not null, 'attendance table exists');
select ok(to_regclass('public.certifications') is not null, 'certifications table exists');
select ok(to_regclass('public.legal_documents') is not null, 'legal_documents table exists');
select ok(to_regclass('public.site_settings') is not null, 'site_settings table exists');
select ok(to_regclass('public.social_links') is not null, 'social_links table exists');
select ok(to_regclass('public.team_members') is not null, 'team_members table exists');
select ok(to_regclass('public.user_legal_acceptances') is not null, 'user_legal_acceptances table exists');

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'team_members'
      and column_name = 'image_path'
  ),
  'team_members has image_path for uploaded member photos'
);
select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'social_links'
      and column_name = 'icon_image_path'
  ),
  'social_links has icon_image_path for uploaded social icons'
);

select ok((select relrowsecurity from pg_class where oid = 'public.legal_documents'::regclass), 'legal_documents has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.site_settings'::regclass), 'site_settings has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.social_links'::regclass), 'social_links has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.team_members'::regclass), 'team_members has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.user_legal_acceptances'::regclass), 'user_legal_acceptances has RLS enabled');

select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_members' and policyname = 'Public reads active team members'),
  'public team member policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'social_links' and policyname = 'Public reads active social links'),
  'public social link policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_members' and policyname = 'Admins insert team members'),
  'admin team member insert policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'site_settings' and policyname = 'Admins update site settings'),
  'admin site settings update policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'social_links' and policyname = 'Admins delete social links'),
  'admin social link delete policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'legal_documents' and policyname = 'Published legal documents are public'),
  'published legal document policy exists'
);

select ok(to_regprocedure('public.admin_list_users(text)') is not null, 'admin user directory function exists');
select ok(to_regprocedure('public.admin_adjust_user_points(uuid,integer,text)') is not null, 'admin points adjustment function exists');
select ok(to_regprocedure('public.admin_set_certification_total(uuid,integer)') is not null, 'admin certification function exists');
select ok(to_regprocedure('public.admin_set_user_role(uuid,public.app_role)') is not null, 'admin role function exists');
select ok(to_regprocedure('public.create_legal_document(public.legal_document_type,text,text,text,text,timestamptz)') is not null, 'legal document creation function exists');
select ok(to_regprocedure('public.accept_current_legal_documents()') is not null, 'legal acceptance function exists');

select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins upload team member site assets'),
  'team member storage upload policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins delete team member site assets'),
  'team member storage delete policy exists'
);

select * from finish();
rollback;
