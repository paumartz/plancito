-- Plancito · "Yo voy en auto": lugares libres para ir juntos a un plancito confirmado.
-- Correr después de los anteriores.

create table public.plan_rides (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans on delete cascade,
  driver uuid not null references auth.users on delete cascade default auth.uid(),
  seats int not null check (seats between 1 and 6),
  created_at timestamptz not null default now(),
  unique (plan_id, driver)
);
create table public.plan_ride_riders (
  ride_id uuid references public.plan_rides on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (ride_id, user_id)
);

alter table public.plan_rides enable row level security;
alter table public.plan_ride_riders enable row level security;

create policy "ver autos" on public.plan_rides for select using (exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "ofrecer auto" on public.plan_rides for insert with check (driver = auth.uid() and exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "cambiar mi auto" on public.plan_rides for update using (driver = auth.uid());
create policy "sacar mi auto" on public.plan_rides for delete using (driver = auth.uid());

create policy "ver quién va en cada auto" on public.plan_ride_riders for select using (exists (select 1 from plan_rides r join plans p on p.id = r.plan_id where r.id = ride_id and is_member(p.group_id)));
-- Solo te podés subir si queda lugar.
create policy "subirme" on public.plan_ride_riders for insert with check (
  user_id = auth.uid() and exists (
    select 1 from plan_rides r join plans p on p.id = r.plan_id
    where r.id = ride_id and is_member(p.group_id) and r.driver <> auth.uid()
      and (select count(*) from plan_ride_riders x where x.ride_id = r.id) < r.seats)
);
create policy "bajarme" on public.plan_ride_riders for delete using (user_id = auth.uid() or exists (select 1 from plan_rides r where r.id = ride_id and r.driver = auth.uid()));

grant select, insert, update, delete on public.plan_rides, public.plan_ride_riders to authenticated;
alter publication supabase_realtime add table public.plan_rides, public.plan_ride_riders;
