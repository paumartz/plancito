import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Group, type Plan } from '../data';
import { useStore } from '../store';
import { Av, AvStack, I, Sheet, TopBar, copyText, shareText } from '../components/ui';
import { celebrate, starBurst } from '../components/fx';
import { attendees, effBallots, effDone, planDays } from '../lib/derive';
import {
  COCINA, LUGARES, MOM, MOMENTOS, PLANES, closeCuando, closeDonde, emptyBallot, gcalUrl, leadPlan, lugaresFor, menusFor,
  planSentence, planTitle, planesFor, slotId, votersFor, type Ballot, type BallotDonde,
} from '../lib/logic/plan';
import { debtKey, settle } from '../lib/logic/split';
import { POINTS } from '../lib/logic/points';
import { fmtDay, iso, money, today } from '../lib/logic/dates';
import PuntoMedio from '../components/PuntoMedio';

export default function PlanPage() {
  const { id } = useParams();
  const st = useStore();
  const p = st.plans.find((x) => x.id === id);
  const g = p && st.group(p.groupId);
  if (!p || !g) return <><TopBar title="Plancito" back="/" /><div className="empty">No encontramos este plancito (o todavía no sos parte del grupo).</div></>;
  return <PlanView p={p} g={g} />;
}

function PlanView({ p, g }: { p: Plan; g: Group }) {
  const st = useStore();
  const { userId, nick, toast, reload } = st;
  const me = userId!;
  const att = attendees(g, p);
  const imOut = p.out.some((o) => o.who === me);
  const link = `${location.origin}/p/${p.id}`;
  const [sheet, setSheet] = useState<null | 'out' | 'done' | 'cancel'>(null);
  const nav = useNavigate();
  const closing = useRef(false);

  // Mi voto en borrador: se guarda en cada toque.
  const round = p.round || 'cuando';
  const eb = effBallots(p, round), ed = effDone(p, round);
  const mine: Ballot = { ...emptyBallot(round), ...(eb[me] || {}) };
  const ballots = { ...eb, [me]: mine };
  const iDone = ed.includes(me);
  const iProposed = me === p.createdBy && (round === 'cuando' ? !!(p.proposed.dia && p.proposed.momento) : !!p.proposed.plan);

  async function save(next: Ballot, done = iDone) {
    try { await api.saveBallot(p.id, round, next, done); await reload(); } catch (e) { toast('No se pudo guardar: ' + (e as Error).message); }
  }
  const toggle = (field: keyof BallotDonde | 'slots', id: string) => {
    const arr = ((mine[field] as string[]) || []);
    save({ ...mine, [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] });
  };

  async function closeRound() {
    if (closing.current) return; closing.current = true;
    try {
      if (p.round === 'cuando') {
        const a = { ...p.answers, ...closeCuando(effBallots(p, 'cuando'), planDays(p)) };
        await api.updatePlan(p.id, { answers: a, round: 'donde' });
        toast(`Quedó ${a.dia!.label} · ${a.momento!.label}. Ahora, qué hacemos.`);
      } else if (p.round === 'donde') {
        const a = closeDonde({ likes: g.likes, spots: g.spots, answers: p.answers, ballots: effBallots(p, 'donde'), proposed: p.proposed, nick });
        await api.updatePlan(p.id, { answers: a, status: 'definido', round: null, date: a.dia!.date });
        celebrate({ title: `Plancito definido · ${g.name}`, when: `${a.dia!.label} · ${a.hora!.label}`, sentence: planSentence(a),
          avatars: att.map((x) => st.profiles[x]?.avatar).filter(Boolean), gcal: gcalUrl(a, g.name, link) });
      }
      await reload();
    } catch (e) { toast('No se pudo cerrar la votación: ' + (e as Error).message); }
    finally { closing.current = false; }
  }

  // Si ya respondieron todos, la ronda se cierra sola.
  const alone = g.members.length < 2;
  const allDone = p.status === 'votando' && p.round && att.length >= 2 && att.every((x) => effDone(p, p.round!).includes(x));
  useEffect(() => { if (allDone) closeRound(); }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>
    <TopBar title={planTitle(p.answers, p.status === 'votando')} back={`/g/${g.id}`} />
    <p className="small muted" style={{ marginTop: -14 }}>{g.name} · propuesto por {nick(p.createdBy)} el {fmtDay(p.createdAt.slice(0, 10), { day: 'numeric', month: 'short' })}</p>
    {p.status === 'votando' ? Voting() : Defined()}
    {p.status !== 'realizado' && p.createdBy === me && <button className="link small" style={{ alignSelf: 'center', color: 'var(--ink-2)' }} onClick={() => setSheet('cancel')}>Cancelar este plancito</button>}
    {sheet === 'cancel' && <Sheet onClose={() => setSheet(null)}><h2>¿Cancelar el plancito?</h2><p className="small muted">Se borra para todo el grupo, con sus votos.</p>
      <div className="grid2"><button className="btn ghost" onClick={() => setSheet(null)}>No</button>
        <button className="btn tomato" onClick={() => api.deletePlan(p.id).then(async () => { await reload(); toast('Plancito cancelado'); nav(`/g/${g.id}`, { replace: true }); }).catch((e) => toast('No se pudo cancelar: ' + (e as Error).message))}>Sí, cancelar</button></div></Sheet>}
    {sheet === 'out' && <OutSheet p={p} onClose={() => setSheet(null)} />}
    {sheet === 'done' && <DoneSheet p={p} g={g} att={att} onClose={() => setSheet(null)} />}
  </>;

  function Footer() {
    if (alone) return <div className="sticker bg-peach"><h3>Falta que se sume {g.kind === 'pareja' ? 'tu pareja' : 'alguien más'}</h3>
      <p className="small">La votación sigue abierta hasta que entre al grupo y responda. Mandale el link de invitación:</p>
      <button className="btn" onClick={() => shareText(`Sumate a ${g.name} en Plancito: ${location.origin}/i/${g.inviteCode}?p=${p.id}`, toast)}>Mandar invitación</button></div>;
    const done = att.filter((x) => ed.includes(x)), missing = att.filter((x) => x !== me && !ed.includes(x));
    return <>
      <div className="card tight"><div className="row between"><span className="small" style={{ fontWeight: 700 }}>Respondieron {done.length} de {att.length}</span><AvStack ids={done} size={24} /></div>
        {missing.length > 0 && <p className="small muted">Falta: {missing.map(nick).join(', ')} · <button className="link small" onClick={() => shareText(`¡Falta tu voto para el plancito${g.members.length === 2 ? '' : ` de ${g.name}`}! ${link}`, toast)}>{missing.length === 1 ? 'Recordarle' : 'Recordarles'}</button></p>}
        <p className="small muted">Se cierra sola cuando responden todos.</p></div>
      {!imOut && (iDone ? <>
        <p className="small" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--ok)' }}>{iProposed ? 'Tu propuesta ya cuenta como tu voto. Si querés, sumá otras opciones.' : 'Listo, ya está lo tuyo. Podés cambiarlo hasta que cierre.'}</p>
        {!alone && <button className="btn ghost full" onClick={closeRound}>Cerrar ahora con lo que hay</button>}
      </> : <button className="btn tomato full" onClick={() => {
        if (round === 'cuando' && !(mine.slots || []).length) { toast('Marcá al menos un horario'); return; }
        save(mine, true).then(() => toast('¡Listo! Te avisamos cuando se defina'));
      }}>Listo, mandar lo mío</button>)}
      {imOut ? <button className="btn ghost full" onClick={() => api.rejoin(p.id).then(reload)}>Volver a sumarme</button>
        : <button className="link small" style={{ alignSelf: 'center' }} onClick={() => setSheet('out')}>Esta vez no puedo</button>}
    </>;
  }

  function Voting() {
    const steps = <div className="row" style={{ gap: 6 }}>{([['cuando', '1 · Cuándo'], ['donde', '2 · Qué y dónde']] as const).map(([k, l], i) =>
      <span key={k} className="row" style={{ gap: 6 }}>{i > 0 && <span className="muted">→</span>}<span className={`chip ${round === k ? 'pastel' : ''}`}>{l}</span></span>)}</div>;
    if (round === 'cuando') {
      const days = planDays(p), total = att.length, ids = days.flatMap((d) => MOMENTOS.map((m) => slotId(d.id, m.id)));
      let bestId = ids[0], bestN = 0;
      ids.forEach((x) => { const n = votersFor(ballots, 'slots', x).length; if (n > bestN) { bestN = n; bestId = x; } });
      const [bd, bm] = bestId.split('|'), prop = p.proposed, pd = prop.dia && days.find((d) => d.id === prop.dia);
      return <>
        {steps}
        <section className="sec">
          <div><h2 style={{ fontSize: 22 }}>¿Cuándo podés?</h2><p className="small muted">Tocá todos los horarios que te sirven, de una. Gana donde puedan más.</p></div>
          {prop.momento && <div className="sticker bg-peach"><div className="row"><Av p={st.profiles[p.createdBy]} size={40} /><div className="grow"><p className="by">{nick(p.createdBy)} propone</p>
            <h3 style={{ fontSize: 19 }}>{prop.plan ? PLANES[prop.plan].l + ' · ' : ''}{pd ? pd.label + ' · ' : ''}{MOM(prop.momento).label}</h3></div>
            {pd && !imOut && !iDone && <button className="btn sm" onClick={() => save({ ...mine, slots: [...new Set([...(mine.slots || []), slotId(prop.dia!, prop.momento!)])] }, true)}>Me sirve</button>}</div>
            <p className="small muted">{pd ? 'Si te sirve, un toque y listo. Si no, marcá lo que puedas abajo.' : `Marcá qué días podés ${MOM(prop.momento).en}. Si te sirve otro momento, también vale.`}</p></div>}
          <div className="slotgrid"><span />{MOMENTOS.map((m) => <span key={m.id} className="h">{m.label}</span>)}
            {days.map((d) => [<span key={d.id} className="d">{d.label}</span>, ...MOMENTOS.map((m) => {
              const sid = slotId(d.id, m.id), v = votersFor(ballots, 'slots', sid), on = (mine.slots || []).includes(sid), win = sid === bestId && bestN > 0;
              return <button key={sid} className={`slot ${on ? 'mine' : ''} ${win ? 'best' : ''}`} style={{ ['--h' as string]: total ? v.length / total : 0 }} disabled={imOut}
                aria-pressed={on} aria-label={`${d.label} ${m.label}: pueden ${v.length}`} onClick={() => toggle('slots', sid)}>
                <span className="num">{on ? '✓ ' : ''}{v.length}/{total}</span>{win && <small>gana</small>}</button>;
            })])}
          </div>
          {bestN > 0 && <div className="card tight"><span className="eyebrow">Por ahora gana</span><h3>{days.find((d) => d.id === bd)?.label} · {MOM(bm).label}</h3>
            <p className="small muted">Pueden {bestN} de {total}: {votersFor(ballots, 'slots', bestId).map(nick).join(', ')}</p></div>}
          {Footer()}
        </section>
      </>;
    }
    const mom = p.answers.momento!.id, lead = leadPlan(g.likes, p.answers, ballots, p.proposed), LP = PLANES[lead];
    const vols = Object.entries(ballots).filter(([, b]) => b.host).map(([w]) => w);
    const group = (k: keyof BallotDonde, title: string, list: [string, string, string?][]) => <div className="field"><label>{title}</label>
      <div className="row wrap" style={{ gap: 7 }}>{list.map(([oid, l]) => { const on = ((mine[k] as string[]) || []).includes(oid);
        return <button key={oid} className={on ? 'vchip on' : 'vchip'} disabled={imOut} aria-pressed={on} onClick={() => toggle(k, oid)}>{l}<span className="n num">{votersFor(ballots, k, oid).length}</span></button>; })}</div></div>;
    return <>
      {steps}
      <div className="ticket" style={{ padding: '14px 16px', gap: 4 }}><span className="eyebrow">Ya quedó el cuándo</span><div className="big" style={{ fontSize: 21 }}>{p.answers.dia!.label} · {p.answers.momento!.label}</div></div>
      <section className="sec">
        <div><h2 style={{ fontSize: 22 }}>¿Qué hacemos?</h2><p className="small muted">Marcá todo lo que te copa. Lo que dejes vacío lo decide el resto, y si nadie elige nada, se improvisa.</p></div>
        {group('plan', 'Plan (★ les gusta)', planesFor(g.likes, mom).map((k) => [k, PLANES[k].l + (g.likes.includes(k) ? ' ★' : '')]))}
        {group('hora', 'Horario', MOM(mom).horas.map((h) => [h, h]))}
        {LP.food && <div className="card tight" style={{ gap: 12 }}><span className="eyebrow">Va ganando {LP.l.toLowerCase()}: ¿dónde y qué comemos?</span>
          {group('lugar', 'Dónde', [...lugaresFor(g.spots), ['impro', 'Lo vemos en el momento']])}
          <div className="row wrap"><button className={mine.host ? 'vchip on' : 'vchip'} disabled={imOut} onClick={() => save({ ...mine, host: !mine.host, lugar: !mine.host && !(mine.lugar || []).includes('casa') ? [...(mine.lugar || []), 'casa'] : mine.lugar })}>{mine.host ? '✓ ' : ''}Yo puedo poner casa</button>
            <span className="small muted">{vols.filter((x) => x !== me).length ? <>También se ofreció: <b>{vols.filter((x) => x !== me).map(nick).join(', ')}</b></> : 'Nadie más se ofreció todavía.'}</span></div>
          {group('menu', 'Qué comemos', [...menusFor(g.spots, lead), ['impro', 'Improvisamos']])}
          {(((mine.menu || []).includes('cocinamos')) || votersFor(ballots, 'menu', 'cocinamos').length > 0) && group('cocina', 'Si cocinamos, ¿qué?', COCINA)}
        </div>}
        {Footer()}
      </section>
    </>;
  }

  function Defined() {
    const a = p.answers;
    return <>
      <div className="ticket">
        <div className="row between"><span className="eyebrow">{p.status === 'realizado' ? 'Plancito realizado' : 'Plancito definido'}</span><span className="note">{p.status === 'realizado' ? '¡se hizo!' : '¡quedó!'}</span></div>
        <div className="big">{a.dia?.label} · {a.hora?.label}</div>
        <p style={{ fontSize: 16 }}>{planSentence(a)}</p>
      </div>
      <section className="sec"><div className="sec-h"><h2>Van</h2><span className="muted small">{att.length} de {g.members.length}</span></div>
        <div className="row wrap">{att.map((x) => <div key={x} className="row" style={{ gap: 6 }}><Av p={st.profiles[x]} size={32} /><span className="small" style={{ fontWeight: 700 }}>{nick(x)}</span></div>)}</div>
        {p.out.length > 0 && <div className="list">{p.out.map((o) => <div key={o.who} className="li"><Av p={st.profiles[o.who]} size={32} /><div className="grow"><p className="small" style={{ fontWeight: 700 }}>{nick(o.who)} se bajó</p><p className="small muted">{o.why ? `“${o.why}”` : 'Sin justificar'}</p></div></div>)}</div>}
      </section>
      {p.status === 'definido' && a.lugar && ['afuera', 'impro'].includes(a.lugar.id) && <section className="sec"><h2>¿Dónde exactamente?</h2>
        <PuntoMedio people={att.map((x) => st.profiles[x]).filter(Boolean)} focus={({ cafe: 'cafés', cena: 'restos', almuerzo: 'restos', desayuno: 'cafés', birras: 'bares' } as Record<string, string>)[a.plan?.id || ''] || 'lugares'} /></section>}
      {p.status === 'definido' ? <>
        <div className="card tight"><div className="row between wrap"><h3>Recordatorios</h3><a className="btn sm" href={gcalUrl(a, g.name, link)} target="_blank" rel="noopener">{I.cal} Google Calendar</a></div>
          <p className="small muted">Te avisamos para que no tengas que acordarte.</p>
          <div className="row wrap" style={{ gap: 7 }}>{([['3d', '3 días antes'], ['1d', 'El día anterior'], ['0d', 'El mismo día']] as const).map(([k, l]) => { const on = p.reminders.includes(k);
            return <button key={k} className={on ? 'vchip on' : 'vchip'} onClick={() => api.updatePlan(p.id, { reminders: on ? p.reminders.filter((x) => x !== k) : [...p.reminders, k] }).then(reload)}>{on ? '✓ ' : ''}{l}</button>; })}</div></div>
        <div className="stack">
          <button className="btn full" onClick={() => shareText(`¡Quedó el plancito! ${planSentence(a)} ${link}`, toast)}>{g.members.length === 2 ? `Mandárselo a ${nick(g.members.find((m) => m !== me)!)}` : 'Mandar al grupo de WhatsApp'}</button>
          <button className="btn tomato full" onClick={() => setSheet('done')}>Se hizo: marcar como realizado</button>
          {imOut ? <button className="btn ghost full" onClick={() => api.rejoin(p.id).then(reload)}>Volver a sumarme</button> : <button className="btn ghost full" onClick={() => setSheet('out')}>Me bajo</button>}
        </div>
      </> : <Expenses p={p} g={g} att={att} />}
    </>;
  }

}

