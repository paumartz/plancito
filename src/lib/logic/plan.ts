// Reglas del plancito. Dos rondas, cada una en una sola pantalla y con multi-opción:
// 1) "cuando": disponibilidad día × momento (mañana / mediodía / tarde / noche).
// 2) "donde": qué hacemos, horario y, si es para comer, lugar y menú.
// Gana lo más votado. Lo que nadie elige queda "improvisado".

export type MomentoId = 'manana' | 'mediodia' | 'tarde' | 'noche';
export interface Momento { id: MomentoId; label: string; en: string; horas: string[] }

export const MOMENTOS: Momento[] = [
  { id: 'manana', label: 'Mañana', en: 'a la mañana', horas: ['9:30', '10:00', '10:30', '11:00'] },
  { id: 'mediodia', label: 'Mediodía', en: 'al mediodía', horas: ['12:30', '13:00', '13:30', '14:00'] },
  { id: 'tarde', label: 'Tarde', en: 'a la tarde', horas: ['16:00', '17:00', '18:00', '19:00'] },
  { id: 'noche', label: 'Noche', en: 'a la noche', horas: ['20:30', '21:00', '21:30', '22:00'] },
];
export const MOM = (id: string) => MOMENTOS.find((m) => m.id === id)!;

export interface PlanType { l: string; ph: string; food?: boolean; m: MomentoId[] }
export const PLANES: Record<string, PlanType> = {
  cena: { l: 'Cena', ph: 'a cenar', food: true, m: ['noche'] },
  almuerzo: { l: 'Almuerzo', ph: 'a almorzar', food: true, m: ['mediodia'] },
  desayuno: { l: 'Desayuno / brunch', ph: 'a desayunar', food: true, m: ['manana'] },
  cafe: { l: 'Cafecito', ph: 'a tomar un cafecito', food: true, m: ['manana', 'tarde'] },
  birras: { l: 'Birras / tragos', ph: 'a tomar algo', food: true, m: ['tarde', 'noche'] },
  cine: { l: 'Cine', ph: 'para ir al cine', m: ['tarde', 'noche'] },
  teatro: { l: 'Teatro', ph: 'para ir al teatro', m: ['tarde', 'noche'] },
  plaza: { l: 'Plaza / picnic', ph: 'para ir a la plaza', m: ['manana', 'mediodia', 'tarde'] },
  museo: { l: 'Museo / muestra', ph: 'para ir a una muestra', m: ['manana', 'mediodia', 'tarde'] },
  feria: { l: 'Feria', ph: 'para ir a una feria', m: ['manana', 'mediodia'] },
  recital: { l: 'Recital', ph: 'para ir a un recital', m: ['noche'] },
  caminata: { l: 'Caminata / bici', ph: 'para salir a caminar', m: ['manana', 'tarde'] },
};

export type Option = [id: string, label: string, phrase?: string];
export interface Spot { name: string; type: 'resto' | 'delivery' }

export const LUGARES: Option[] = [
  ['casa', 'En casa', 'en casa'],
  ['afuera', 'Resto / bar', 'en un resto o bar'],
  ['aire', 'Al aire libre', 'en una plaza o parque'],
];
export const MENUS: Record<string, Option[]> = {
  desayuno: [['medialunas', 'Café con medialunas'], ['brunch', 'Brunch completo'], ['tostadas', 'Tostadas y palta']],
  almuerzo: [['asado', 'Asado'], ['pastas', 'Pastas'], ['bowls', 'Bowls y ensaladas'], ['cocinamos', '¡Cocinamos!']],
  cafe: [['especialidad', 'Café de especialidad'], ['mate', 'Mate y facturas'], ['dulce', 'Algo dulce']],
  cena: [['pizza', 'Pizza'], ['burgers', 'Hamburguesas'], ['sushi', 'Sushi'], ['picada', 'Picada y vinito'], ['cocinamos', '¡Cocinamos!']],
  birras: [['artesanal', 'Cerveza artesanal'], ['tragos', 'Tragos'], ['vinito', 'Vinito']],
};
export const COCINA: Option[] = [['pastas', 'Pastas caseras'], ['tacos', 'Tacos'], ['risotto', 'Risotto'], ['empanadas', 'Empanadas'], ['pizza', 'Pizza casera']];
export const IMPRO_LUGAR: Option = ['impro', 'Lo vemos en el momento', ''];
export const IMPRO_MENU: Option = ['impro', 'Improvisamos'];

