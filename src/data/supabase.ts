import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Api, Group, Plan, Profile } from './types';
import { defaultAvatar } from '../components/avatarSvg';

/* eslint-disable @typescript-eslint/no-explicit-any */
const toGroup = (r: any): Group => ({
  id: r.id, name: r.name, kind: r.kind, icon: r.icon, photoUrl: r.photo_url,
  goal: { n: r.goal_n, per: r.goal_per }, inviteCode: r.invite_code, likes: r.likes || [], spots: r.spots || [],
  members: (r.group_members || []).map((m: any) => m.user_id), createdAt: r.created_at,
});
const toProfile = (r: any): Profile => ({
  id: r.id, name: r.name, nick: r.nick, alias: r.alias, bank: r.bank, birthday: r.birthday, barrio: r.barrio,
  avatar: Object.keys(r.avatar || {}).length ? r.avatar : defaultAvatar(), zumbido: r.zumbido,
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
  const sb: SupabaseClient = createClient(url, key);
  const uid = async () => (await sb.auth.getSession()).data.session?.user.id ?? null;
  const must = <T,>(r: { data: T; error: any }) => { if (r.error) throw new Error(r.error.message); return r.data; };

  return {
    mode: 'supabase',
    currentUserId: uid,
    async signIn(email) {
      must(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } }));
      return 'sent';
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
      must(await sb.from('groups').update(row).eq('id', id));
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

    subscribe(cb) {
      let t: ReturnType<typeof setTimeout> | undefined;
      const debounced = () => { clearTimeout(t); t = setTimeout(cb, 250); };
      const ch = sb.channel('plancito').on('postgres_changes', { event: '*', schema: 'public' }, debounced).subscribe();
      return () => { sb.removeChannel(ch); };
    },
  };
}
