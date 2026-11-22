-- Plancito · permisos de acceso a las tablas
-- Los proyectos nuevos de Supabase no le dan acceso automático a la app sobre las tablas creadas por SQL.
-- Sin esto aparece "permission denied for table ...". Las reglas de seguridad (RLS) siguen decidiendo
-- qué fila puede ver cada persona; esto solo habilita a los usuarios logueados a usar las tablas.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant execute on function public.group_preview(text) to anon;

-- Tablas internas: solo las usa el servidor de notificaciones, nunca la app.
revoke all on public.app_settings, public.notification_log from anon, authenticated;
