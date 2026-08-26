create policy "Users read events with their own registrations"
on public.events
for select
to authenticated
using (
  exists (
    select 1
    from public.event_registrations
    where event_registrations.event_id = events.id
      and event_registrations.user_id = (select auth.uid())
  )
);

comment on policy "Users read events with their own registrations" on public.events is 'Preserves a member dashboard history when an administrator later unpublishes an event.';
