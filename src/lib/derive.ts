// Cálculos que dependen de los datos cargados (grupos, plancitos, deudas, notificaciones).
import type { Group, Plan, PointEntry, Profile, Regalito } from '../data';
import { daysToBirthday, majority, shareOf } from './logic/regalito';
import { daysBetween, parseISO, today, upcomingDays } from './logic/dates';
import { planTitle } from './logic/plan';
import { debtKey, settle } from './logic/split';
import { levelOf } from './logic/points';

export const attendees = (g: Group, p: Plan) => { const out = new Set(p.out.map((o) => o.who)); return g.members.filter((m) => !out.has(m)); };
export const planDays = (p: Plan) => upcomingDays(parseISO(p.createdAt.slice(0, 10)));
export const goalTxt = (g: Group) => `${g.goal.n} ${g.goal.n === 1 ? 'vez' : 'veces'} por ${g.goal.per}`;
const PER = { semana: 7, mes: 30, 'año': 365 } as const;

export function lastPlanDate(g: Group, plans: Plan[]) {
  const done = plans.filter((p) => p.groupId === g.id && p.status === 'realizado' && p.date).map((p) => p.date!).sort();
  return done.length ? done[done.length - 1] : g.createdAt.slice(0, 10);
}
export const sinceLast = (g: Group, plans: Plan[]) => daysBetween(parseISO(lastPlanDate(g, plans)), today());
export const overdue = (g: Group, plans: Plan[]) => sinceLast(g, plans) > (PER[g.goal.per] / g.goal.n) * 1.2;
export function doneThisPeriod(g: Group, plans: Plan[]) {
  const t = today();
  return plans.filter((p) => p.groupId === g.id && p.status === 'realizado' && p.date).filter((p) => {
    const d = parseISO(p.date!);
    if (g.goal.per === 'semana') return daysBetween(d, t) < 7;
    if (g.goal.per === 'mes') return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    return d.getFullYear() === t.getFullYear();
  }).length;
}
export const activePlan = (g: Group, plans: Plan[]) => plans.find((p) => p.groupId === g.id && p.status === 'votando');
export const nextPlan = (g: Group, plans: Plan[]) => plans.filter((p) => p.groupId === g.id && p.status === 'definido').sort((a, b) => (a.date! < b.date! ? -1 : 1))[0];
export const pendingDebts = (p: Plan) => settle(p.expenses).filter((d) => !p.paid.includes(debtKey(d)));

export const pointsOf = (points: PointEntry[], who: string, groupId?: string) =>
  points.filter((x) => x.userId === who && (!groupId || x.groupId === groupId)).reduce((s, x) => s + x.pts, 0);
export const myLevel = (points: PointEntry[], me: string) => levelOf(pointsOf(points, me));

export interface Notif { tone: string; who?: string; groupId?: string; title: string; sub: string; cta: string; to?: string; buzzId?: string; pr: number }

/** Notificaciones ordenadas: primero la plata que debés. */
export function notifications(o: { me: string; groups: Group[]; plans: Plan[]; regalitos: Regalito[]; profiles: Record<string, Profile>; buzzes: { id: string; from: string; groupId: string; msg?: string | null }[]; nick: (id: string) => string; seenBuzz: (id: string) => boolean }): Notif[] {
  const { me, groups, plans, nick } = o, out: Notif[] = [];
  for (const g of groups) {
    for (const p of plans.filter((x) => x.groupId === g.id && x.status === 'realizado')) {
      for (const d of pendingDebts(p).filter((x) => x.from === me))
        out.push({ pr: 0, tone: 'var(--pink)', who: d.to, title: `Le debés $${d.amount.toLocaleString('es-AR')} a ${nick(d.to)}`, sub: `${planTitle(p.answers)} · ${g.name}`, cta: 'Pagar', to: `/p/${p.id}` });
    }
    const ap = activePlan(g, plans);
    if (ap && ap.round && attendees(g, ap).includes(me) && !ap.done[ap.round].includes(me))
      out.push({ pr: 1, tone: 'var(--peach)', who: ap.createdBy, title: `Te falta votar en ${g.name}`, sub: `${ap.round === 'cuando' ? '¿Cuándo podés?' : '¿Qué hacemos?'} · te lleva un minuto`, cta: 'Votar', to: `/p/${ap.id}` });
    const np = nextPlan(g, plans);
    if (np) {
      const dd = daysBetween(today(), parseISO(np.date!));
      if (dd >= 0 && dd <= 7) out.push({ pr: 2, tone: 'var(--lilac)', groupId: g.id, title: dd === 0 ? 'Hoy tenés un plancito' : dd === 1 ? 'Mañana tenés un plancito' : `En ${dd} días tenés un plancito`, sub: `${planTitle(np.answers)} · ${np.answers.hora?.label ?? ''} · ${g.name}`, cta: 'Ver', to: `/p/${np.id}` });
    }
    if (!ap && !np && overdue(g, plans) && g.members.length > 1)
      out.push({ pr: 4, tone: 'var(--lime)', groupId: g.id, title: `Hace ${sinceLast(g, plans)} días que no se juntan con ${g.name}`, sub: `El objetivo es ${goalTxt(g)}. ¿Craneamos algo?`, cta: 'Proponer', to: `/g/${g.id}?proponer=1` });
  }
  for (const r of o.regalitos.filter((x) => x.status !== 'entregado' && x.bdayUser !== me)) {
    const g = groups.find((x) => x.id === r.groupId); if (!g) continue;
    const el = g.members.filter((m) => m !== r.bdayUser), bd = o.profiles[r.bdayUser]?.birthday, d = bd ? daysToBirthday(bd, today()) : 0;
    const to = `/g/${g.id}?tab=regalito`;
    if (r.status === 'comprado' && r.owner && r.owner !== me && !r.payments.includes(me))
      out.push({ pr: 0, tone: 'var(--pink)', who: r.owner, title: `Pagale $${shareOf(r.cost || 0, el.length).toLocaleString('es-AR')} a ${nick(r.owner)} por el regalito`, sub: `Cumple de ${nick(r.bdayUser)} · ${g.name}`, cta: 'Pagar', to });
    else if (r.proposal && !r.budgetVotes.some((v) => v.userId === me))
      out.push({ pr: 1, tone: 'var(--sky)', who: r.bdayUser, title: '¿Actualizamos el presupuesto del regalito?', sub: `Cumple de ${nick(r.bdayUser)} en ${d} días · ${g.name}`, cta: 'Votar', to });
    else if (r.status === 'votando' && !r.ideas.some((i) => i.votes.includes(me)))
      out.push({ pr: 1, tone: 'var(--sky)', who: r.bdayUser, title: `Faltan ${d} días para el cumple de ${nick(r.bdayUser)}`, sub: r.ideas.length ? `Hay ${r.ideas.length} ideas para votar · se aprueba con ${majority(el.length)}` : 'Todavía no hay ideas de regalo. ¿Proponés una?', cta: 'Ver', to });
  }
  for (const b of o.buzzes.filter((x) => x.from !== me && !o.seenBuzz(x.id)))
    out.push({ pr: 3, tone: 'var(--sky)', who: b.from, title: `${nick(b.from)} te mandó un zumbido`, sub: `${groups.find((g) => g.id === b.groupId)?.name ?? ''}${b.msg ? ` · “${b.msg}”` : ''}`, cta: 'Ver', buzzId: b.id });
  return out.map((n, i) => ({ ...n, i })).sort((a, b) => a.pr - b.pr || a.i - b.i);
}
