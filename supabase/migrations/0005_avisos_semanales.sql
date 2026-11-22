-- Plancito · avisos que se repiten cada semana ("los viernes a la noche entreno, no puedo").
-- Correr después de 0004_avisos.sql.

alter table public.group_notes
  add column if not exists repeat_days int[],          -- días de la semana: 0 domingo … 6 sábado
  add column if not exists moment text check (moment in ('manana','mediodia','tarde','noche'));

alter table public.group_notes drop constraint if exists group_notes_kind_check;
alter table public.group_notes add constraint group_notes_kind_check check (kind in ('no-estoy','semanal','recomendacion','fecha','otro'));
