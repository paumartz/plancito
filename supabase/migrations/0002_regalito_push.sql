-- Plancito · regalito, presupuesto, mapa y notificaciones push
-- Correr DESPUÉS de 0001_init.sql (SQL Editor → New query → Run).

-- ---------- perfil: lista de deseos y a quién preguntarle ----------
alter table public.profiles
  add column if not exists wishlist text[] not null default '{}',
  add column if not exists ask_contact jsonb not null default '{}'::jsonb;

-- ---------- grupo: ajustes del regalito ----------
alter table public.groups
  add column if not exists regalito_on boolean not null default false,
  add column if not exists budget_mode text not null default 'ars' check (budget_mode in ('ars','usd')),
  add column if not exists budget_default numeric(12,2) not null default 60000,
  add column if not exists usd_rate numeric(12,2) not null default 1450;

-- ---------- regalito ----------
create table public.regalitos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  bday_user uuid not null references auth.users on delete cascade,
  year int not null,
  owner uuid references auth.users,
  status text not null default 'votando' check (status in ('votando','aprobado','comprado','entregado')),
  budget_amount numeric(12,2) not null,
  budget_mode text not null default 'ars' check (budget_mode in ('ars','usd')),
  budget_since date not null default current_date,
  proposal_amount numeric(12,2),
  proposal_pct numeric(6,2),
  chosen_idea uuid,
  cost numeric(12,2),
  created_at timestamptz not null default now(),
  unique (group_id, bday_user, year)
);
create table public.regalito_ideas (
  id uuid primary key default gen_random_uuid(),
  regalito_id uuid not null references public.regalitos on delete cascade,
  title text not null,
  price numeric(12,2) not null check (price > 0),
  created_by uuid not null references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.regalito_votes (
  idea_id uuid references public.regalito_ideas on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  primary key (idea_id, user_id)
);
create table public.regalito_budget_votes (
  regalito_id uuid references public.regalitos on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  yes boolean not null,
  primary key (regalito_id, user_id)
);
create table public.regalito_payments (
  regalito_id uuid references public.regalitos on delete cascade,
  user_id uuid references auth.users on delete cascade,
  paid_at timestamptz not null default now(),
  primary key (regalito_id, user_id)
);

-- El cumpleañero NO puede ver nada de su propio regalito, ni desde la app ni consultando la base.
create or replace function public.can_see_regalito(r uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from regalitos x where x.id = r and is_member(x.group_id) and x.bday_user <> auth.uid());
$$;

alter table public.regalitos enable row level security;
alter table public.regalito_ideas enable row level security;
alter table public.regalito_votes enable row level security;
alter table public.regalito_budget_votes enable row level security;
alter table public.regalito_payments enable row level security;

create policy "ver regalitos (menos el mío)" on public.regalitos for select using (is_member(group_id) and bday_user <> auth.uid());
create policy "arrancar regalito" on public.regalitos for insert with check (is_member(group_id) and bday_user <> auth.uid());
create policy "editar regalito" on public.regalitos for update using (is_member(group_id) and bday_user <> auth.uid());

create policy "ideas" on public.regalito_ideas for select using (can_see_regalito(regalito_id));
create policy "proponer idea" on public.regalito_ideas for insert with check (can_see_regalito(regalito_id) and created_by = auth.uid());
create policy "votos de ideas" on public.regalito_votes for select using (exists (select 1 from regalito_ideas i where i.id = idea_id and can_see_regalito(i.regalito_id)));
create policy "votar idea" on public.regalito_votes for insert with check (user_id = auth.uid() and exists (select 1 from regalito_ideas i where i.id = idea_id and can_see_regalito(i.regalito_id)));
create policy "sacar mi voto" on public.regalito_votes for delete using (user_id = auth.uid());
create policy "votos de presupuesto" on public.regalito_budget_votes for select using (can_see_regalito(regalito_id));
create policy "votar presupuesto" on public.regalito_budget_votes for insert with check (user_id = auth.uid() and can_see_regalito(regalito_id));
create policy "ver pagos del regalito" on public.regalito_payments for select using (can_see_regalito(regalito_id));
-- Marca el pago quien pagó o quien compró el regalo.
create policy "marcar pago del regalito" on public.regalito_payments for insert with check (
  can_see_regalito(regalito_id) and (user_id = auth.uid() or exists (select 1 from regalitos x where x.id = regalito_id and x.owner = auth.uid()))
);

-- Nueva votación de presupuesto: se borran los votos anteriores (solo con permiso sobre el regalito).
create or replace function public.reset_budget_votes(r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not can_see_regalito(r) then raise exception 'Sin permiso'; end if;
  delete from regalito_budget_votes where regalito_id = r;
end;
$$;
grant execute on function public.reset_budget_votes(uuid) to authenticated;

alter publication supabase_realtime add table public.regalitos, public.regalito_ideas, public.regalito_votes, public.regalito_budget_votes, public.regalito_payments;

-- ---------- notificaciones push ----------
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  keys jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "mis suscripciones" on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Avisos ya enviados (para no repetir recordatorios).
create table public.notification_log (
  key text primary key,
  sent_at timestamptz not null default now()
);
alter table public.notification_log enable row level security; -- solo la usa el servidor (service role)

-- Cuando pasa algo importante, la base le avisa a la función de Netlify que manda los push.
-- Completá estos dos valores (ver README): la dirección de tu sitio y una clave secreta.
create table public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security; -- nadie desde la app puede leerla
insert into public.app_settings (key, value) values
  ('notify_url', 'https://TU-SITIO.netlify.app/.netlify/functions/notify'),
  ('notify_secret', 'CAMBIAME')
on conflict (key) do nothing;

create extension if not exists pg_net;

create or replace function public.notify_event() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare url text; secret text;
begin
  select value into url from app_settings where key = 'notify_url';
  select value into secret from app_settings where key = 'notify_secret';
  if url is null or url like '%TU-SITIO%' then return new; end if;
  perform net.http_post(
    url := url,
    body := jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'record', to_jsonb(new), 'old', case when TG_OP = 'UPDATE' then to_jsonb(old) else null end),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-plancito-secret', secret)
  );
  return new;
end;
$$;

create trigger notify_buzz after insert on public.buzzes for each row execute function public.notify_event();
create trigger notify_plan_new after insert on public.plans for each row execute function public.notify_event();
create trigger notify_plan_change after update of status, round on public.plans for each row execute function public.notify_event();
create trigger notify_expense after insert on public.expenses for each row execute function public.notify_event();
create trigger notify_regalito after update of status on public.regalitos for each row execute function public.notify_event();
