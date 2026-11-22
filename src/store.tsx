import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, type Buzz, type Group, type Plan, type PointEntry, type Profile } from './data';
import { playBuzz } from './components/fx';

interface State {
  ready: boolean;
  userId: string | null;
  profiles: Record<string, Profile>;
  groups: Group[];
  plans: Plan[];
  points: PointEntry[];
  buzzes: Buzz[];
}
interface Store extends State {
  me: Profile | null;
  reload: () => Promise<void>;
  toast: (msg: string) => void;
  nick: (id: string) => string;
  group: (id: string) => Group | undefined;
  seenBuzz: (id: string) => boolean;
  markBuzzSeen: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

const SEEN_KEY = 'plancito-zumbidos-vistos';
const readSeen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>({ ready: false, userId: null, profiles: {}, groups: [], plans: [], points: [], buzzes: [] });
  const [toastMsg, setToast] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const toastT = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((msg: string) => {
    setToast(msg); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const reload = useCallback(async () => {
    try {
      const userId = await api.currentUserId();
      if (!userId) { setS({ ready: true, userId: null, profiles: {}, groups: [], plans: [], points: [], buzzes: [] }); return; }
      const groups = await api.listGroups();
      const ids = groups.map((g) => g.id);
      const people = [...new Set([userId, ...groups.flatMap((g) => g.members)])];
      const [profiles, plans, points, buzzes] = await Promise.all([api.getProfiles(people), api.listPlans(ids), api.listPoints(ids), api.listBuzzes(ids)]);
      setS({ ready: true, userId, profiles, groups, plans, points, buzzes });
    } catch (e) {
      console.error(e);
      toast('No pudimos cargar los datos. Revisá tu conexión.');
      setS((x) => ({ ...x, ready: true }));
    }
  }, [toast]);

  useEffect(() => {
    reload();
    const offAuth = api.onAuthChange(() => reload());
    const offSub = api.subscribe(() => reload());
    return () => { offAuth(); offSub(); };
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
  }), [s, reload, toast, seen, markBuzzSeen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </Ctx.Provider>
  );
}