export const planesFor = (likes: string[], mom: string) => {
  const all = Object.keys(PLANES).filter((k) => PLANES[k].m.includes(mom as MomentoId));
  return [...all.filter((k) => likes.includes(k)), ...all.filter((k) => !likes.includes(k))];
};
export const lugaresFor = (spots: Spot[]): Option[] => [
  ...spots.filter((s) => s.type === 'resto').map((s): Option => ['spot:' + s.name, 'En ' + s.name, 'en ' + s.name]),
  ...LUGARES,
];
export const menusFor = (spots: Spot[], plan: string): Option[] => [
  ...(MENUS[plan] || []),
  ...(['almuerzo', 'cena'].includes(plan) ? spots.filter((s) => s.type === 'delivery').map((s): Option => ['deli:' + s.name, 'Pedimos a ' + s.name]) : []),
];

// ---------- votos ----------
export interface BallotCuando { slots: string[] }
export interface BallotDonde { plan: string[]; lugar: string[]; host: boolean; menu: string[]; cocina: string[]; hora: string[] }
export type Ballot = Partial<BallotCuando & BallotDonde>;
export type Ballots = Record<string, Ballot>;

export const slotId = (day: string, mom: string) => `${day}|${mom}`;
export const emptyBallot = (round: 'cuando' | 'donde'): Ballot =>
  round === 'cuando' ? { slots: [] } : { plan: [], lugar: [], host: false, menu: [], cocina: [], hora: [] };

export function votersFor(ballots: Ballots, field: keyof BallotCuando | keyof BallotDonde, id: string): string[] {
  return Object.entries(ballots)
    .filter(([, b]) => ((b[field] as string[] | undefined) || []).includes(id))
    .map(([w]) => w);
}
/** La opción con más votos (en empate, la primera de la lista). */
export function best(ballots: Ballots, field: keyof BallotCuando | keyof BallotDonde, ids: string[]): string {
  let bi = ids[0], bn = -1;
  for (const id of ids) {
    const n = votersFor(ballots, field, id).length;
    if (n > bn) { bn = n; bi = id; }
  }
  return bi;
}
const bestOrImpro = (ballots: Ballots, field: keyof BallotDonde, ids: string[]) => {
  const w = best(ballots, field, ids);
  return votersFor(ballots, field, w).length ? w : 'impro';
};

export interface Answer { id: string; label: string; phrase: string; date?: string }
export interface Answers {
  dia?: Answer; momento?: Answer; plan?: Answer; hora?: Answer; lugar?: Answer; host?: Answer; menu?: Answer; cocina?: Answer;
}
export interface Proposed { momento?: MomentoId; plan?: string; dia?: string }

export function leadPlan(likes: string[], answers: Answers, ballots: Ballots, proposed: Proposed = {}) {
  const ids = planesFor(likes, answers.momento!.id);
  const w = best(ballots, 'plan', ids);
  if (votersFor(ballots, 'plan', w).length) return w;
  return proposed.plan && ids.includes(proposed.plan) ? proposed.plan : ids[0];
}

/** Cierra la ronda "cuándo": devuelve día y momento ganadores. */
export function closeCuando(ballots: Ballots, days: { id: string; date: string; label: string; phrase: string }[]): Pick<Answers, 'dia' | 'momento'> {
  const ids = days.flatMap((d) => MOMENTOS.map((m) => slotId(d.id, m.id)));
  const [d, m] = best(ballots, 'slots', ids).split('|');
  const day = days.find((x) => x.id === d)!, mo = MOM(m);
  return { dia: { ...day }, momento: { id: mo.id, label: mo.label, phrase: mo.en } };
}

/** Cierra la ronda "qué y dónde" y completa las respuestas. */
export function closeDonde(opts: { likes: string[]; spots: Spot[]; answers: Answers; ballots: Ballots; proposed?: Proposed; nick: (id: string) => string }): Answers {
  const { likes, spots, ballots, nick } = opts;
  const a: Answers = { ...opts.answers };
  const mom = a.momento!.id;
  const planId = leadPlan(likes, a, ballots, opts.proposed), PL = PLANES[planId];
  a.plan = { id: planId, label: PL.l, phrase: PL.ph };
  if (PL.food) {
    const vols = Object.entries(ballots).filter(([, b]) => b.host).map(([w]) => w);
    const LS = lugaresFor(spots);
    let lugar = bestOrImpro(ballots, 'lugar', [...LS.map((x) => x[0]), 'impro']);
    if (lugar === 'casa' && !vols.length) lugar = bestOrImpro(ballots, 'lugar', [...LS.map((x) => x[0]).filter((x) => x !== 'casa'), 'impro']);
    const L = LS.find((x) => x[0] === lugar) || IMPRO_LUGAR;
    a.lugar = { id: L[0], label: L[1], phrase: L[2] || '' };
    if (lugar === 'casa') a.host = { id: vols[0], label: 'Lo de ' + nick(vols[0]), phrase: 'en lo de ' + nick(vols[0]) };
    const MS = menusFor(spots, planId);
    const menuIds = [...MS.map((x) => x[0]).filter((x) => lugar === 'casa' || (x !== 'cocinamos' && !x.startsWith('deli:'))), 'impro'];
    const mn = bestOrImpro(ballots, 'menu', menuIds), M = MS.find((x) => x[0] === mn) || IMPRO_MENU;
    a.menu = { id: mn, label: M[1], phrase: M[1].toLowerCase() };
    if (mn === 'cocinamos') {
      const c = best(ballots, 'cocina', COCINA.map((x) => x[0])), C = COCINA.find((x) => x[0] === c)!;
      a.cocina = { id: c, label: C[1], phrase: C[1].toLowerCase() };
    }
  }
  const h = best(ballots, 'hora', MOM(mom).horas);
  a.hora = { id: h, label: h, phrase: h };
  return a;
}

