-- Plancito · esquema inicial (etapa 1)
-- Pegalo en Supabase → SQL Editor → New query → Run.

create extension if not exists pgcrypto;

-- ---------- perfiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  nick text not null default '',
  alias text not null default '',
  bank text not null default '',
  birthday date,
  barrio text,
  avatar jsonb not null default '{}'::jsonb,
  zumbido jsonb not null default '{"style":"clasico","msg":"¿Y el plancito?","sound":true}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- grupos ----------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'amigos' check (kind in ('amigos','pareja')),
  icon jsonb not null default '{"icon":"taza","color":"tomato"}'::jsonb,
  photo_url text,
  goal_n int not null default 2,
  goal_per text not null default 'mes' check (goal_per in ('semana','mes','año')),
  invite_code text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,8),
  likes text[] not null default '{}',
  spots jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid references public.groups on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ¿El usuario actual es parte del grupo? (security definer evita recursión en las políticas)
create or replace function public.is_member(g uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

-- ---------- plancitos ----------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  created_by uuid not null references auth.users default auth.uid(),
  status text not null default 'votando' check (status in ('votando','definido','realizado')),
  round text check (round in ('cuando','donde')),
  proposed jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  date date,
  reminders text[] not null default '{3d,1d}',
  roles jsonb,
  created_at timestamptz not null default now()
);

create table public.plan_ballots (
  plan_id uuid references public.plans on delete cascade,
  user_id uuid references auth.users on delete cascade,
  round text not null check (round in ('cuando','donde')),
  data jsonb not null default '{}'::jsonb,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (plan_id, user_id, round)
);

create table public.plan_dropouts (
  plan_id uuid references public.plans on delete cascade,
  user_id uuid references auth.users on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

-- ---------- gastos ----------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  paid_by uuid not null references auth.users,
  involved uuid[] not null,
  created_by uuid not null references auth.users default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.settlements (
  plan_id uuid references public.plans on delete cascade,
  from_user uuid references auth.users,
  to_user uuid references auth.users,
  paid_at timestamptz not null default now(),
  primary key (plan_id, from_user, to_user)
);

-- ---------- estrellitas y zumbidos ----------
create table public.points (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  group_id uuid not null references public.groups on delete cascade,
  kind text not null,
  pts int not null,
  created_at timestamptz not null default now()
);

create table public.buzzes (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups on delete cascade,
  from_user uuid not null references auth.users default auth.uid(),
  style text not null,
  msg text,
  created_at timestamptz not null default now()
);

-- ---------- seguridad (RLS) ----------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.plans enable row level security;
alter table public.plan_ballots enable row level security;
alter table public.plan_dropouts enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.points enable row level security;
alter table public.buzzes enable row level security;

-- Perfiles: los ves si compartís algún grupo; editás solo el tuyo.
create policy "ver perfiles de mis grupos" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from group_members a join group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = profiles.id)
);
create policy "crear mi perfil" on public.profiles for insert with check (id = auth.uid());
create policy "editar mi perfil" on public.profiles for update using (id = auth.uid());

create policy "ver mis grupos" on public.groups for select using (is_member(id) or created_by = auth.uid());
create policy "crear grupos" on public.groups for insert with check (created_by = auth.uid());
create policy "editar mis grupos" on public.groups for update using (is_member(id));

create policy "ver integrantes" on public.group_members for select using (is_member(group_id));
create policy "sumarme al crear" on public.group_members for insert with check (
  user_id = auth.uid() and exists (select 1 from groups where id = group_id and created_by = auth.uid())
);
create policy "salir del grupo" on public.group_members for delete using (user_id = auth.uid());

create policy "plancitos del grupo" on public.plans for all using (is_member(group_id)) with check (is_member(group_id));

create policy "votos del grupo" on public.plan_ballots for select using (exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "mi voto" on public.plan_ballots for insert with check (user_id = auth.uid() and exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "cambiar mi voto" on public.plan_ballots for update using (user_id = auth.uid());

create policy "bajas del grupo" on public.plan_dropouts for select using (exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "bajarme" on public.plan_dropouts for insert with check (user_id = auth.uid() and exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "volver a sumarme" on public.plan_dropouts for delete using (user_id = auth.uid());

create policy "gastos del grupo" on public.expenses for all
  using (exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)))
  with check (exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));

-- Un pago lo marca quien pagó o quien cobró.
create policy "ver pagos" on public.settlements for select using (exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));
create policy "marcar pago" on public.settlements for insert with check (auth.uid() in (from_user, to_user) and exists (select 1 from plans p where p.id = plan_id and is_member(p.group_id)));

create policy "ver estrellitas" on public.points for select using (is_member(group_id));
create policy "dar estrellitas" on public.points for insert with check (is_member(group_id));

create policy "ver zumbidos" on public.buzzes for select using (is_member(group_id));
create policy "mandar zumbido" on public.buzzes for insert with check (from_user = auth.uid() and is_member(group_id));

-- ---------- invitaciones ----------
-- Vista previa del grupo para quien abre el link (sin ser integrante todavía).
create or replace function public.group_preview(code text)
returns table (id uuid, name text, members int)
language sql security definer stable set search_path = public as $$
  select g.id, g.name, (select count(*)::int from group_members m where m.group_id = g.id)
  from groups g where g.invite_code = code;
$$;

create or replace function public.join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Necesitás iniciar sesión'; end if;
  select id into gid from groups where invite_code = code;
  if gid is null then raise exception 'El link de invitación no existe'; end if;
  insert into group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end;
$$;

grant execute on function public.group_preview(text) to anon, authenticated;
grant execute on function public.join_group(text) to authenticated;

-- ---------- tiempo real (votos y gastos se actualizan solos) ----------
alter publication supabase_realtime add table public.plans, public.plan_ballots, public.plan_dropouts, public.expenses, public.settlements, public.buzzes, public.group_members;
