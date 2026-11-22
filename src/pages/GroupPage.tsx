import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type Group } from '../data';
import { useStore } from '../store';
import { Av, AvStack, GroupPic, I, Sheet, Svg, TopBar, copyText, shareText } from '../components/ui';
import { playBuzz } from '../components/fx';
import GroupImageEditor from '../components/GroupImageEditor';
import NotesBoard from '../components/NotesBoard';
import { activePlan, doneThisPeriod, goalTxt, hasDonePlan, nextPlan, overdue, pointsOf, sinceLast } from '../lib/derive';
import { PLANES, inviteText, planTitle } from '../lib/logic/plan';
import { POINTS } from '../lib/logic/points';
import { cap, fmtDay, iso, today } from '../lib/logic/dates';
import RegalitoTab from './RegalitoTab';
import PuntoMedio from '../components/PuntoMedio';
import { monthName } from '../lib/mep';

export default function GroupPage({ onPropose }: { onPropose: (groupId: string) => void }) {
  const { id } = useParams();
  const st = useStore();
  const { plans, points, userId, profiles, nick, toast, reload } = st;
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<'plancitos' | 'regalito' | 'puntos' | 'ajustes'>(params.get('tab') === 'regalito' ? 'regalito' : 'plancitos');
  const g = st.group(id!);
  const inviting = params.get('invitar') === '1';

  useEffect(() => { if (g && params.get('proponer') === '1') { setParams({}); onPropose(g.id); } }, [g, params, setParams, onPropose]);
  if (!g) return <><TopBar title="Grupo" back="/grupos" /><div className="empty">No encontramos este grupo.</div></>;

  const invite = `${location.origin}/i/${g.inviteCode}`;
  const ap = activePlan(g, plans), np = nextPlan(g, plans), done = doneThisPeriod(g, plans), d = sinceLast(g, plans), late = overdue(g, plans);
  const gPlans = plans.filter((p) => p.groupId === g.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function buzz() {
    const key = 'plancito-buzz-' + g!.id, last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 15000) { toast('No podés mandar zumbidos con tanta frecuencia.'); return; }
    sessionStorage.setItem(key, String(Date.now()));
    const z = profiles[userId!].zumbido;
    playBuzz({ av: profiles[userId!].avatar, text: `Le mandaste un zumbido a <b>${g!.name}</b>`, style: z.style, msg: z.msg, sound: z.sound });
    try {
      await api.sendBuzz(g!.id, z.style, z.msg);
      const todayIso = iso(today());
      if (!points.some((x) => x.userId === userId && x.groupId === g!.id && x.kind === 'zumbido' && x.createdAt.slice(0, 10) === todayIso))
        await api.addPoints([{ userId: userId!, groupId: g!.id, kind: 'zumbido', pts: POINTS.zumbido[0] }]);
      reload();
    } catch (e) { toast('No se pudo mandar: ' + (e as Error).message); }
  }

  return <>
    <TopBar title={g.name} back="/grupos" right={<div className="row" style={{ gap: 6 }}>
      <button className="btn sm tomato" onClick={buzz}>{I.bolt} Zumbido</button>
      <button className="btn sm ghost" onClick={() => setParams({ invitar: '1' })}>Invitar</button></div>} />
    <div className="row" style={{ gap: 14 }}><button className="gpic-edit" onClick={() => setParams({ imagen: '1' })} aria-label="Cambiar la imagen del grupo"><GroupPic g={g} size={60} /><span className="gpic-pen">✎</span></button><div className="grow"><AvStack ids={g.members} size={34} />
      <p className="small muted" style={{ marginTop: 4 }}>{g.members.map(nick).join(', ')}</p></div></div>
    <div className="tabs" role="tablist">{((g.kind === 'amigos' ? ['plancitos', 'regalito', 'puntos', 'ajustes'] : ['plancitos', 'puntos', 'ajustes']) as ('plancitos' | 'regalito' | 'puntos' | 'ajustes')[]).map((k) =>
      <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{cap(k)}</button>)}</div>

    {tab === 'plancitos' && <>
      {g.members.length < 2 && <div className="sticker bg-peach"><h3>{g.kind === 'pareja' ? 'Falta que se sume tu pareja' : 'Todavía estás solo/a en el grupo'}</h3>
        <p className="small">Podés proponer un plancito igual: se vota cuando se sumen. Mandá la invitación:</p>
        <button className="btn" onClick={() => setParams({ invitar: '1' })}>Invitar</button></div>}
      <div className={`sticker ${late && !ap && !np ? 'bg-pink' : 'bg-lime'}`}>
        <span className="eyebrow" style={{ color: 'inherit' }}>Objetivo: {goalTxt(g)}</span>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow"><div className="hand">{!hasDonePlan(g, plans) ? 'Todavía no hicieron ningún plancito' : d === 0 ? 'Último plancito: hoy' : d === 1 ? 'Último plancito: ayer' : `Último plancito: hace ${d} días`}</div>
            <p className="small muted">{np ? 'Ya hay uno agendado.' : ap ? 'Hay uno en votación.' : !hasDonePlan(g, plans) ? '¿Arrancan con el primero?' : late ? 'Pasó bastante. Les vamos a ir recordando.' : 'Vienen bien.'}</p></div>
          <div style={{ textAlign: 'right' }}><div className="dots" style={{ justifyContent: 'flex-end' }}>{Array.from({ length: g.goal.n }, (_, i) => <i key={i} className={i < done ? 'on' : ''} />)}</div>
            <div className="small muted">{done}/{g.goal.n} este {g.goal.per}</div></div>
        </div>
        {!ap && <button className="btn full" onClick={() => onPropose(g.id)}>Proponer un plancito</button>}
      </div>
      {gPlans.length ? gPlans.map((p) => (
        <button key={p.id} className="card tight" style={{ textAlign: 'left' }} onClick={() => nav(`/p/${p.id}`)}>
          <div className="row between"><h3>{planTitle(p.answers, p.status === 'votando')}</h3>
            <span className={`chip ${p.status === 'votando' ? 'warn' : p.status === 'definido' ? 'ok' : ''}`}>{p.status === 'votando' ? 'En votación' : p.status === 'definido' ? 'Confirmado' : 'Realizado'}</span></div>
          <p className="small muted">{p.date ? cap(fmtDay(p.date, { weekday: 'long', day: 'numeric', month: 'long' })) : `Propuesto por ${nick(p.createdBy)}`}</p>
        </button>)) : <div className="empty">Todavía no hicieron ningún plancito.</div>}
      <NotesBoard g={g} />
      <section className="sec"><div className="sec-h"><h2>Punto de encuentro</h2><span className="small muted">a mitad de camino</span></div>
        <PuntoMedio people={g.members.map((m) => profiles[m]).filter(Boolean)} /></section>
    </>}
    {tab === 'regalito' && <RegalitoTab g={g} />}

    {tab === 'puntos' && <Ranking g={g} />}
    {tab === 'ajustes' && <Ajustes g={g} />}

    {params.get('imagen') === '1' && <Sheet onClose={() => setParams({})}><GroupImageEditor g={g} /><button className="btn full" onClick={() => setParams({})}>Listo</button></Sheet>}
    {inviting && <Sheet onClose={() => setParams({})}>
      <h2>Invitá al grupo</h2>
      <p className="muted small">{g.kind === 'pareja' ? 'Mandale esto a tu pareja.' : 'Mandá esto al grupo de WhatsApp.'} Quien lo abre se crea el perfil y queda adentro.</p>
      <div className="card tight" style={{ fontSize: 15 }}>{inviteText(g, invite)}</div>
      <div className="grid2"><button className="btn ghost" onClick={() => copyText(inviteText(g, invite), toast)}>{I.copy} Copiar</button>
        <button className="btn" onClick={() => shareText(inviteText(g, invite), toast)}>Compartir</button></div>
    </Sheet>}
  </>;

  function Ranking({ g }: { g: Group }) {
    const rows = g.members.map((m) => ({ m, pts: pointsOf(points, m, g.id) })).sort((a, b) => b.pts - a.pts);
    return <>
      <section className="sec"><h2>Ranking de estrellitas</h2>
        <p className="small muted" style={{ marginTop: -6 }}>Las estrellitas que sumó cada uno en este grupo: poner casa, cocinar, pagar a tiempo, arrancar planes. El primero lleva corona.</p>
        <div className="card"><div className="list">{rows.map((r, i) => <div key={r.m} className="li"><span className="hand num" style={{ width: 22 }}>{i + 1}</span>
          <Av p={profiles[r.m]} size={42} crown={i === 0 && r.pts > 0} /><p className="grow" style={{ fontWeight: 700 }}>{nick(r.m)}{r.m === userId ? ' (vos)' : ''}</p>
          <span className="pts"><i>★</i>{r.pts}</span></div>)}</div></div>
      </section>
      <section className="sec"><h2>Cómo se suman</h2><div className="card tight"><div className="list">
        {Object.entries(POINTS).map(([k, [n, l]]) => <div key={k} className="li"><span className="grow">{l}</span><b className="num">+{n}</b></div>)}</div></div></section>
    </>;
  }
}

