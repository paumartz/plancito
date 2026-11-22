// Avisos al instante: la base de datos llama a esta función cuando pasa algo (ver 0002_regalito_push.sql).
import { admin, groupInfo, money, pushTo } from './_shared';
import { planSentence, planTitle, type Answers } from '../../src/lib/logic/plan';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });
  if (!process.env.NOTIFY_SECRET || req.headers.get('x-plancito-secret') !== process.env.NOTIFY_SECRET) return new Response('No autorizado', { status: 401 });
  const { table, op, record: r, old } = (await req.json()) as { table: string; op: string; record: any; old: any };
  const sb = admin();

  if (table === 'buzzes' && op === 'INSERT') {
    const g = await groupInfo(r.group_id);
    await pushTo(g.members.filter((m) => m !== r.from_user), { title: `${g.nick(r.from_user)} te mandó un zumbido`, body: r.msg ? `${g.name}: “${r.msg}”` : g.name, url: `/g/${r.group_id}`, tag: 'buzz-' + r.group_id, buzz: true });
  }

  if (table === 'plans') {
    const g = await groupInfo(r.group_id);
    const { data: outs } = await sb.from('plan_dropouts').select('user_id').eq('plan_id', r.id);
    const going = g.members.filter((m) => !(outs || []).some((o: any) => o.user_id === m));
    const a = (r.answers || {}) as Answers;
    if (op === 'INSERT')
      await pushTo(g.members.filter((m) => m !== r.created_by), { title: `¿Hacemos un plancito? · ${g.name}`, body: `${g.nick(r.created_by)} propuso un plancito. Marcá cuándo podés, te lleva un minuto.`, url: `/p/${r.id}`, tag: 'plan-' + r.id });
    else if (old?.round === 'cuando' && r.round === 'donde')
      await pushTo(going, { title: `Ya quedó el día · ${g.name}`, body: `${a.dia?.label} · ${a.momento?.label}. Ahora elijan qué hacer y dónde.`, url: `/p/${r.id}`, tag: 'plan-' + r.id });
    else if (old?.status === 'votando' && r.status === 'definido')
      await pushTo(going, { title: `¡Quedó el plancito! · ${g.name}`, body: planSentence(a), url: `/p/${r.id}`, tag: 'plan-' + r.id });
    else if (old?.status === 'definido' && r.status === 'realizado')
      await pushTo(going, { title: `¿Cómo salió ${planTitle(a).toLowerCase()}?`, body: 'Carguen los gastos así quedan las cuentas claras.', url: `/p/${r.id}`, tag: 'plan-' + r.id });
  }

  if (table === 'expenses' && op === 'INSERT') {
    const { data: plan } = await sb.from('plans').select('group_id, answers').eq('id', r.plan_id).single();
    if (plan) {
      const g = await groupInfo((plan as any).group_id);
      const others = (r.involved as string[]).filter((u) => u !== r.paid_by && u !== r.created_by);
      await pushTo(others, { title: `Nuevo gasto · ${g.name}`, body: `${g.nick(r.paid_by)} pagó ${r.description} (${money(Number(r.amount))}). Mirá cuánto te toca.`, url: `/p/${r.plan_id}` });
    }
  }

  if (table === 'regalitos' && op === 'UPDATE' && old?.status !== r.status) {
    const g = await groupInfo(r.group_id);
    const el = g.members.filter((m) => m !== r.bday_user); // el cumpleañero nunca recibe nada de su regalo
    const who = g.nick(r.bday_user);
    if (r.status === 'aprobado') await pushTo(el, { title: `Regalito para ${who} aprobado`, body: r.owner ? `${g.nick(r.owner)} se encarga de comprarlo.` : 'Falta alguien que se encargue de comprarlo.', url: `/g/${r.group_id}?tab=regalito` });
    if (r.status === 'comprado') await pushTo(el.filter((m) => m !== r.owner), { title: `${g.nick(r.owner)} compró el regalo de ${who}`, body: `Te toca poner ${money(Number(r.cost) / el.length)}. Tenés su alias en la app.`, url: `/g/${r.group_id}?tab=regalito` });
  }

  return new Response('ok');
};