function Expenses({ p, g, att }: { p: Plan; g: Group; att: string[] }) {
const st = useStore();
const { userId, nick, toast, reload } = st;
const me = userId!;
  const [desc, setDesc] = useState(''), [amt, setAmt] = useState(''), [by, setBy] = useState(me), [inv, setInv] = useState<string[]>(att);
  const debts = settle(p.expenses), total = p.expenses.reduce((s, e) => s + e.amount, 0);
  async function add() {
    const amount = Number(amt.replace(/[^\d]/g, ''));
    if (!desc.trim() || !amount) { toast('Poné qué fue y cuánto salió'); return; }
    if (!inv.length) { toast('Elegí al menos una persona'); return; }
    try { await api.addExpense(p.id, { description: desc.trim(), amount, paidBy: by, involved: inv }); setDesc(''); setAmt(''); await reload(); toast('Gasto agregado'); }
    catch (e) { toast('No se pudo agregar: ' + (e as Error).message); }
  }
  async function paid(from: string, to: string) {
    try {
      await api.markPaid(p.id, from, to);
      if (from === me) { await api.addPoints([{ userId: me, groupId: g.id, kind: 'pago', pts: POINTS.pago[0] }]); starBurst(POINTS.pago[0], POINTS.pago[1]); }
      await reload();
    } catch (e) { toast('No se pudo marcar: ' + (e as Error).message); }
  }
  return <>
    <section className="sec"><div className="sec-h"><h2>Gastos</h2><span className="num muted small">Total {money(total)}</span></div>
      <div className="card"><div className="list">{p.expenses.length ? p.expenses.map((e) => <div key={e.id} className="li"><Av p={st.profiles[e.paidBy]} size={34} />
        <div className="grow"><p style={{ fontWeight: 700 }}>{e.description}</p><p className="small muted">Pagó {nick(e.paidBy)} · entre {e.involved.length}: {e.involved.map(nick).join(', ')}</p></div>
        <span className="num" style={{ fontWeight: 700 }}>{money(e.amount)}</span></div>) : <p className="muted small">Todavía no hay gastos cargados.</p>}</div></div>
      <details className="card"><summary style={{ fontWeight: 700, cursor: 'pointer' }}>+ Cargar un gasto</summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="field"><label htmlFor="exDesc">¿Qué fue?</label><input id="exDesc" className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: carbón y bebidas" /></div>
          <div className="grid2"><div className="field"><label htmlFor="exAmt">Monto</label><input id="exAmt" className="inp num" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="$" /></div>
            <div className="field"><label htmlFor="exBy">Pagó</label><select id="exBy" className="inp" value={by} onChange={(e) => setBy(e.target.value)}>{att.map((x) => <option key={x} value={x}>{nick(x)}</option>)}</select></div></div>
          <div className="field"><label>Entre quiénes (solo pagan los involucrados)</label><div className="row wrap">{att.map((x) => <label key={x} className="check">
            <input type="checkbox" checked={inv.includes(x)} onChange={() => setInv(inv.includes(x) ? inv.filter((y) => y !== x) : [...inv, x])} />{nick(x)}</label>)}</div></div>
          <button className="btn full" onClick={add}>Agregar gasto</button>
        </div></details>
    </section>
    <section className="sec"><h2>Cuentas claras</h2>
      {debts.length ? debts.map((d) => { const k = debtKey(d), isPaid = p.paid.includes(k), to = st.profiles[d.to];
        if (d.from === me) return <div key={k} className={`sticker ${isPaid ? 'bg-lime' : 'bg-pink'}`}>
          <div className="row"><Av p={to} size={40} /><div className="grow"><h3>{isPaid ? 'Le pagaste' : 'Le debés'} <span className="num">{money(d.amount)}</span> a {nick(d.to)}</h3><p className="small muted">{to?.bank}</p></div></div>
          {isPaid ? <p className="small" style={{ fontWeight: 700 }}>Pagado.</p> : <>
            {to?.alias ? <div className="alias"><span>{to.alias}</span><button className="btn sm" onClick={() => copyText(to.alias, toast)}>{I.copy} Copiar alias</button></div>
              : <p className="small">{nick(d.to)} todavía no cargó su alias.</p>}
            <div className="grid2"><button className="btn sm ghost" onClick={() => copyText(String(d.amount), toast)}>Copiar monto</button><button className="btn sm" onClick={() => paid(d.from, d.to)}>Ya le pagué</button></div></>}
        </div>;
        return <div key={k} className="row card tight" style={{ flexDirection: 'row' }}><Av p={st.profiles[d.from]} size={30} /><p className="grow small"><b>{nick(d.from)}</b> le debe <b className="num">{money(d.amount)}</b> a <b>{nick(d.to)}</b></p>
          {isPaid ? <span className="chip ok">Pagó</span> : d.to === me ? <button className="btn sm soft" onClick={() => paid(d.from, d.to)}>Me pagó</button> : <span className="chip warn">Pendiente</span>}</div>;
      }) : <div className="empty">{p.expenses.length ? 'Están a mano.' : 'Cuando carguen gastos, acá aparece quién le debe a quién.'}</div>}
    </section>
  </>;
}

