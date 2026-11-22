// Modo local: sin Supabase configurado, todo se guarda en el navegador.
// Sirve para probar la app sola; para usarla con amigos hace falta Supabase.
import type { Api, Buzz, Group, Plan, PointEntry, Profile } from './types';
import { defaultAvatar } from '../components/avatarSvg';

interface DB {
  session: string | null;
  profiles: Record<string, Profile>;
  groups: Group[];
  plans: Plan[];
  points: PointEntry[];
  buzzes: Buzz[];
}
const KEY = 'plancito-local-v1';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const now = () => new Date().toISOString();

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* sin storage */ }
  return { session: null, profiles: {}, groups: [], plans: [], points: [], buzzes: [] };
}
let db = load();
const listeners = new Set<() => void>();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin storage */ }
  listeners.forEach((l) => l());
}
const me = () => db.session!;
const plan = (id: string) => db.plans.find((p) => p.id === id)!;

export const localApi: Api = {
  mode: 'local',
  async currentUserId() { return db.session; },
  async signIn(email) {
    const id = 'u_' + email.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!db.profiles[id]) {
      const nick = email.split('@')[0];
      db.profiles[id] = { id, name: nick, nick, alias: '', bank: '', avatar: defaultAvatar(), zumbido: { style: 'clasico', msg: '¿Y el plancito?', sound: true } };
    }
    db.session = id; save();
    return 'signed-in';
  },
  async signOut() { db.session = null; save(); },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },

  async getProfiles(ids) {
    const out: Record<string, Profile> = {};
    ids.forEach((i) => { if (db.profiles[i]) out[i] = db.profiles[i]; });
    return out;
  },
  async saveMe(patch) { db.profiles[me()] = { ...db.profiles[me()], ...patch }; save(); },

  async listGroups() { return db.groups.filter((g) => g.members.includes(me())); },
  async createGroup(input) {
    const g: Group = { id: uid(), ...input, inviteCode: uid().slice(0, 8), likes: [], spots: [], members: [me()], createdAt: now() };
    db.groups.push(g); save();
    return g;
  },
  async updateGroup(id, patch) { Object.assign(db.groups.find((g) => g.id === id)!, patch); save(); },
  async groupPreview(code) {
    const g = db.groups.find((x) => x.inviteCode === code);
    return g ? { id: g.id, name: g.name, members: g.members.length } : null;
  },
  async joinGroup(code) {
    const g = db.groups.find((x) => x.inviteCode === code);
    if (!g) throw new Error('El link de invitación no existe');
    if (!g.members.includes(me())) g.members.push(me());
    save();
    return g.id;
  },

  async listPlans(groupIds) { return db.plans.filter((p) => groupIds.includes(p.groupId)); },
  async createPlan(groupId, proposed) {
    const p: Plan = {
      id: uid(), groupId, createdBy: me(), createdAt: now(), status: 'votando', round: 'cuando', proposed, answers: {},
      reminders: ['3d', '1d'], ballots: { cuando: {}, donde: {} }, done: { cuando: [], donde: [] }, out: [], expenses: [], paid: [],
    };
    db.plans.push(p); save();
    return p.id;
  },
  async updatePlan(id, patch) { Object.assign(plan(id), patch); save(); },
  async saveBallot(planId, round, data, done) {
    const p = plan(planId);
    p.ballots[round][me()] = data;
    p.done[round] = p.done[round].filter((x) => x !== me()).concat(done ? [me()] : []);
    save();
  },
  async dropOut(planId, reason) { const p = plan(planId); p.out = p.out.filter((o) => o.who !== me()).concat({ who: me(), why: reason || null }); save(); },
  async rejoin(planId) { const p = plan(planId); p.out = p.out.filter((o) => o.who !== me()); save(); },
  async addExpense(planId, e) { plan(planId).expenses.push({ id: uid(), ...e }); save(); },
  async markPaid(planId, from, to) { const p = plan(planId); if (!p.paid.includes(`${from}>${to}`)) p.paid.push(`${from}>${to}`); save(); },

  async listPoints(groupIds) { return db.points.filter((p) => groupIds.includes(p.groupId)); },
  async addPoints(entries) { db.points.push(...entries.map((e) => ({ ...e, createdAt: now() }))); save(); },
  async sendBuzz(groupId, style, msg) { db.buzzes.push({ id: uid(), groupId, from: me(), style, msg, createdAt: now() }); save(); },
  async listBuzzes(groupIds) { return db.buzzes.filter((b) => groupIds.includes(b.groupId)); },

  subscribe(cb) {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { db = load(); cb(); } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  },
};
