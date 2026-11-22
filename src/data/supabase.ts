import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Api, Group, Plan, Profile, Regalito } from './types';
import { defaultAvatar } from '../components/avatarSvg';

/* eslint-disable @typescript-eslint/no-explicit-any */
const toGroup = (r: any): Group => ({
  id: r.id, name: r.name, kind: r.kind, icon: r.icon, photoUrl: r.photo_url,
  goal: { n: r.goal_n, per: r.goal_per }, inviteCode: r.invite_code, likes: r.likes || [], spots: r.spots || [],
  members: (r.group_members || []).map((m: any) => m.user_id), createdAt: r.created_at,
  regalitoOn: !!r.regalito_on, budgetMode: r.budget_mode || 'ars', budgetDefault: Number(r.budget_default ?? 60000), usdRate: Number(r.usd_rate ?? 1450),
});
const toProfile = (r: any): Profile => ({
  id: r.id, name: r.name, nick: r.nick, alias: r.alias, bank: r.bank, birthday: r.birthday, barrio: r.barrio,
  avatar: Object.keys(r.avatar || {}).length ? r.avatar : defaultAvatar(), zumbido: r.zumbido,
  wishlist: r.wishlist || [], askContact: r.ask_contact || {},
});
const toRegalito = (r: any): Regalito => ({
  id: r.id, groupId: r.group_id, bdayUser: r.bday_user, year: r.year, owner: r.owner, status: r.status,
  budget: { amount: Number(r.budget_amount), mode: r.budget_mode, since: r.budget_since },
  proposal: r.proposal_amount ? { amount: Number(r.proposal_amount), pct: Number(r.proposal_pct || 0) } : null,
  chosenIdea: r.chosen_idea, cost: r.cost == null ? null : Number(r.cost),
  ideas: (r.regalito_ideas || []).map((i: any) => ({ id: i.id, title: i.title, price: Number(i.price), by: i.created_by, votes: (i.regalito_votes || []).map((v: any) => v.user_id) })),
  budgetVotes: (r.regalito_budget_votes || []).map((v: any) => ({ userId: v.user_id, yes: v.yes })),
  payments: (r.regalito_payments || []).map((x: any) => x.user_id), createdAt: r.created_at,
});
const toPlan = (r: any): Plan => {
  const ballots: Plan['ballots'] = { cuando: {}, donde: {} }, done: Plan['done'] = { cuando: [], donde: [] };
  for (const b of r.plan_ballots || []) {
    ballots[b.round as 'cuando' | 'donde'][b.user_id] = b.data;
    if (b.done) done[b.round as 'cuando' | 'donde'].push(b.user_id);
  }
  return {
    id: r.id, groupId: r.group_id, createdBy: r.created_by, createdAt: r.created_at, status: r.status, round: r.round,
    proposed: r.proposed || {}, answers: r.answers || {}, date: r.date, reminders: r.reminders || [], roles: r.roles,
    ballots, done,
    out: (r.plan_dropouts || []).map((d: any) => ({ who: d.user_id, why: d.reason })),
    expenses: (r.expenses || []).map((e: any) => ({ id: e.id, description: e.description, amount: Number(e.amount), paidBy: e.paid_by, involved: e.involved })),
    paid: (r.settlements || []).map((s: any) => `${s.from_user}>${s.to_user}`),
  };
};

