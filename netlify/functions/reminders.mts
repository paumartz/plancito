// Recordatorios diarios (9 h de Argentina): plancitos que se vienen, deudas sin pagar, cumples y grupos que no se juntan.
import type { Config } from '@netlify/functions';
import { admin, groupInfo, money, once, pushTo } from './_shared';
import { planSentence, planTitle, type Answers } from '../../src/lib/logic/plan';
import { debtKey, settle } from '../../src/lib/logic/split';
import { daysToBirthday } from '../../src/lib/logic/regalito';

/* eslint-disable @typescript-eslint/no-explicit-any */
const argToday = () => { const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const daysUntil = (iso: string, t: Date) => { const [y, m, d] = iso.split('-').map(Number); return Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 864e5); };
const PER: Record<string, number> = { semana: 7, mes: 30, 'año': 365 };

export default async () => {
  const sb = admin(), t = argToday();
  const { data: plans } = await sb.from('plans').select('*, plan_dropouts(user_id), expenses(*), settlements(*)').in('status', ['definido', 'realizado', 'votando']);
  const { data: groups } = await sb.from('groups').select('id, name, goal_n, goal_per, regalito_on, created_at');

  for (const p of (plans || []) as any[]) {
    const a = (p.answers || {}) as Answers;
    // 1) Plancitos que se vienen, según los avisos elegidos (3 días antes, el día anterior, el mismo día).
    if (p.status === 'definido' && p.date) {
      const d = daysUntil(p.date, t), key = d === 3 ? '3d' : d === 1 ? '1d' : d === 0 ? '0d' : null;
      if (key && (p.reminders || []).includes(key) && await once(`plan:${p.id}:${key}`)) {
        const g = await groupInfo(p.group_id), going = g.members.filter((m) => !(p.plan_dropouts || []).some((o: any) => o.user_id === m));
        await pushTo(going, { title: d === 0 ? `Hoy hay plancito · ${g.name}` : d === 1 ? `Mañana hay plancito · ${g.name}` : `En 3 días hay plancito · ${g.name}`, body: planSentence(a), url: `/p/${p.id}` });
      }
    }
    // 2) Deudas sin pagar: recordatorio cada 3 días.
    if (p.status === 'realizado') {
      const paid = new Set((p.settlements || []).map((s: any) => `${s.from_user}>${s.to_user}`));
      const debts = settle((p.expenses || []).map((e: any) => ({ id: e.id, description: e.description, amount: Number(e.amount), paidBy: e.paid_by, involved: e.involved })));
      for (const d of debts.filter((x) => !paid.has(debtKey(x)))) {
        if (!(await once(`debt:${p.id}:${debtKey(d)}`, 72))) continue;
        const g = await groupInfo(p.group_id);
        await pushTo([d.from], { title: `Le debés ${money(d.amount)} a ${g.nick(d.to)}`, body: `${planTitle(a)} · ${g.name}. Tenés su alias en la app para pagarle.`, url: `/p/${p.id}` });
      }
    }
  }

  for (const g0 of (groups || []) as any[]) {
    const g = await groupInfo(g0.id);
    // 3) Cumples: aviso a 14 y a 3 días (el cumpleañero no recibe nada).
    if (g0.regalito_on) for (const prof of g.profiles as any[]) {
      if (!prof.birthday) continue;
      const d = daysToBirthday(prof.birthday, t);
      if ((d === 14 || d === 3) && await once(`bday:${g0.id}:${prof.id}:${t.getFullYear()}:${d}`))
        await pushTo(g.members.filter((m) => m !== prof.id), { title: `Faltan ${d} días para el cumple de ${g.nick(prof.id)}`, body: `Organicen el regalito en ${g.name}.`, url: `/g/${g0.id}?tab=regalito` });
    }
    // 4) Regalito comprado y sin pagar: cada 3 días.
    const { data: regs } = await sb.from('regalitos').select('*, regalito_payments(user_id)').eq('group_id', g0.id).eq('status', 'comprado');
    for (const r of (regs || []) as any[]) {
      const el = g.members.filter((m) => m !== r.bday_user), paid = new Set((r.regalito_payments || []).map((x: any) => x.user_id));
      for (const u of el.filter((m) => m !== r.owner && !paid.has(m)))
        if (await once(`regpay:${r.id}:${u}`, 72)) await pushTo([u], { title: `Pagale ${money(Number(r.cost) / el.length)} a ${g.nick(r.owner)}`, body: `Es por el regalo de ${g.nick(r.bday_user)}.`, url: `/g/${g0.id}?tab=regalito` });
    }
    // 5) Grupos que hace mucho no se juntan (máximo un empujoncito por semana).
    const gp = ((plans || []) as any[]).filter((p) => p.group_id === g0.id);
    if (g.members.length > 1 && !gp.some((p) => p.status === 'votando' || p.status === 'definido')) {
      const last = gp.filter((p) => p.status === 'realizado' && p.date).map((p) => p.date).sort().pop() || g0.created_at.slice(0, 10);
      const since = -daysUntil(last, t), limit = (PER[g0.goal_per] / g0.goal_n) * 1.2;
      if (since > limit && await once(`nudge:${g0.id}`, 24 * 7))
        await pushTo(g.members, { title: `Hace ${since} días que no se juntan`, body: `${g.name}: ¿craneamos un plancito?`, url: `/g/${g0.id}` });
    }
  }
  return new Response('ok');
};

export const config: Config = { schedule: '0 12 * * *' }; // 12 UTC = 9 h en Argentina
