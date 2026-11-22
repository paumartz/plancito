import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type Buzz, type Group, type Note, type Plan, type PointEntry, type Profile, type Regalito, type Ride } from './data';
import { daysToBirthday } from './lib/logic/regalito';
import { today } from './lib/logic/dates';
import { playBuzz } from './components/fx';
import { fetchMep, type Mep } from './lib/mep';

interface State {
  ready: boolean;
  userId: string | null;
  profiles: Record<string, Profile>;
  groups: Group[];
  plans: Plan[];
  points: PointEntry[];
  buzzes: Buzz[];
  regalitos: Regalito[];
  notes: Note[];
  rides: Ride[];
}
interface Store extends State {
  me: Profile | null;
  reload: () => Promise<void>;
  toast: (msg: string) => void;
  nick: (id: string) => string;
  group: (id: string) => Group | undefined;
  seenBuzz: (id: string) => boolean;
  markBuzzSeen: (id: string) => void;
  mep: Mep | null;
  /** Cotización a usar: MEP promedio del mes, o la de respaldo del grupo si no se pudo consultar. */
  usdRate: (g: Group) => number;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

const SEEN_KEY = 'plancito-zumbidos-vistos';
const readSeen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>({ ready: false, userId: null, profiles: {}, groups: [], plans: [], points: [], buzzes: [], regalitos: [], notes: [], rides: [] });
  const [toastMsg, setToast] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const toastT = useRef<ReturnType<typeof setTimeout>>();
  const [mep, setMep] = useState<Mep | null>(null);
  const mepRef = useRef<Mep | null>(null);
  useEffect(() => { fetchMep().then((m) => { mepRef.current = m; setMep(m); }); }, []);

  const toast = useCallback((msg: string) => {
    setToast(msg); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), msg.length > 80 ? 9000 : 2600);
  }, []);

  const reload = useCallback(async () => {
    try {
      const userId = await api.currentUserId();
      if (!userId) { setS({ ready: true, userId: null, profiles: {}, groups: [], plans: [], points: [], buzzes: [], regalitos: [], notes: [], rides: [] }); return; }
      const groups = await api.listGroups();
      const ids = groups.map((g) => g.id);
      const people = [...new Set([userId, ...groups.flatMap((g) => g.members)])];
      const [profiles, plans, points, buzzes] = await Promise.all([api.getProfiles(people), api.listPlans(ids), api.listPoints(ids), api.listBuzzes(ids)]);
      const notes = await api.listNotes(ids).catch(() => [] as Note[]);
      const rides = await api.listRides(plans.filter((p) => p.status === 'definido').map((p) => p.id)).catch(() => [] as Ride[]);
      let regalitos = await api.listRegalitos(ids);
      // Si se acerca el cumple de alguien (30 días) en un grupo con regalito, se arma solo.
      // Lo arma cualquiera menos el cumpleañero, que nunca lo ve.
      const t = today();
      const toCreate = groups.filter((g) => g.regalitoOn).flatMap((g) => g.members.filter((m) => m !== userId && profiles[m]?.birthday)
        .map((m) => ({ g, m, d: daysToBirthday(profiles[m].birthday!, t) }))
        .filter(({ g, m, d }) => d <= 30 && !regalitos.some((r) => r.groupId === g.id && r.bdayUser === m && r.status !== 'entregado' && Date.now() - new Date(r.createdAt).getTime() < 200 * 864e5)));
      if (toCreate.length) {
        for (const { g, m, d } of toCreate) {
          const year = new Date(t.getTime() + d * 864e5).getFullYear();
          if (!regalitos.some((r) => r.groupId === g.id && r.bdayUser === m && r.year === year))
            await api.createRegalito(g.id, m, year, { amount: g.budgetMode === 'usd' ? Math.round(g.budgetDefault / (mepRef.current?.rate || g.usdRate)) : g.budgetDefault, mode: g.budgetMode }).catch(() => undefined);
        }
        regalitos = await api.listRegalitos(ids);
      }
      setS({ ready: true, userId, profiles, groups, plans, points, buzzes, regalitos, notes, rides });
    } catch (e) {
      console.error(e);
      const msg = (e as Error).message || String(e);
      // Mensaje concreto para poder diagnosticar (por ejemplo, si falta correr el SQL en Supabase).
      if (/does not exist|schema cache|relation|Could not find/i.test(msg)) toast('Falta preparar la base: corré los archivos SQL de supabase/migrations en Supabase. Detalle: ' + msg);
      else if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) toast('No pudimos conectarnos con el servidor. Revisá tu conexión.');
      else toast('No pudimos cargar los datos: ' + msg);
      setS((x) => ({ ...x, ready: true }));
    }
  }, [toast]);

  useEffect(() => {
    reload();
    const offAuth = api.onAuthChange(() => reload());
    const offSub = api.subscribe(() => reload());
    // Zumbidos al instante: se suman a la lista y se reproducen sin esperar la recarga completa.
    const addBuzzes = (list: Buzz[]) => setS((x) => {
      const ids = new Set(x.buzzes.map((b) => b.id)), fresh = list.filter((b) => !ids.has(b.id) && x.groups.some((g) => g.id === b.groupId));
      return fresh.length ? { ...x, buzzes: [...x.buzzes, ...fresh] } : x;
    });
    const offBuzz = api.onBuzz((b) => addBuzzes([b]));
    // Respaldo por si el tiempo real se corta: cada 15 segundos (con la app abierta) y al volver a la app.
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      setS((x) => { if (x.userId && x.groups.length) api.listBuzzes(x.groups.map((g) => g.id)).then(addBuzzes).catch(() => undefined); return x; });
    };
    const timer = setInterval(poll, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') { poll(); reload(); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => { offAuth(); offSub(); offBuzz(); clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [reload]);

  const markBuzzSeen = useCallback((id: string) => {
    setSeen((prev) => { const n = [...new Set([...prev, id])].slice(-200); try { localStorage.setItem(SEEN_KEY, JSON.stringify(n)); } catch { /* */ } return n; });
  }, []);

  // Un zumbido recién llegado (últimos 10 minutos) se reproduce solo.
  useEffect(() => {
    if (!s.userId) return;
    const fresh = s.buzzes.filter((b) => b.from !== s.userId && !seen.includes(b.id) && Date.now() - new Date(b.createdAt).getTime() < 10 * 60000)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!fresh) return;
    const from = s.profiles[fresh.from], g = s.groups.find((x) => x.id === fresh.groupId);
    if (!from || !g) return;
    markBuzzSeen(fresh.id);
    playBuzz({ av: from.avatar, text: `<b>${from.nick || from.name}</b> le mandó un zumbido a <b>${g.name}</b>`, style: fresh.style, msg: fresh.msg || '', sound: s.profiles[s.userId]?.zumbido?.sound !== false });
  }, [s.buzzes, s.userId, s.profiles, s.groups, seen, markBuzzSeen]);

  const value = useMemo<Store>(() => ({
    ...s,
    me: s.userId ? s.profiles[s.userId] ?? null : null,
    reload, toast,
    nick: (id: string) => s.profiles[id]?.nick || s.profiles[id]?.name || 'Alguien',
    group: (id: string) => s.groups.find((g) => g.id === id),
    seenBuzz: (id: string) => seen.includes(id),
    markBuzzSeen,
    mep,
    usdRate: (g: Group) => mep?.rate || g.usdRate,
  }), [s, reload, toast, seen, markBuzzSeen, mep]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </Ctx.Provider>
  );
}
