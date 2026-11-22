import { useState } from 'react';
import { api, type Group, type Regalito } from '../data';
import { useStore } from '../store';
import { Av, AvStack, I, Sheet, copyText } from '../components/ui';
import { starBurst } from '../components/fx';
import { cap, fmtDay, iso, money, today } from '../lib/logic/dates';
import { adjustForInflation, budgetARS, daysToBirthday, fetchInflationSince, fmtBudget, majority, nextBirthday, shareOf } from '../lib/logic/regalito';
import { POINTS } from '../lib/logic/points';
import { monthName } from '../lib/mep';
import { wishTitle, wishUrl } from '../lib/wish';

export default function RegalitoTab({ g }: { g: Group }) {
  const st = useStore();
  const { userId, profiles, regalitos, nick, toast, reload } = st;
  const me = userId!;
  const save = async (fn: () => Promise<unknown>, ok?: string) => { try { await fn(); await reload(); if (ok) toast(ok); } catch (e) { toast('No se pudo: ' + (e as Error).message); } };

  if (!g.regalitoOn) return (
    <div className="sticker bg-sky"><h3>Regalito está apagado</h3>
      <p className="small muted">Si en este grupo se hacen regalos de cumple, prendelo: avisa cuando se acerca uno, saca al cumpleañero de la organización y ordena la vaquita. Cada uno carga su cumple en el perfil.</p>
      <button className="btn" onClick={() => save(() => api.updateGroup(g.id, { regalitoOn: true }), 'Regalito activado')}>Activar regalito</button></div>
  );

  const t = today();
  const active = regalitos.filter((r) => r.groupId === g.id && r.status !== 'entregado').sort((a, b) => daysToBirthday(profiles[a.bdayUser]?.birthday || '2000-01-01', t) - daysToBirthday(profiles[b.bdayUser]?.birthday || '2000-01-01', t));
  const history = regalitos.filter((r) => r.groupId === g.id && r.status === 'entregado').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const upcoming = g.members.filter((m) => profiles[m]?.birthday).map((m) => ({ m, d: daysToBirthday(profiles[m].birthday!, t) })).sort((a, b) => a.d - b.d);
  const myBday = profiles[me]?.birthday ? daysToBirthday(profiles[me].birthday!, t) : null;
  const noBday = g.members.filter((m) => !profiles[m]?.birthday);

  return <>
    {myBday !== null && myBday <= 30 && <div className="sticker bg-lilac"><h3>Shhh</h3><p className="small">Si se está organizando algo para tu cumple, no lo vas a ver acá hasta que pase.</p></div>}
    {active.length ? active.map((r) => <OneRegalito key={r.id} g={g} r={r} save={save} />)
      : <div className="empty">No hay ningún cumple en los próximos 30 días. Cuando se acerque uno, el regalito se arma solo.</div>}

    <section className="sec"><h2>Próximos cumples</h2>
      <div className="card tight"><div className="list">{upcoming.map(({ m, d }) => <div key={m} className="li"><Av p={profiles[m]} size={34} />
        <div className="grow"><p style={{ fontWeight: 700 }}>{nick(m)}{m === me ? ' (vos)' : ''}</p><p className="small muted">{fmtDay(iso(nextBirthday(profiles[m].birthday!, t)), { day: 'numeric', month: 'long' })}</p></div>
        <span className="num small muted">{d === 0 ? '¡hoy!' : `en ${d} días`}</span></div>)}</div>
        {noBday.length > 0 && <p className="small muted">Falta que carguen su cumple: {noBday.map(nick).join(', ')}.</p>}</div>
    </section>

    {history.length > 0 && <section className="sec"><h2>Historial del grupo</h2>
      <div className="card tight"><div className="list">{history.map((r) => { const idea = r.ideas.find((i) => i.id === r.chosenIdea);
        return <div key={r.id} className="li"><Av p={profiles[r.bdayUser]} size={34} /><div className="grow"><p style={{ fontWeight: 700 }}>{idea?.title || 'Regalo'}</p>
          <p className="small muted">Para {nick(r.bdayUser)} · {r.year}{r.owner ? ` · compró ${nick(r.owner)}` : ''}</p></div><span className="num small" style={{ fontWeight: 700 }}>{money(r.cost || 0)}</span></div>; })}</div>
        <p className="small muted">Gastado en regalitos este año: <b className="num">{money(history.filter((r) => r.year === t.getFullYear()).reduce((s, r) => s + (r.cost || 0), 0))}</b></p></div>
    </section>}
  </>;
}

