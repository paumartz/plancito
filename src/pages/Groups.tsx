import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../data';
import { useStore } from '../store';
import { AvStack, GroupPic, Sheet, TopBar } from '../components/ui';
import { activePlan, doneThisPeriod, goalTxt, lastLabel, nextPlan, overdue } from '../lib/derive';
import { ART_COLORS, ART_KEYS } from '../components/groupArt';

export default function Groups() {
  const { groups, plans, reload, toast } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const creating = params.get('crear') === '1';
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'amigos' | 'pareja'>('amigos');
  const [goal, setGoal] = useState('2-mes');
  const [link, setLink] = useState('');

  async function create() {
    if (!name.trim()) { toast('Ponele un nombre al grupo'); return; }
    const [n, per] = goal.split('-');
    const icons = ART_KEYS, colors = ART_COLORS;
    try {
      const g = await api.createGroup({ name: name.trim(), kind, goal: { n: Number(n), per: per as 'mes' }, icon: { icon: icons[Math.floor(Math.random() * icons.length)], color: colors[Math.floor(Math.random() * colors.length)] } });
      await reload();
      nav(`/g/${g.id}?invitar=1`);
    } catch (e) { toast('No se pudo crear: ' + (e as Error).message); }
  }
  function join() {
    const m = link.trim().match(/\/i\/([A-Za-z0-9]+)/) || link.trim().match(/^([A-Za-z0-9]{6,})$/);
    if (!m) { toast('Pegá el link de invitación que te pasaron'); return; }
    nav(`/i/${m[1]}`);
  }

  return <>
    <TopBar title="Grupos" right={<button className="btn sm" onClick={() => setParams({ crear: '1' })}>+ Crear</button>} />
    <div className="stack">
      {groups.map((g) => {
        const ap = activePlan(g, plans), np = nextPlan(g, plans), done = doneThisPeriod(g, plans);
        return <button key={g.id} className="card" style={{ textAlign: 'left' }} onClick={() => nav(`/g/${g.id}`)}>
          <div className="row"><GroupPic g={g} size={46} /><div className="grow"><h3>{g.name}</h3><p className="small muted">{g.kind === 'pareja' ? 'Pareja' : `${g.members.length} integrantes`} · {goalTxt(g)}</p></div>
            {np ? <span className="chip ok">{np.answers.dia?.label}</span> : ap ? <span className="chip warn">En votación</span> : <span className={`chip ${overdue(g, plans) ? 'bad' : ''}`}>{lastLabel(g, plans)}</span>}</div>
          <div className="row between"><AvStack ids={g.members} /><span className="small muted">{done}/{g.goal.n} este {g.goal.per}</span></div>
        </button>;
      })}
      {!groups.length && <div className="empty">Todavía no tenés grupos. Creá uno o sumate con el link que te pasaron.</div>}
    </div>
    <div className="card"><h3>¿Te pasaron un link?</h3><p className="small muted">Pegá la invitación que te mandaron por WhatsApp.</p>
      <div className="row"><input className="inp" value={link} onChange={(e) => setLink(e.target.value)} placeholder="plancito…/i/…" /><button className="btn" onClick={join}>Unirme</button></div></div>

    {creating && <Sheet onClose={() => setParams({})}>
      <h2>Nuevo grupo</h2>
      <div className="field"><label htmlFor="ngName">Nombre</label><input id="ngName" className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Las del cole" /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="ngKind">Tipo</label><select id="ngKind" className="inp" value={kind} onChange={(e) => setKind(e.target.value as 'amigos')}><option value="amigos">Amigos</option><option value="pareja">Pareja</option></select></div>
        <div className="field"><label htmlFor="ngGoal">Objetivo</label><select id="ngGoal" className="inp" value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option value="1-semana">1 por semana</option><option value="2-mes">2 por mes</option><option value="1-mes">1 por mes</option><option value="6-año">6 por año</option></select></div>
      </div>
      <button className="btn full" onClick={create}>Crear y conseguir el link</button>
    </Sheet>}
  </>;
}
