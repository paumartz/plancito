import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Av, AvStack, GroupPic, I, Sheet } from '../components/ui';
import { playBuzz } from '../components/fx';
import { activePlan, attendees, effDone, goalTxt, lastLabel, nextPlan, notifications, overdue, pointsOf, type Notif } from '../lib/derive';
import { LEVELS, levelOf } from '../lib/logic/points';
import { planSentence, planTitle } from '../lib/logic/plan';
import { cap, daysBetween, parseISO, today } from '../lib/logic/dates';

export default function Home({ onPropose }: { onPropose: (groupId?: string) => void }) {
  const st = useStore();
  const { me, userId, groups, plans, profiles, points, buzzes, regalitos, nick } = st;
  const nav = useNavigate();
  const [showAll, setShowAll] = useState(false);
  if (!me || !userId) return null;

  const items = notifications({ me: userId, groups, plans, regalitos, profiles, buzzes, nick, seenBuzz: st.seenBuzz });
  const pts = pointsOf(points, userId);
  const upcoming = plans.filter((p) => p.status === 'definido').sort((a, b) => (a.date! < b.date! ? -1 : 1));
  const voting = plans.filter((p) => p.status === 'votando');

  function open(n: Notif) {
    setShowAll(false);
    if (n.buzzId) {
      const b = buzzes.find((x) => x.id === n.buzzId)!, from = profiles[b.from], g = st.group(b.groupId);
      st.markBuzzSeen(b.id);
      playBuzz({ av: from.avatar, text: `<b>${from.nick}</b> le mandó un zumbido a <b>${g?.name ?? ''}</b>`, style: b.style, msg: b.msg || '', sound: me!.zumbido?.sound !== false });
    } else if (n.to) nav(n.to);
  }
  const row = (n: Notif, k: number) => (
    <button key={k} className="nrow" onClick={() => open(n)}>
      <span className="lead" style={{ ['--tone' as string]: n.tone }}>{n.who ? <Av p={profiles[n.who]} size={36} /> : n.groupId && st.group(n.groupId) ? <GroupPic g={st.group(n.groupId)!} size={36} /> : null}</span>
      <span className="tx"><b>{n.title}</b><span>{n.sub}</span></span><span className="cta">{n.cta} ›</span>
    </button>
  );

  return <>
    <div className="top">
      <Link to="/perfil" className="avb" style={{ width: 52, height: 52 }} aria-label="Tu perfil"><Av p={me} size={52} /></Link>
      <div className="grow">
        <p className="muted small">{cap(today().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
        <h1>Hola, {me.nick || me.name || 'vos'}</h1>
        <Link to="/perfil" className="pts" style={{ marginTop: 5, textDecoration: 'none' }}><i>★</i>{pts} · {LEVELS[levelOf(pts)][1]}</Link>
      </div>
      <button className="bell" onClick={() => setShowAll(true)} aria-label={`Notificaciones: ${items.length}`}>{I.bell}{items.length > 0 && <span className="badge num">{items.length}</span>}</button>
    </div>

    {items.length > 0 && <div className="nlist">{row(items[0], 0)}{items.length > 1 && <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setShowAll(true)}>Ver {items.length - 1} más</button>}</div>}

    {!groups.length ? (
      <div className="sticker bg-peach">
        <h3>Arrancá creando un grupo</h3>
        <p className="small muted">Creá el grupo de tus amigos o tu pareja y mandales el link por WhatsApp para que se sumen.</p>
        <button className="btn" onClick={() => nav('/grupos?crear=1')}>Crear un grupo</button>
      </div>
    ) : <>
      <section className="sec"><div className="sec-h"><h2>Próximos plancitos</h2></div>
        {upcoming.length ? upcoming.map((p) => { const g = st.group(p.groupId)!; return (
          <button key={p.id} className="ticket" style={{ textAlign: 'left' }} onClick={() => nav(`/p/${p.id}`)}>
            <div className="row between"><span className="eyebrow">{g.name}</span><span className="chip ok">Confirmado</span></div>
            <div className="big">{p.answers.dia?.label} · {p.answers.hora?.label}</div>
            <p>{planSentence(p.answers)}</p>
            <div className="row between"><AvStack ids={attendees(g, p)} /><span className="muted small">en {daysBetween(today(), parseISO(p.date!))} días</span></div>
          </button>); }) : <button className="empty" onClick={() => onPropose()}>No hay nada agendado. Tocá para proponer un plancito.</button>}
        {voting.map((p) => { const g = st.group(p.groupId)!; return (
          <button key={p.id} className="card tight" style={{ textAlign: 'left' }} onClick={() => nav(`/p/${p.id}`)}>
            <div className="row between"><span className="eyebrow">{g.name}</span><span className="chip warn">En votación</span></div>
            <h3>{planTitle(p.answers, true)}</h3>
            <p className="small muted">Respondieron {effDone(p, p.round || 'cuando').length} de {attendees(g, p).length}</p>
          </button>); })}
      </section>

      <section className="sec"><div className="sec-h"><h2>Tus grupos</h2><Link className="link" to="/grupos">Ver todos</Link></div>
        <div className="card tight" style={{ gap: 0 }}>{groups.map((g) => {
          const ap = activePlan(g, plans), np = nextPlan(g, plans), late = overdue(g, plans);
          return <button key={g.id} className="grow-row" onClick={() => nav(`/g/${g.id}`)}><GroupPic g={g} size={38} />
            <span className="grow"><b>{g.name}</b><br /><span className="small muted">{g.members.length} · {goalTxt(g)}</span></span>
            {np ? <span className="chip ok">{np.answers.dia?.label}</span> : ap ? <span className="chip warn">Votando</span> : <span className={`chip ${late ? 'bad' : ''}`}>{lastLabel(g, plans, true)}</span>}
          </button>; })}</div>
      </section>
    </>}

    {showAll && <Sheet onClose={() => setShowAll(false)}>
      <div className="row between"><h2>Notificaciones</h2><button className="btn sm ghost" onClick={() => setShowAll(false)}>Cerrar</button></div>
      {items.length ? <div className="nlist">{items.map(row)}</div> : <div className="empty">Todo al día.</div>}
    </Sheet>}
  </>;
}
