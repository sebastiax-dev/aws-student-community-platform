insert into public.site_settings (key, value)
values ('recommendations', '{"formUrl":""}'::jsonb)
on conflict (key) do nothing;