function Ajustes({ g }: { g: Group }) {
  const { toast, reload, mep } = useStore();
  // Gustos: se marcan al instante y se guardan un momento después (sin esperar a recargar todo).
  const [likes, setLikes] = useState<string[]>(g.likes);
  const likeTimer = useRef<ReturnType<typeof setTimeout>>();
  const pendingLikes = useRef(false);
  useEffect(() => { if (!pendingLikes.current) setLikes(g.likes); }, [g.likes]);
  const toggleLike = (k: string) => {
    const next = likes.includes(k) ? likes.filter((x) => x !== k) : [...likes, k];
    setLikes(next); pendingLikes.current = true; clearTimeout(likeTimer.current);
    likeTimer.current = setTimeout(() => { api.updateGroup(g.id, { likes: next }).then(() => { pendingLikes.current = false; reload(); }).catch((e) => { pendingLikes.current = false; toast('No se pudo guardar: ' + (e as Error).message); }); }, 600);
  };
  const [spot, setSpot] = useState('');
  const [spotType, setSpotType] = useState<'resto' | 'delivery'>('resto');
  const save = async (patch: Parameters<typeof api.updateGroup>[1]) => {
    try { await api.updateGroup(g.id, patch); await reload(); } catch (e) { toast('No se pudo guardar: ' + (e as Error).message); }
  };
  return <>
    <div className="card"><GroupImageEditor g={g} /></div>
    <div className="card"><div className="field"><label htmlFor="gName">Nombre del grupo</label>
      <input id="gName" className="inp" maxLength={40} defaultValue={g.name} key={g.name}
        onBlur={(e) => { const v = e.target.value.trim(); if (!v) { e.target.value = g.name; toast('El grupo necesita un nombre'); return; } if (v !== g.name) save({ name: v }).then(() => toast('Nombre actualizado')); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} /></div></div>
    <div className="card"><h3>Objetivo de juntadas</h3>
      <div className="grid2">
        <select className="inp" aria-label="Cantidad" value={g.goal.n} onChange={(e) => save({ goal: { ...g.goal, n: Number(e.target.value) } })}>{[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => <option key={n}>{n}</option>)}</select>
        <select className="inp" aria-label="Por" value={g.goal.per} onChange={(e) => save({ goal: { ...g.goal, per: e.target.value as 'mes' } })}>{['semana', 'mes', 'año'].map((x) => <option key={x}>{x}</option>)}</select>
      </div></div>
    {g.kind === 'amigos' && <div className="card"><div className="row between"><div className="grow"><h3>Regalito</h3><p className="small muted">Avisos de cumple, vaquita y votación del regalo. El cumpleañero no ve nada.</p></div>
      <button className={`btn sm ${g.regalitoOn ? '' : 'ghost'}`} onClick={() => save({ regalitoOn: !g.regalitoOn })}>{g.regalitoOn ? 'Activado' : 'Apagado'}</button></div>
      {g.regalitoOn && <>
        <div className="seg" role="group" aria-label="Moneda del presupuesto">{([['ars', 'Pesos + inflación'], ['usd', 'Dólares']] as const).map(([k, l]) =>
          <button key={k} className={g.budgetMode === k ? 'on' : ''} onClick={() => save({ budgetMode: k })}>{l}</button>)}</div>
        <div className="grid2">
          <div className="field"><label htmlFor="bDef">Presupuesto por regalo (en pesos)</label><input id="bDef" className="inp num" inputMode="numeric" defaultValue={g.budgetDefault} onBlur={(e) => { const v = Number(e.target.value.replace(/[^\d]/g, '')); if (v && v !== g.budgetDefault) save({ budgetDefault: v }); }} /></div>
          <div className="field"><label htmlFor="uRate">Cotización de respaldo</label><input id="uRate" className="inp num" inputMode="numeric" defaultValue={g.usdRate} onBlur={(e) => { const v = Number(e.target.value.replace(/[^\d]/g, '')); if (v && v !== g.usdRate) save({ usdRate: v }); }} /></div>
        </div>
        <p className="small muted">{mep ? <>Dólar MEP promedio de {monthName(mep.month)}: <b>${mep.rate.toLocaleString('es-AR')}</b> ({mep.days} días, fuente ArgentinaDatos). Se actualiza solo; la de respaldo se usa solo si no se puede consultar.</>
          : 'No pudimos consultar el dólar MEP ahora: se usa la cotización de respaldo.'}</p></>}
    </div>}
    <div className="card"><h3>Planes que les gustan</h3><p className="small muted">Aparecen primero cuando votan qué hacer.</p>
      <div className="row wrap" style={{ gap: 7 }}>{Object.entries(PLANES).map(([k, v]) => { const on = likes.includes(k);
        return <button key={k} className={on ? 'vchip on' : 'vchip'} onClick={() => toggleLike(k)}>{on ? '✓ ' : ''}{v.l}</button>; })}</div></div>
    <div className="card"><h3>Lugares de siempre</h3><p className="small muted">El bar donde siempre terminan o el delivery de confianza. Aparecen como opción al votar.</p>
      {g.spots.length > 0 && <div className="list">{g.spots.map((s, i) => <div key={i} className="li"><span className="grow"><b>{s.name}</b> <span className="small muted">· {s.type === 'delivery' ? 'Delivery' : 'Resto / bar'}</span></span>
        <button className="link small" onClick={() => save({ spots: g.spots.filter((_, j) => j !== i) })}>Quitar</button></div>)}</div>}
      <div className="row"><input className="inp" value={spot} onChange={(e) => setSpot(e.target.value)} placeholder="Ej: Alberdi" />
        <select className="inp" style={{ width: 'auto', minWidth: 118 }} value={spotType} onChange={(e) => setSpotType(e.target.value as 'resto')}><option value="resto">Resto / bar</option><option value="delivery">Delivery</option></select>
        <button className="btn soft" onClick={() => { if (!spot.trim()) return; save({ spots: [...g.spots, { name: spot.trim(), type: spotType }] }); setSpot(''); }}>Sumar</button></div></div>
  </>;
}