// ---------- textos ----------
export function planWhere(a: Answers) {
  if (!a.lugar) return '';
  if (a.lugar.id === 'casa') return a.host ? a.host.phrase : 'en casa';
  return a.lugar.phrase;
}
export function planTitle(a: Answers, voting = false) {
  if (!a.momento) return voting ? 'Plancito en votación' : 'Plancito';
  if (!a.plan) return `Plancito ${MOM(a.momento.id).en}`;
  const where = a.host ? 'en lo de ' + a.host.label.replace('Lo de ', '')
    : a.lugar ? ({ aire: 'al aire libre', afuera: 'afuera' } as Record<string, string>)[a.lugar.id] || (a.lugar.id.startsWith('spot:') ? a.lugar.phrase : '') : '';
  return `${a.plan.label} ${where}`.trim();
}
export function planSentence(a: Answers) {
  if (!a.dia || !a.hora || !a.plan) return '';
  let s = `Nos juntamos ${a.dia.phrase} a las ${a.hora.label} ${planWhere(a)} ${a.plan.phrase}.`.replace(/\s+/g, ' ');
  if (a.lugar?.id === 'impro') s += ' El lugar lo vemos en el momento.';
  if (a.menu) s += a.menu.id.startsWith('deli:') ? ` ${a.menu.label}.` : a.menu.id === 'cocinamos' ? ` Cocinamos ${a.cocina ? a.cocina.phrase : 'algo rico'}.` : ` Menú: ${a.menu.phrase}.`;
  return s;
}
export function gcalUrl(a: Answers, groupName: string, link: string) {
  const [hh, mm] = a.hora!.label.split(':').map(Number);
  const [y, mo, d] = a.dia!.date!.split('-').map(Number);
  const st = new Date(y, mo - 1, d, hh, mm || 0), en = new Date(st.getTime() + 150 * 60000);
  const f = (x: Date) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}T${String(x.getHours()).padStart(2, '0')}${String(x.getMinutes()).padStart(2, '0')}00`;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(`Plancito: ${planTitle(a)} (${groupName})`)
    + `&dates=${f(st)}/${f(en)}&ctz=America/Argentina/Buenos_Aires&details=` + encodeURIComponent(planSentence(a) + '\n' + link)
    + '&location=' + encodeURIComponent(planWhere(a));
}
/** Mensaje para mandar por WhatsApp. "others" = a cuántas personas va (1 = una sola, sin plural). */
export function shareText(p: Proposed, link: string, days: { id: string; phrase: string }[], others = 2) {
  const mo = p.momento && MOM(p.momento), pl = p.plan && PLANES[p.plan], d = p.dia && days.find((x) => x.id === p.dia);
  const que = pl ? pl.l.toLowerCase() : 'algo', one = others === 1;
  if (mo && d) return one ? `¿Hacemos un plancito? Te propongo ${que} ${d.phrase} ${mo.en}. Si te sirve, es un toque: ${link}`
    : `Che, ¿hacemos un plancito? Propongo ${que} ${d.phrase} ${mo.en}. Si les sirve, es un toque: ${link}`;
  if (mo) return one ? `¿Hacemos ${que} ${mo.en}? Marcá qué días podés acá: ${link}` : `Che, ¿hacemos ${que} ${mo.en}? Marquen qué días pueden acá: ${link}`;
  return one ? `¿Hacemos un plancito? Marcá cuándo podés acá: ${link}` : `Che, ¿hacemos un plancito? Marquen cuándo pueden acá: ${link}`;
}
