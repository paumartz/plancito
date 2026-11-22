-- Plancito · tablón de avisos del grupo (correr después de los anteriores).
-- Avisos fijados que ve todo el grupo: "me voy de vacaciones del 3 al 12", "me recomendaron este lugar",
-- "los miércoles no puedo", "el 15 cumple mi mamá".

create table public.group_notes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  author uuid not null references auth.users on delete cascade default auth.uid(),
  kind text not null default 'otro' check (kind in ('no-estoy','recomendacion','fecha','otro')),
  text text not null check (char_length(text) between 1 and 200),
  date_from date,
  date_to date,
  created_at timestamptz not null default now()
);
alter table public.group_notes enable row level security;
create policy "ver avisos" on public.group_notes for select using (is_member(group_id));
create policy "publicar aviso" on public.group_notes for insert with check (author = auth.uid() and is_member(group_id));
create policy "borrar mi aviso" on public.group_notes for delete using (author = auth.uid());

grant select, insert, delete on public.group_notes to authenticated;
alter publication supabase_realtime add table public.group_notes;
