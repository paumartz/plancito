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

export interface Api {
  mode: 'local' | 'supabase';
  currentUserId(): Promise<string | null>;
  signIn(email: string): Promise<'sent' | 'signed-in'>;
  signOut(): Promise<void>;
  onAuthChange(cb: () => void): () => void;

  getProfiles(ids: string[]): Promise<Record<string, Profile>>;
  saveMe(patch: Partial<Profile>): Promise<void>;

  listGroups(): Promise<Group[]>;
  createGroup(input: Pick<Group, 'name' | 'kind' | 'goal' | 'icon'>): Promise<Group>;
  updateGroup(id: string, patch: Partial<Pick<Group, 'name' | 'icon' | 'goal' | 'likes' | 'spots' | 'photoUrl'>>): Promise<void>;
  groupPreview(code: string): Promise<{ id: string; name: string; members: number } | null>;
  joinGroup(code: string): Promise<string>;

  listPlans(groupIds: string[]): Promise<Plan[]>;
  createPlan(groupId: string, proposed: Proposed): Promise<string>;
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

  subscribe(cb: () => void): () => void;
}
