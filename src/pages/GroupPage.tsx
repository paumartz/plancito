import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type Group } from '../data';
import { useStore } from '../store';
import { Av, AvStack, GroupPic, I, Sheet, Svg, TopBar, copyText, shareText } from '../components/ui';
import { playBuzz } from '../components/fx';
import { GROUP_COLORS, GROUP_ICONS, lineIconSvg } from '../components/groupIcon';
import { activePlan, doneThisPeriod, goalTxt, nextPlan, overdue, pointsOf, sinceLast } from '../lib/derive';
import { PLANES, planTitle } from '../lib/logic/plan';
import { POINTS } from '../lib/logic/points';
import { cap, fmtDay, iso, today } from '../lib/logic/dates';
import RegalitoTab from './RegalitoTab';
import PuntoMedio from '../components/PuntoMedio';

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
    <div className="row" style={{ gap: 14 }}><GroupPic g={g} size={60} /><div className="grow"><AvStack ids={g.members} size={34} />
      <p className="small muted" style={{ marginTop: 4 }}>{g.members.map(nick).join(', ')}</p></div></div>
    <div className="tabs" role="tablist">{((g.kind === 'amigos' ? ['plancitos', 'regalito', 'puntos', 'ajustes'] : ['plancitos', 'puntos', 'ajustes']) as ('plancitos' | 'regalito' | 'puntos' | 'ajustes')[]).map((k) =>
      <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{cap(k)}</button>)}</div>

    {tab === 'plancitos' && <>
      <div className={`sticker ${late && !ap && !np ? 'bg-pink' : 'bg-lime'}`}>
        <span className="eyebrow" style={{ color: 'inherit' }}>Objetivo: {goalTxt(g)}</span>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow"><div className="hand">Último plancito: hace {d} días</div>
            <p className="small muted">{np ? 'Ya hay uno agendado.' : ap ? 'Hay uno en votación.' : late ? 'Pasó bastante. Les vamos a ir recordando.' : 'Vienen bien.'}</p></div>
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
      <section className="sec"><div className="sec-h"><h2>Punto de encuentro</h2><span className="small muted">a mitad de camino</span></div>
        <PuntoMedio people={g.members.map((m) => profiles[m]).filter(Boolean)} /></section>
    </>}
    {tab === 'regalito' && <RegalitoTab g={g} />}

    {tab === 'puntos' && <Ranking g={g} />}
    {tab === 'ajustes' && <Ajustes g={g} />}

    {inviting && <Sheet onClose={() => setParams({})}>
      <h2>Invitá al grupo</h2>
      <p className="muted small">Pegá este link en el grupo de WhatsApp. Quien lo abre se crea el perfil y queda adentro.</p>
      <div className="alias"><span>{invite}</span><button className="btn sm" onClick={() => copyText(invite, toast)}>{I.copy} Copiar</button></div>
      <button className="btn full" onClick={() => shareText(`Sumate a ${g.name} en Plancito: ${invite}`, toast)}>Compartir</button>
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
  const { toast, reload } = useStore();
  const [spot, setSpot] = useState('');
  const [spotType, setSpotType] = useState<'resto' | 'delivery'>('resto');
  const save = async (patch: Parameters<typeof api.updateGroup>[1]) => {
    try { await api.updateGroup(g.id, patch); await reload(); } catch (e) { toast('No se pudo guardar: ' + (e as Error).message); }
  };
  function onPhoto(f?: File) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => {
      const k = Math.min(1, 320 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      save({ photoUrl: c.toDataURL('image/jpeg', 0.82) }).then(() => toast('Foto del grupo actualizada'));
    }; im.src = rd.result as string; };
    rd.readAsDataURL(f);
  }
  return <>
    <div className="card"><div className="row"><div className="grow"><h3>Foto o ícono</h3><p className="small muted">Si no hay foto, se usa el ícono.</p></div><GroupPic g={g} size={56} /></div>
      <div className="row wrap"><label className="btn sm" style={{ cursor: 'pointer' }}>{g.photoUrl ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
        {g.photoUrl && <button className="btn sm ghost" onClick={() => save({ photoUrl: null })}>Quitar foto</button>}</div>
      <div className="icopick">{Object.keys(GROUP_ICONS).map((k) => <button key={k} className={g.icon.icon === k ? 'on' : ''} aria-label={k} onClick={() => save({ icon: { ...g.icon, icon: k } })}><Svg html={lineIconSvg(k, 30)} /></button>)}</div>
      <div className="swatches">{Object.entries(GROUP_COLORS).map(([k, c]) => <button key={k} aria-label={k} className={g.icon.color === k ? 'on' : ''} style={{ background: c }} onClick={() => save({ icon: { ...g.icon, color: k } })} />)}</div>
    </div>
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
          <div className="field"><label htmlFor="uRate">Cotización del dólar del grupo</label><input id="uRate" className="inp num" inputMode="numeric" defaultValue={g.usdRate} onBlur={(e) => { const v = Number(e.target.value.replace(/[^\d]/g, '')); if (v && v !== g.usdRate) save({ usdRate: v }); }} /></div>
        </div></>}
    </div>}
    <div className="card"><h3>Planes que les gustan</h3><p className="small muted">Aparecen primero cuando votan qué hacer.</p>
      <div className="row wrap" style={{ gap: 7 }}>{Object.entries(PLANES).map(([k, v]) => { const on = g.likes.includes(k);
        return <button key={k} className={on ? 'vchip on' : 'vchip'} onClick={() => save({ likes: on ? g.likes.filter((x) => x !== k) : [...g.likes, k] })}>{on ? '✓ ' : ''}{v.l}</button>; })}</div></div>
    <div className="card"><h3>Lugares de siempre</h3><p className="small muted">El bar donde siempre terminan o el delivery de confianza. Aparecen como opción al votar.</p>
      {g.spots.length > 0 && <div className="list">{g.spots.map((s, i) => <div key={i} className="li"><span className="grow"><b>{s.name}</b> <span className="small muted">· {s.type === 'delivery' ? 'Delivery' : 'Resto / bar'}</span></span>
        <button className="link small" onClick={() => save({ spots: g.spots.filter((_, j) => j !== i) })}>Quitar</button></div>)}</div>}
      <div className="row"><input className="inp" value={spot} onChange={(e) => setSpot(e.target.value)} placeholder="Ej: Alberdi" />
        <select className="inp" style={{ width: 'auto', minWidth: 118 }} value={spotType} onChange={(e) => setSpotType(e.target.value as 'resto')}><option value="resto">Resto / bar</option><option value="delivery">Delivery</option></select>
        <button className="btn soft" onClick={() => { if (!spot.trim()) return; save({ spots: [...g.spots, { name: spot.trim(), type: spotType }] }); setSpot(''); }}>Sumar</button></div></div>
  </>;
}
