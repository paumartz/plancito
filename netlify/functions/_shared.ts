// Utilidades del servidor de notificaciones (corre en Netlify Functions, nunca en el navegador).
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const env = (k: string) => process.env[k] || '';
export const admin = () => createClient(env('SUPABASE_URL') || env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

let vapidReady = false;
function setupVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(env('VAPID_SUBJECT') || 'https://plancito.app', env('VAPID_PUBLIC_KEY') || env('VITE_VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
  vapidReady = true;
}

export interface Payload { title: string; body: string; url: string; tag?: string; buzz?: boolean }

/** Manda una notificación a todos los dispositivos de esos usuarios. Borra suscripciones vencidas. */
export async function pushTo(userIds: string[], payload: Payload) {
  if (!userIds.length) return 0;
  setupVapid();
  const sb = admin();
  const { data: subs } = await sb.from('push_subscriptions').select('endpoint, keys').in('user_id', [...new Set(userIds)]);
  let sent = 0;
  await Promise.all((subs || []).map(async (s: { endpoint: string; keys: { p256dh: string; auth: string } }) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 12 }); sent++; }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint); }
  }));
  return sent;
}

/** Evita mandar dos veces el mismo recordatorio. Devuelve true si hay que mandarlo. */
export async function once(key: string, minHoursBetween = 1e9) {
  const sb = admin();
  const { data } = await sb.from('notification_log').select('sent_at').eq('key', key).maybeSingle();
  if (data && Date.now() - new Date(data.sent_at).getTime() < minHoursBetween * 3600e3) return false;
  await sb.from('notification_log').upsert({ key, sent_at: new Date().toISOString() });
  return true;
}

export async function groupInfo(groupId: string) {
  const sb = admin();
  const [{ data: g }, { data: m }] = await Promise.all([
    sb.from('groups').select('id, name').eq('id', groupId).single(),
    sb.from('group_members').select('user_id').eq('group_id', groupId),
  ]);
  const members = (m || []).map((x: { user_id: string }) => x.user_id);
  const { data: profs } = await sb.from('profiles').select('id, nick, name, birthday').in('id', members);
  const nick = (id: string) => { const p = (profs || []).find((x: { id: string }) => x.id === id) as { nick?: string; name?: string } | undefined; return p?.nick || p?.name || 'Alguien'; };
  return { name: (g as { name: string } | null)?.name || 'tu grupo', members, nick, profiles: profs || [] };
}
export const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