function OneRegalito({ g, r, save }: { g: Group; r: Regalito; save: (fn: () => Promise<unknown>, ok?: string) => Promise<void> }) {
  const { userId, profiles, nick, toast, mep, usdRate } = useStore();
  const me = userId!;
  const rate = usdRate(g);
  const bp = profiles[r.bdayUser];
  const el = g.members.filter((m) => m !== r.bdayUser), need = majority(el.length);
  const days = bp?.birthday ? daysToBirthday(bp.birthday, today()) : 0;
  const bA = budgetARS(r.budget.amount, r.budget.mode, rate);
  const chosen = r.ideas.find((i) => i.id === r.chosenIdea);
  const share = shareOf(r.cost || 0, el.length);
  const [sheet, setSheet] = useState<null | { kind: 'idea'; title?: string } | { kind: 'buy' } | { kind: 'infl'; pct: string }>(null);
  const c = bp?.askContact || {};
  const myBudgetVote = r.budgetVotes.find((v) => v.userId === me);
  const yes = r.budgetVotes.filter((v) => v.yes).length, no = r.budgetVotes.filter((v) => !v.yes).length;

  async function voteBudget(v: boolean) {
    await save(async () => {
      await api.voteBudget(r.id, v);
      const y = yes + (v ? 1 : 0), n = no + (v ? 0 : 1);
      if (y >= need) { await api.updateRegalito(r.id, { budget_amount: r.proposal!.amount, budget_since: iso(today()), proposal_amount: null, proposal_pct: null }); await api.resetBudgetVotes(r.id); toast('Presupuesto actualizado por mayoría'); }
      else if (n >= need) { await api.updateRegalito(r.id, { proposal_amount: null, proposal_pct: null }); await api.resetBudgetVotes(r.id); toast('Se queda el presupuesto anterior'); }
    });
  }
  async function suggestInflation() {
    const pct = await fetchInflationSince(r.budget.since);
    if (pct === null) { setSheet({ kind: 'infl', pct: '' }); return; }
    if (pct < 1) { toast('Casi no hubo inflación desde que se definió el presupuesto'); return; }
    await save(async () => { await api.resetBudgetVotes(r.id); await api.updateRegalito(r.id, { proposal_amount: adjustForInflation(r.budget.amount, pct), proposal_pct: pct }); await api.voteBudget(r.id, true); }, 'Propuesta enviada al grupo');
  }
  async function voteIdea(id: string, on: boolean) {
    await save(async () => {
      await api.voteIdea(id, on);
      const idea = r.ideas.find((i) => i.id === id)!, n = idea.votes.filter((v) => v !== me).length + (on ? 1 : 0);
      if (n >= need && r.status === 'votando') { await api.updateRegalito(r.id, { status: 'aprobado', chosen_idea: id }); toast(`Aprobado por mayoría: ${idea.title}`); }
    });
  }

  return <>
    <div className="sticker bg-pink">
      <div className="row"><Av p={bp} size={54} /><div className="grow"><span className="eyebrow" style={{ color: 'inherit' }}>Regalito</span><h2>Cumple de {nick(r.bdayUser)}</h2>
        <p className="small muted">{bp?.birthday ? cap(fmtDay(iso(nextBirthday(bp.birthday, today())), { weekday: 'long', day: 'numeric', month: 'long' })) : ''}</p></div>
        <div style={{ textAlign: 'right' }}><div className="hand num" style={{ fontSize: 40 }}>{days}</div><div className="small muted">días</div></div></div>
      <p className="small" style={{ fontWeight: 700 }}>{nick(r.bdayUser)} no ve nada de esto. Cuando sea tu cumple, a vos tampoco te aparece.</p>
    </div>

    <div className="card tight"><div className="row"><Av p={r.owner ? profiles[r.owner] : undefined} size={38} /><div className="grow"><span className="eyebrow">Se encarga de comprarlo</span><h3>{r.owner ? nick(r.owner) + (r.owner === me ? ' (vos)' : '') : 'Nadie todavía'}</h3></div>
      {r.owner !== me && r.status !== 'entregado' && r.status !== 'comprado' && <button className="btn sm ghost" onClick={() => save(() => api.updateRegalito(r.id, { owner: me }), 'Ahora te encargás vos')}>Me encargo yo</button>}</div></div>

    <section className="sec"><div className="sec-h"><h2>Presupuesto</h2><span className="muted small num">por persona ≈ {fmtBudget(r.budget.amount / el.length, r.budget.mode)}</span></div>
      <div className="card tight">
        <div className="hand num" style={{ fontSize: 32 }}>{fmtBudget(r.budget.amount, r.budget.mode)}</div>
        <p className="small muted">{r.budget.mode === 'usd' ? `≈ ${money(bA)} al dólar ${mep ? `MEP promedio de ${monthName(mep.month)} ($${rate.toLocaleString('es-AR')})` : `de respaldo del grupo ($${rate.toLocaleString('es-AR')}), porque no pudimos consultar el MEP`}.` : `Definido en ${fmtDay(r.budget.since, { month: 'long', year: 'numeric' })}. Se puede ajustar por inflación (IPC del INDEC).`}</p>
        {r.proposal ? <div className="sticker bg-sky"><p><b>{r.proposal.pct ? `Inflación acumulada: ${r.proposal.pct}%.` : ''}</b> ¿Lo actualizamos a <b className="num">{fmtBudget(r.proposal.amount, r.budget.mode)}</b>?</p>
          <p className="small muted">Hacen falta {need} de {el.length}. A favor {yes} · en contra {no}</p>
          {myBudgetVote ? <p className="small" style={{ fontWeight: 700 }}>Ya votaste {myBudgetVote.yes ? 'a favor' : 'en contra'}.</p>
            : <div className="grid2"><button className="btn" onClick={() => voteBudget(true)}>A favor</button><button className="btn ghost" onClick={() => voteBudget(false)}>En contra</button></div>}</div>
          : r.budget.mode === 'ars' && r.status === 'votando' && <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={suggestInflation}>Proponer ajuste por inflación</button>}
      </div>
    </section>

    <section className="sec"><h2>¿Qué le gustaría a {nick(r.bdayUser)}?</h2>
      {(bp?.wishlist || []).length > 0 && <div className="card tight"><span className="eyebrow">Su lista de deseos</span><div className="list">{bp!.wishlist.map((w) => <div key={w} className="li"><span className="grow">{wishTitle(w)}{wishUrl(w) && <> · <a className="link small" href={wishUrl(w)!} target="_blank" rel="noopener">Ver</a></>}</span>
        {r.status === 'votando' && <button className="link small" onClick={() => setSheet({ kind: 'idea', title: wishTitle(w) })}>Proponer</button>}</div>)}</div></div>}
      {c.name && <div className="sticker bg-lilac"><span className="eyebrow" style={{ color: 'inherit' }}>{(bp?.wishlist || []).length ? 'Si tienen dudas, pregúntenle a' : `${nick(r.bdayUser)} no dejó lista. Pregúntenle a`}</span>
        <div><h3 style={{ fontSize: 20 }}>{c.name}</h3><p className="small muted">{c.rel || 'Alguien de confianza'} · sabe qué le gustaría</p></div>
        {c.via === 'ig' && c.ig && <><div className="alias"><span>@{c.ig}</span><button className="btn sm" onClick={() => copyText('@' + c.ig, toast)}>{I.copy} Copiar</button></div>
          <a className="btn" href={`https://instagram.com/${encodeURIComponent(c.ig)}`} target="_blank" rel="noopener">Escribirle por Instagram</a></>}
        {c.via !== 'ig' && c.phone && <><div className="alias"><span>{c.phone}</span><button className="btn sm" onClick={() => copyText(c.phone!, toast)}>{I.copy} Copiar</button></div>
          <a className="btn" href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener">Escribirle por WhatsApp</a></>}</div>}
      {!(bp?.wishlist || []).length && !c.name && <div className="empty">{nick(r.bdayUser)} no dejó lista ni contacto. Propongan ideas abajo.</div>}
    </section>

    {r.status === 'votando' && <section className="sec"><div className="sec-h"><h2>Propuestas</h2><button className="link" onClick={() => setSheet({ kind: 'idea' })}>+ Proponer</button></div>
      <p className="small muted" style={{ marginTop: -6 }}>Se aprueba con {need} de {el.length} votos. Podés votar más de una.</p>
      {r.ideas.length ? r.ideas.map((x) => { const pct = Math.min(100, (x.price / bA) * 100), over = x.price > bA, mine = x.votes.includes(me);
        return <div key={x.id} className="card tight"><div className="row between"><div className="grow"><h3>{x.title}</h3><p className="small muted">Propuso {nick(x.by)}</p></div><span className="num" style={{ fontWeight: 700 }}>{money(x.price)}</span></div>
          <div className={`meter ${over ? 'over' : ''}`}><span style={{ width: `${pct}%` }} /></div>
          <div className="row between"><span className="small" style={over ? { color: 'var(--bad)', fontWeight: 700 } : { color: 'var(--ink-2)' }}>{over ? `Se pasa por ${money(x.price - bA)}` : `Queda ${money(bA - x.price)} del presupuesto`}</span>
            <div className="row">{x.votes.length > 0 && <AvStack ids={x.votes} size={22} />}<span className="small num muted">{x.votes.length}/{need}</span>
              <button className={`btn sm ${mine ? '' : 'soft'}`} onClick={() => voteIdea(x.id, !mine)}>{mine ? 'Votado' : 'Votar'}</button></div></div></div>; })
        : <div className="empty">Todavía nadie propuso nada.</div>}
    </section>}

    {r.status === 'aprobado' && chosen && <div className="sticker bg-lime"><span className="eyebrow" style={{ color: 'inherit' }}>Aprobado por mayoría</span><h3 style={{ fontSize: 20 }}>{chosen.title}</h3><p className="small muted">{money(chosen.price)} estimado</p>
      {r.owner === me ? <button className="btn" onClick={() => setSheet({ kind: 'buy' })}>Ya lo compré</button>
        : r.owner ? <p className="small">{nick(r.owner)} lo tiene que comprar.</p> : <button className="btn" onClick={() => save(() => api.updateRegalito(r.id, { owner: me }), 'Ahora te encargás vos')}>Me encargo de comprarlo</button>}</div>}

    {r.status === 'comprado' && chosen && <section className="sec"><div className="sec-h"><h2>La vaquita</h2><span className="muted small num">{money(r.cost || 0)} ÷ {el.length} = {money(share)}</span></div>
      <div className="sticker bg-lime"><h3>{chosen.title}</h3><p className="small muted">Lo compró {r.owner ? nick(r.owner) : ''}.</p>
        {r.owner === me && <button className="btn" onClick={() => save(async () => {
          await api.updateRegalito(r.id, { status: 'entregado' });
          await api.addPoints([{ userId: me, groupId: g.id, kind: 'regalo', pts: POINTS.regalo[0] }]); starBurst(POINTS.regalo[0], POINTS.regalo[1]);
        }, '¡Regalo entregado! Quedó en el historial')}>Ya se lo dimos</button>}</div>
      {r.owner !== me && !r.payments.includes(me) && r.owner && <div className="sticker bg-pink"><h3>Le debés <span className="num">{money(share)}</span> a {nick(r.owner)}</h3>
        {profiles[r.owner]?.alias ? <div className="alias"><span>{profiles[r.owner].alias}</span><button className="btn sm" onClick={() => copyText(profiles[r.owner!].alias, toast)}>{I.copy} Copiar alias</button></div> : <p className="small">{nick(r.owner)} todavía no cargó su alias.</p>}
        <button className="btn sm" onClick={() => save(async () => { await api.markRegalitoPaid(r.id, me); await api.addPoints([{ userId: me, groupId: g.id, kind: 'pago', pts: POINTS.pago[0] }]); }, 'Pagado. Todos ven que ya pusiste')}>Ya le pagué</button></div>}
      <div className="card tight"><span className="eyebrow">Quiénes pagaron (lo ve todo el grupo)</span><div className="list">{el.map((u) => { const ok = u === r.owner || r.payments.includes(u);
        return <div key={u} className="li"><Av p={profiles[u]} size={30} /><span className="grow" style={{ fontWeight: 700 }}>{nick(u)}{u === r.owner ? ' · compró' : ''}</span>
          {ok ? <span className="chip ok">Pagó</span> : <><span className="chip warn">Debe {money(share)}</span>{r.owner === me && <button className="link small" onClick={() => save(() => api.markRegalitoPaid(r.id, u), `Marcado: ${nick(u)} pagó`)}>Me pagó</button>}</>}</div>; })}</div></div>
    </section>}

    {sheet?.kind === 'idea' && <IdeaSheet title={sheet.title} onClose={() => setSheet(null)} onSave={(t, p) => save(() => api.addIdea(r.id, t, p)).then(() => setSheet(null))} />}
    {sheet?.kind === 'buy' && <BuySheet initial={chosen?.price || 0} n={el.length} onClose={() => setSheet(null)}
      onSave={(cost) => save(async () => { await api.updateRegalito(r.id, { status: 'comprado', cost }); }, 'Le avisamos a todos cuánto les toca').then(() => setSheet(null))} />}
    {sheet?.kind === 'infl' && <InflSheet onClose={() => setSheet(null)} onSave={(pct) => save(async () => { await api.resetBudgetVotes(r.id); await api.updateRegalito(r.id, { proposal_amount: adjustForInflation(r.budget.amount, pct), proposal_pct: pct }); await api.voteBudget(r.id, true); }, 'Propuesta enviada al grupo').then(() => setSheet(null))} />}
  </>;
}

function IdeaSheet({ title, onClose, onSave }: { title?: string; onClose: () => void; onSave: (t: string, p: number) => void }) {
  const [t, setT] = useState(title || ''), [p, setP] = useState('');
  return <Sheet onClose={onClose}><h2>Proponer regalo</h2>
    <div className="field"><label htmlFor="gfT">¿Qué le regalamos?</label><input id="gfT" className="inp" value={t} onChange={(e) => setT(e.target.value)} /></div>
    <div className="field"><label htmlFor="gfP">Precio estimado</label><input id="gfP" className="inp num" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} placeholder="$" /></div>
    <button className="btn full" onClick={() => { const n = Number(p.replace(/[^\d]/g, '')); if (!t.trim() || !n) return; onSave(t.trim(), n); }}>Proponer</button></Sheet>;
}
function BuySheet({ initial, n, onClose, onSave }: { initial: number; n: number; onClose: () => void; onSave: (c: number) => void }) {
  const [c, setC] = useState(String(initial));
  return <Sheet onClose={onClose}><h2>¿Cuánto salió?</h2><p className="muted small">Se divide entre {n} y a cada uno le aparece tu alias para pagarte.</p>
    <div className="field"><label htmlFor="byC">Precio final</label><input id="byC" className="inp num" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} /></div>
    <button className="btn full" onClick={() => { const v = Number(c.replace(/[^\d]/g, '')); if (v) onSave(v); }}>Avisar que lo compré</button></Sheet>;
}
function InflSheet({ onClose, onSave }: { onClose: () => void; onSave: (pct: number) => void }) {
  const [p, setP] = useState('');
  return <Sheet onClose={onClose}><h2>Ajuste por inflación</h2><p className="muted small">No pudimos traer el dato del INDEC ahora. Poné el porcentaje acumulado desde que se definió el presupuesto.</p>
    <div className="field"><label htmlFor="infP">Inflación acumulada (%)</label><input id="infP" className="inp num" inputMode="decimal" value={p} onChange={(e) => setP(e.target.value)} placeholder="Ej: 15" /></div>
    <button className="btn full" onClick={() => { const v = Number(p.replace(',', '.')); if (v > 0) onSave(v); }}>Proponer al grupo</button></Sheet>;
}
