import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../data';
import { useStore } from '../store';
import { Av, GroupPic, TopBar } from '../components/ui';
import { fmtDay, iso, money, today } from '../lib/logic/dates';
import { daysToBirthday, nextBirthday, shareOf } from '../lib/logic/regalito';
import { wishTitle } from '../lib/wish';

/** Todos los regalitos juntos: los que se están organizando, los cumples que vienen y tu propio cumple. */
export default function Regalitos() {
  const { groups, regalitos, profiles, me, userId, nick, toast, reload } = useStore();
  const nav = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  if (!me || !userId) return null;
  const t = today();
  const friends = groups.filter((g) => g.kind === 'amigos');
  const on = friends.filter((g) => g.regalitoOn), off = friends.filter((g) => !g.regalitoOn);
  const active = regalitos.filter((r) => r.status !== 'entregado' && on.some((g) => g.id === r.groupId))
    .sort((a, b) => daysToBirthday(profiles[a.bdayUser]?.birthday || '2000-12-31', t) - daysToBirthday(profiles[b.bdayUser]?.birthday || '2000-12-31', t));
  const history = regalitos.filter((r) => r.status === 'entregado').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Próximos cumples de la gente de mis grupos con regalito (sin repetir personas).
  const seen = new Set<string>();
  const upcoming = on.flatMap((g) => g.members.filter((m) => m !== userId && profiles[m]?.birthday).map((m) => ({ g, m, d: daysToBirthday(profiles[m].birthday!, t) })))
    .sort((a, b) => a.d - b.d).filter(({ g, m }) => { const k = g.id + m; if (seen.has(k)) return false; seen.add(k); return true; });
  const noBday = [...new Set(on.flatMap((g) => g.members.filter((m) => m !== userId && !profiles[m]?.birthday)))];
  const hasActive = (gid: string, m: string) => regalitos.some((r) => r.groupId === gid && r.bdayUser === m && r.status !== 'entregado');

  async function start(gid: string, m: string, d: number) {
    const g = groups.find((x) => x.id === gid)!;
    setBusy(gid + m);
    try {
      await api.createRegalito(gid, m, new Date(t.getTime() + d * 864e5).getFullYear(), { amount: g.budgetMode === 'usd' ? Math.round(g.budgetDefault / g.usdRate) : g.budgetDefault, mode: g.budgetMode });
      await reload(); toast(`Arrancó el regalito de ${nick(m)}. ${nick(m)} no ve nada.`); nav(`/g/${gid}?tab=regalito`);
    } catch (e) { toast('No se pudo: ' + (e as Error).message); }
    finally { setBusy(null); }
  }
  const myDays = me.birthday ? daysToBirthday(me.birthday, t) : null;

  return <>
    <TopBar title="Regalitos" />
    <p className="small muted" style={{ marginTop: -12 }}>Organizá los regalos de cumple sin el grupo paralelo de WhatsApp: el cumpleañero no ve nada.</p>

    {!friends.length && <div className="empty">El regalito es para grupos de amigos. Creá uno y prendelo acá.</div>}

    {active.length > 0 && <section className="sec"><h2>Se están organizando</h2>
      {active.map((r) => { const g = groups.find((x) => x.id === r.groupId)!, bp = profiles[r.bdayUser], d = bp?.birthday ? daysToBirthday(bp.birthday, t) : 0;
        const el = g.members.filter((m) => m !== r.bdayUser), owe = r.status === 'comprado' && r.owner && r.owner !== userId && !r.payments.includes(userId);
        const status = owe ? `Le debés ${money(shareOf(r.cost || 0, el.length))} a ${nick(r.owner!)}` : ({ votando: r.ideas.length ? `${r.ideas.length} ideas para votar` : 'Faltan ideas de regalo', aprobado: r.owner ? `${nick(r.owner)} lo tiene que comprar` : 'Falta quien lo compre', comprado: 'Comprado, juntando la plata', entregado: 'Entregado' } as Record<string, string>)[r.status];
        return <button key={r.id} className={`sticker ${owe ? 'bg-pink' : 'bg-sky'}`} style={{ textAlign: 'left', border: 0 }} onClick={() => nav(`/g/${g.id}?tab=regalito`)}>
          <div className="row"><Av p={bp} size={48} /><div className="grow"><h3>Cumple de {nick(r.bdayUser)}</h3><p className="small muted">{g.name} · {status}</p></div>
            <div style={{ textAlign: 'right' }}><div className="hand num" style={{ fontSize: 30 }}>{d}</div><div className="small muted">días</div></div></div></button>; })}
    </section>}

    {on.length > 0 && <section className="sec"><h2>Próximos cumples</h2>
      {upcoming.length ? <div className="card tight"><div className="list">{upcoming.map(({ g, m, d }) => <div key={g.id + m} className="li"><Av p={profiles[m]} size={36} />
        <div className="grow"><p style={{ fontWeight: 700 }}>{nick(m)}</p><p className="small muted">{fmtDay(iso(nextBirthday(profiles[m].birthday!, t)), { day: 'numeric', month: 'long' })} · {g.name} · {d === 0 ? '¡hoy!' : `en ${d} días`}</p></div>
        {hasActive(g.id, m) ? <button className="link small" onClick={() => nav(`/g/${g.id}?tab=regalito`)}>Ver</button>
          : <button className="btn sm soft" disabled={busy === g.id + m} onClick={() => start(g.id, m, d)}>Arrancar</button>}</div>)}</div>
        <p className="small muted">El regalito se arranca solo cuando falta un mes. Con "Arrancar" lo empezás antes.</p></div>
        : <div className="empty">Todavía nadie de tus grupos cargó su cumple.</div>}
      {noBday.length > 0 && <p className="small muted">Falta que carguen su cumple: {noBday.map(nick).join(', ')}.</p>}
    </section>}

    {off.length > 0 && <section className="sec"><h2>Grupos sin regalito</h2>
      <div className="card tight"><div className="list">{off.map((g) => <div key={g.id} className="li"><GroupPic g={g} size={36} /><span className="grow" style={{ fontWeight: 700 }}>{g.name}</span>
        <button className="btn sm" onClick={() => api.updateGroup(g.id, { regalitoOn: true }).then(async () => { await reload(); toast(`Regalito activado en ${g.name}`); }).catch((e) => toast('No se pudo: ' + (e as Error).message))}>Activar</button></div>)}</div>
        <p className="small muted">Activalo en los grupos donde se hacen regalos de cumple.</p></div>
    </section>}

    <section className="sec"><h2>Tu cumple</h2>
      <div className="sticker bg-lilac">
        {myDays === null ? <><h3>Cargá tu cumple</h3><p className="small">Así tus grupos pueden organizarte el regalito (y vos no ves nada).</p>
          <button className="btn" onClick={() => nav('/perfil#pfBday')}>Cargar mi cumple</button></>
        : <><h3>{myDays === 0 ? '¡Hoy es tu cumple!' : `Faltan ${myDays} días`}</h3>
          <p className="small">{me.wishlist.length ? `Tu lista tiene ${me.wishlist.length} ${me.wishlist.length === 1 ? 'cosa' : 'cosas'}: ${me.wishlist.slice(0, 3).map(wishTitle).join(', ')}${me.wishlist.length > 3 ? '…' : ''}` : me.askContact?.name ? `Si tienen dudas, le preguntan a ${me.askContact.name}.` : 'Todavía no armaste tu lista de deseos.'}</p>
          <button className="btn" onClick={() => nav('/perfil#deseos')}>{me.wishlist.length ? 'Editar mi lista' : 'Armar mi lista'}</button></>}
      </div>
    </section>

    {history.length > 0 && <section className="sec"><h2>Lo que se regaló</h2>
      <div className="card tight"><div className="list">{history.map((r) => { const idea = r.ideas.find((i) => i.id === r.chosenIdea), g = groups.find((x) => x.id === r.groupId);
        return <div key={r.id} className="li"><Av p={profiles[r.bdayUser]} size={34} /><div className="grow"><p style={{ fontWeight: 700 }}>{idea?.title || 'Regalo'}</p>
          <p className="small muted">Para {nick(r.bdayUser)} · {r.year} · {g?.name}</p></div><span className="num small" style={{ fontWeight: 700 }}>{money(r.cost || 0)}</span></div>; })}</div></div>
    </section>}
  </>;
}