function OutSheet({ p, onClose }: { p: Plan; onClose: () => void }) {
const { toast, reload } = useStore();
  const [why, setWhy] = useState('');
  return <Sheet onClose={() => onClose()}>
    <h2>¿Te bajás?</h2><p className="muted small">No pasa nada. Si querés, contá por qué, así nadie se queda esperando.</p>
    <div className="field"><label htmlFor="outWhy">Justificación (opcional)</label><textarea id="outWhy" className="inp" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Ej: me surgió algo del laburo" /></div>
    <div className="grid2"><button className="btn ghost" onClick={() => onClose()}>Cancelar</button>
      <button className="btn tomato" onClick={() => api.dropOut(p.id, why.trim()).then(() => { onClose(); toast('Te bajaste. Le avisamos al grupo.'); return reload(); })}>Me bajo</button></div>
  </Sheet>;
}

function DoneSheet({ p, g, att, onClose }: { p: Plan; g: Group; att: string[]; onClose: () => void }) {
const st = useStore();
const { userId, nick, toast, reload } = st;
const me = userId!;
  const [roles, setRoles] = useState<Record<string, string[]>>({ host: p.answers.host ? [p.answers.host.id] : [], cocina: p.answers.menu?.id === 'cocinamos' && p.answers.host ? [p.answers.host.id] : [], tarjeta: [], picada: [] });
  const toggleRole = (k: string, x: string, multi: boolean) => setRoles({ ...roles, [k]: roles[k].includes(x) ? roles[k].filter((y) => y !== x) : multi ? [...roles[k], x] : [x] });
  async function confirm() {
    const all = { ...roles, iniciativa: [p.createdBy] };
    const entries = Object.entries(all).flatMap(([k, ids]) => ids.map((u) => ({ userId: u, groupId: g.id, kind: k, pts: POINTS[k][0] })));
    try {
      const date = p.date && p.date > iso(today()) ? iso(today()) : p.date;
      await api.updatePlan(p.id, { status: 'realizado', roles: all, date });
      await api.addPoints(entries);
      const mineP = entries.filter((e) => e.userId === me);
      if (mineP.length) setTimeout(() => starBurst(mineP.reduce((s, e) => s + e.pts, 0), mineP.map((e) => POINTS[e.kind][1]).join(' · ')), 300);
      onClose(); await reload();
    } catch (e) { toast('No se pudo guardar: ' + (e as Error).message); }
  }
  return <Sheet onClose={() => onClose()}>
    <h2>¿Cómo salió?</h2><p className="muted small">Marcá quién hizo qué para repartir las estrellitas. Después cargan los gastos.</p>
    {([['host', false], ['cocina', true], ['tarjeta', false], ['picada', true]] as const).map(([k, multi]) => <div key={k} className="field"><label>{POINTS[k][1]} · +{POINTS[k][0]}</label>
      <div className="row wrap">{att.map((x) => <button key={x} className={roles[k].includes(x) ? 'vchip on' : 'vchip'} onClick={() => toggleRole(k, x, multi)}>{nick(x)}</button>)}</div></div>)}
    <p className="small muted">{nick(p.createdBy)} suma +20 por tener la iniciativa.</p>
    <button className="btn tomato full" onClick={confirm}>Guardar y cargar gastos</button>
  </Sheet>;
}

// evita advertencia de import sin usar en algunos editores
void LUGARES;