export function makeSupabaseApi(url: string, key: string): Api {
  // implicit: el link del mail se puede abrir en otro navegador (Safari) que la app instalada.
  const sb: SupabaseClient = createClient(url, key, { auth: { flowType: 'implicit' } });
  const uid = async () => (await sb.auth.getSession()).data.session?.user.id ?? null;
  const must = <T,>(r: { data: T; error: any }) => { if (r.error) throw new Error(r.error.message); return r.data; };

  return {
    mode: 'supabase',
    currentUserId: uid,
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    },
    async signUp(email, password) {
      // La cuenta la crea la función del servidor, ya confirmada y sin mandar mails.
      let r: Response;
      try {
        r = await fetch('/.netlify/functions/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      } catch { throw new Error('No hay conexión con el servidor. Revisá tu internet.'); }
      if (r.ok) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        return 'ok';
      }
      const j = await r.json().catch(() => ({} as { error?: string }));
      if (r.status === 409) throw new Error('User already registered');
      if (r.status === 501) throw new Error('Falta configurar el servidor: cargá SUPABASE_SERVICE_ROLE_KEY en Netlify y volvé a desplegar.');
      if (r.status === 404) throw new Error('La función de alta no está publicada en Netlify. Volvé a desplegar el sitio.');
      throw new Error(j.error || `Error del servidor (${r.status})`);
    },
    async requestPasswordReset(email) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/nueva-clave' });
      if (error) throw new Error(error.message);
    },
    async updatePassword(password) {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    async signOut() { await sb.auth.signOut(); },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },

    async getProfiles(ids) {
      const me = await uid();
      const rows = must(await sb.from('profiles').select('*').in('id', ids)) as any[];
      if (me && ids.includes(me) && !rows.some((r) => r.id === me)) {
        // primera vez: creamos el perfil
        const created = must(await sb.from('profiles').insert({ id: me, avatar: defaultAvatar() }).select().single());
        rows.push(created);
      }
      return Object.fromEntries(rows.map((r) => [r.id, toProfile(r)]));
    },
    async saveMe(patch) {
      const me = await uid();
      const row: any = { ...patch };
      if ('askContact' in row) { row.ask_contact = row.askContact; delete row.askContact; }
      must(await sb.from('profiles').update(row).eq('id', me!));
    },

    async listGroups() {
      const me = await uid();
      const rows = must(await sb.from('groups').select('*, group_members(user_id)')) as any[];
      return rows.map(toGroup).filter((g) => g.members.includes(me!));
    },
    async createGroup(input) {
      const me = await uid();
      const g = must(await sb.from('groups').insert({ name: input.name, kind: input.kind, icon: input.icon, goal_n: input.goal.n, goal_per: input.goal.per }).select().single()) as any;
      must(await sb.from('group_members').insert({ group_id: g.id, user_id: me }));
      return toGroup({ ...g, group_members: [{ user_id: me }] });
    },
    async updateGroup(id, patch) {
      const row: any = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.icon) row.icon = patch.icon;
      if (patch.goal) { row.goal_n = patch.goal.n; row.goal_per = patch.goal.per; }
      if (patch.likes) row.likes = patch.likes;
      if (patch.spots) row.spots = patch.spots;
      if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl;
      if (patch.regalitoOn !== undefined) row.regalito_on = patch.regalitoOn;
      if (patch.budgetMode) row.budget_mode = patch.budgetMode;
      if (patch.budgetDefault !== undefined) row.budget_default = patch.budgetDefault;
      if (patch.usdRate !== undefined) row.usd_rate = patch.usdRate;
      const rows = must(await sb.from('groups').update(row).eq('id', id).select('id')) as any[];
      if (!rows.length) throw new Error('No tenés permiso para editar este grupo (¿corriste 0003_permisos.sql en Supabase?)');
    },
    async groupPreview(code) {
      const rows = must(await sb.rpc('group_preview', { code })) as any[];
      return rows?.[0] ?? null;
    },
    async joinGroup(code) { return must(await sb.rpc('join_group', { code })) as string; },

    async listPlans(groupIds) {
      if (!groupIds.length) return [];
      const rows = must(await sb.from('plans').select('*, plan_ballots(*), plan_dropouts(*), expenses(*), settlements(*)').in('group_id', groupIds)) as any[];
      return rows.map(toPlan);
    },
    async createPlan(groupId, proposed) {
      const r = must(await sb.from('plans').insert({ group_id: groupId, proposed, round: 'cuando' }).select('id').single()) as any;
      return r.id;
    },
    async deletePlan(id) {
      const rows = must(await sb.from('plans').delete().eq('id', id).select('id')) as any[];
      if (!rows.length) throw new Error('No tenés permiso para borrarlo');
    },
    async updatePlan(id, patch) { must(await sb.from('plans').update(patch).eq('id', id)); },
    async saveBallot(planId, round, data, done) {
      const me = await uid();
      must(await sb.from('plan_ballots').upsert({ plan_id: planId, user_id: me, round, data, done, updated_at: new Date().toISOString() }));
    },
    async dropOut(planId, reason) {
      const me = await uid();
      must(await sb.from('plan_dropouts').upsert({ plan_id: planId, user_id: me, reason: reason || null }));
    },
    async rejoin(planId) {
      const me = await uid();
      must(await sb.from('plan_dropouts').delete().eq('plan_id', planId).eq('user_id', me!));
    },
    async addExpense(planId, e) {
      must(await sb.from('expenses').insert({ plan_id: planId, description: e.description, amount: e.amount, paid_by: e.paidBy, involved: e.involved }));
    },
    async markPaid(planId, from, to) { must(await sb.from('settlements').upsert({ plan_id: planId, from_user: from, to_user: to })); },

    async listPoints(groupIds) {
      if (!groupIds.length) return [];
      const rows = must(await sb.from('points').select('*').in('group_id', groupIds)) as any[];
      return rows.map((r) => ({ userId: r.user_id, groupId: r.group_id, kind: r.kind, pts: r.pts, createdAt: r.created_at }));
    },
    async addPoints(entries) {
      if (!entries.length) return;
      must(await sb.from('points').insert(entries.map((e) => ({ user_id: e.userId, group_id: e.groupId, kind: e.kind, pts: e.pts }))));
    },
    async sendBuzz(groupId, style, msg) { must(await sb.from('buzzes').insert({ group_id: groupId, style, msg })); },
    async listBuzzes(groupIds) {
      if (!groupIds.length) return [];
      const since = new Date(Date.now() - 3 * 864e5).toISOString();
      const rows = must(await sb.from('buzzes').select('*').in('group_id', groupIds).gte('created_at', since)) as any[];
      return rows.map((r) => ({ id: String(r.id), groupId: r.group_id, from: r.from_user, style: r.style, msg: r.msg, createdAt: r.created_at }));
    },

    async listRegalitos(groupIds) {
      if (!groupIds.length) return [];
      const rows = must(await sb.from('regalitos').select('*, regalito_ideas(*, regalito_votes(user_id)), regalito_budget_votes(*), regalito_payments(*)').in('group_id', groupIds)) as any[];
      return rows.map(toRegalito);
    },
    async createRegalito(groupId, bdayUser, year, budget) {
      const r = await sb.from('regalitos').insert({ group_id: groupId, bday_user: bdayUser, year, budget_amount: budget.amount, budget_mode: budget.mode });
      if (r.error && !/duplicate/i.test(r.error.message)) throw new Error(r.error.message);
    },
    async updateRegalito(id, patch) { must(await sb.from('regalitos').update(patch).eq('id', id)); },
    async addIdea(rid, title, price) {
      const i = must(await sb.from('regalito_ideas').insert({ regalito_id: rid, title, price }).select('id').single()) as any;
      must(await sb.from('regalito_votes').insert({ idea_id: i.id }));
    },
    async voteIdea(ideaId, on) {
      const me = await uid();
      if (on) must(await sb.from('regalito_votes').upsert({ idea_id: ideaId, user_id: me }));
      else must(await sb.from('regalito_votes').delete().eq('idea_id', ideaId).eq('user_id', me!));
    },
    async voteBudget(rid, yes) { must(await sb.from('regalito_budget_votes').insert({ regalito_id: rid, yes })); },
    async resetBudgetVotes(rid) { must(await sb.rpc('reset_budget_votes', { r: rid })); },
    async markRegalitoPaid(rid, userId) { must(await sb.from('regalito_payments').upsert({ regalito_id: rid, user_id: userId })); },
    async savePushSubscription(sub) {
      const me = await uid();
      must(await sb.from('push_subscriptions').upsert({ endpoint: sub.endpoint, keys: sub.keys, user_id: me }));
    },

    onBuzz(cb) {
      const ch = sb.channel('plancito-zumbidos').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'buzzes' }, (p: any) => {
        const r = p.new;
        cb({ id: String(r.id), groupId: r.group_id, from: r.from_user, style: r.style, msg: r.msg, createdAt: r.created_at });
      }).subscribe();
      return () => { sb.removeChannel(ch); };
    },
    subscribe(cb) {
      let t: ReturnType<typeof setTimeout> | undefined;
      const debounced = () => { clearTimeout(t); t = setTimeout(cb, 250); };
      const ch = sb.channel('plancito').on('postgres_changes', { event: '*', schema: 'public' }, debounced).subscribe();
      return () => { sb.removeChannel(ch); };
    },
  };
}
