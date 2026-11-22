import type { Answers, Ballots, Proposed, Spot } from '../lib/logic/plan';
import type { Expense } from '../lib/logic/split';
import type { AvatarOpts } from '../components/avatarSvg';

export interface Profile {
  id: string;
  name: string;
  nick: string;
  alias: string;
  bank: string;
  birthday?: string | null;
  barrio?: string | null;
  avatar: AvatarOpts;
  zumbido: { style: string; msg: string; sound: boolean };
  wishlist: string[];
  askContact: { name?: string; rel?: string; phone?: string };
}

export interface Group {
  id: string;
  name: string;
  kind: 'amigos' | 'pareja';
  icon: { icon: string; color: string };
  photoUrl?: string | null;
  goal: { n: number; per: 'semana' | 'mes' | 'año' };
  inviteCode: string;
  likes: string[];
  spots: Spot[];
  members: string[];
  createdAt: string;
  regalitoOn: boolean;
  budgetMode: 'ars' | 'usd';
  budgetDefault: number;
  usdRate: number;
}

export type PlanStatus = 'votando' | 'definido' | 'realizado';
export type Round = 'cuando' | 'donde';

export interface Plan {
  id: string;
  groupId: string;
  createdBy: string;
  createdAt: string;
  status: PlanStatus;
  round: Round | null;
  proposed: Proposed;
  answers: Answers;
  date?: string | null;
  reminders: string[];
  roles?: Record<string, string[]> | null;
  ballots: { cuando: Ballots; donde: Ballots };
  done: { cuando: string[]; donde: string[] };
  out: { who: string; why?: string | null }[];
  expenses: Expense[];
  paid: string[]; // claves "from>to"
}

export interface PointEntry { userId: string; groupId: string; kind: string; pts: number; createdAt: string }
export interface Buzz { id: string; groupId: string; from: string; style: string; msg?: string | null; createdAt: string }

export type NoteKind = 'no-estoy' | 'recomendacion' | 'fecha' | 'otro';
export interface Note { id: string; groupId: string; author: string; kind: NoteKind; text: string; from?: string | null; to?: string | null; createdAt: string }

export type RegalitoStatus = 'votando' | 'aprobado' | 'comprado' | 'entregado';
export interface Regalito {
  id: string;
  groupId: string;
  bdayUser: string;
  year: number;
  owner: string | null;
  status: RegalitoStatus;
  budget: { amount: number; mode: 'ars' | 'usd'; since: string };
  proposal: { amount: number; pct: number } | null;
  chosenIdea: string | null;
  cost: number | null;
  ideas: { id: string; title: string; price: number; by: string; votes: string[] }[];
  budgetVotes: { userId: string; yes: boolean }[];
  payments: string[];
  createdAt: string;
}
export type RegalitoPatch = Partial<{ owner: string | null; status: RegalitoStatus; budget_amount: number; budget_mode: 'ars' | 'usd'; budget_since: string; proposal_amount: number | null; proposal_pct: number | null; chosen_idea: string | null; cost: number | null }>;

export interface Api {
  mode: 'local' | 'supabase';
  currentUserId(): Promise<string | null>;
  /** Entra con mail y contraseña. */
  signIn(email: string, password: string): Promise<void>;
  /** Crea la cuenta. Devuelve 'confirm' si Supabase todavía pide confirmar el mail. */
  signUp(email: string, password: string): Promise<'ok' | 'confirm'>;
  /** Manda el mail para elegir una contraseña nueva. */
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: () => void): () => void;

  getProfiles(ids: string[]): Promise<Record<string, Profile>>;
  saveMe(patch: Partial<Profile>): Promise<void>;

  listGroups(): Promise<Group[]>;
  createGroup(input: Pick<Group, 'name' | 'kind' | 'goal' | 'icon'>): Promise<Group>;
  updateGroup(id: string, patch: Partial<Pick<Group, 'name' | 'icon' | 'goal' | 'likes' | 'spots' | 'photoUrl' | 'regalitoOn' | 'budgetMode' | 'budgetDefault' | 'usdRate'>>): Promise<void>;
  groupPreview(code: string): Promise<{ id: string; name: string; members: number } | null>;
  joinGroup(code: string): Promise<string>;

  listPlans(groupIds: string[]): Promise<Plan[]>;
  createPlan(groupId: string, proposed: Proposed): Promise<string>;
  deletePlan(id: string): Promise<void>;
  updatePlan(id: string, patch: Partial<Pick<Plan, 'status' | 'round' | 'answers' | 'date' | 'reminders' | 'roles'>>): Promise<void>;
  saveBallot(planId: string, round: Round, data: object, done: boolean): Promise<void>;
  dropOut(planId: string, reason: string): Promise<void>;
  rejoin(planId: string): Promise<void>;
  addExpense(planId: string, e: Omit<Expense, 'id'>): Promise<void>;
  markPaid(planId: string, from: string, to: string): Promise<void>;

  listPoints(groupIds: string[]): Promise<PointEntry[]>;
  addPoints(entries: Omit<PointEntry, 'createdAt'>[]): Promise<void>;
  sendBuzz(groupId: string, style: string, msg: string): Promise<void>;
  listBuzzes(groupIds: string[]): Promise<Buzz[]>;

  listNotes(groupIds: string[]): Promise<Note[]>;
  addNote(n: Omit<Note, 'id' | 'author' | 'createdAt'>): Promise<void>;
  deleteNote(id: string): Promise<void>;

  listRegalitos(groupIds: string[]): Promise<Regalito[]>;
  createRegalito(groupId: string, bdayUser: string, year: number, budget: { amount: number; mode: 'ars' | 'usd' }): Promise<void>;
  updateRegalito(id: string, patch: RegalitoPatch): Promise<void>;
  addIdea(regalitoId: string, title: string, price: number): Promise<void>;
  voteIdea(ideaId: string, on: boolean): Promise<void>;
  voteBudget(regalitoId: string, yes: boolean): Promise<void>;
  resetBudgetVotes(regalitoId: string): Promise<void>;
  markRegalitoPaid(regalitoId: string, userId: string): Promise<void>;
  savePushSubscription(sub: { endpoint: string; keys: unknown }): Promise<void>;

  subscribe(cb: () => void): () => void;
  /** Avisa apenas llega un zumbido nuevo (sin esperar a recargar todo). */
  onBuzz(cb: (b: Buzz) => void): () => void;
}
