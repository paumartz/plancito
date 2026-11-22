import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../data';
import { useStore } from '../store';
import { upcomingDays } from '../lib/logic/dates';
import { MOMENTOS, PLANES, planesFor, shareText as buildShare, slotId, type MomentoId, type Proposed } from '../lib/logic/plan';
import { activePlan } from '../lib/derive';
import { I, Sheet, copyText, shareText } from './ui';

export default function ProposeSheet({ groupId, onClose }: { groupId: string | null; onClose: () => void }) {
  const { groups, plans, toast, reload, nick, userId } = useStore();
  const nav = useNavigate();
  const [gid, setGid] = useState(groupId || groups[0]?.id);
  const [vibe, setVibe] = useState<'concreto' | 'vago' | 'nada'>('vago');
  const [momento, setMomento] = useState<MomentoId>('noche');
  const [plan, setPlan] = useState<string | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const days = upcomingDays();
  const g = groups.find((x) => x.id === gid);

  if (!groups.length) return (
    <Sheet onClose={onClose}>
      <h2>Primero, un grupo</h2>
      <p className="muted small">Para proponer un plancito necesitás un grupo. Crealo y mandale el link a tus amigos.</p>
      <button className="btn full" onClick={() => { onClose(); nav('/grupos?crear=1'); }}>Crear un grupo</button>
    </Sheet>
  );

  async function create() {
    if (!g) return;
    if (activePlan(g, plans)) { toast(`${g.name} ya tiene un plancito en votación`); return; }
    setBusy(true);
    try {
      const proposed: Proposed = {};
      if (vibe !== 'nada') { proposed.momento = momento; if (plan) proposed.plan = plan; }
      if (vibe === 'concreto' && dia) proposed.dia = dia;
      const id = await api.createPlan(g.id, proposed);
      if (proposed.dia && proposed.momento) await api.saveBallot(id, 'cuando', { slots: [slotId(proposed.dia, proposed.momento)] }, true);
      await reload();
      setCreated({ id, text: buildShare(proposed, `${location.origin}/i/${g.inviteCode}?p=${id}`, days, g.kind === 'pareja' || g.members.length === 2 ? 1 : 2) });
    } catch (e) {
      toast('No se pudo crear el plancito: ' + (e as Error).message);
    } finally { setBusy(false); }
  }

  if (created) return (
    <Sheet onClose={onClose}>
      <h2>{(g?.members.length || 0) === 2 ? `¡Listo! Ahora avisale a ${nick(g!.members.find((m) => m !== userId)!)}` : g?.kind === 'pareja' ? '¡Listo! Ahora avisale a tu pareja' : '¡Listo! Ahora avisale al grupo'}</h2>
      <p className="muted small">{(g?.members.length || 0) < 2 ? 'Todavía no está en el grupo: con este mensaje se suma y vota.' : (g?.members.length || 0) === 2 ? 'Mandale esto por WhatsApp:' : 'Mandá esto al grupo de WhatsApp:'}</p>
      <div className="card tight" style={{ fontSize: 15 }}>{created.text}</div>
      <div className="grid2">
        <button className="btn ghost" onClick={() => copyText(created.text, toast)}>{I.copy} Copiar</button>
        <button className="btn" onClick={() => shareText(created.text, toast)}>Compartir</button>
      </div>
      <button className="btn soft full" onClick={() => { onClose(); nav(`/p/${created.id}`); }}>Ver el plancito</button>
    </Sheet>
  );

  const pick = (on: boolean) => (on ? 'pick on' : 'pick');
  return (
    <Sheet onClose={onClose}>
      <h2>Proponer un plancito</h2>
      <div className="field"><label>¿Con quiénes?</label>
        <div className="row wrap">{groups.map((x) => <button key={x.id} className={x.id === gid ? 'vchip on' : 'vchip'} onClick={() => setGid(x.id)}>{x.name}</button>)}</div>
      </div>
      <div className="field"><label>¿Qué tan definido está?</label>
        <div className="grid3">
          {([['concreto', 'Algo concreto', 'Ya tengo idea'], ['vago', 'Más o menos', 'Sé qué, no cuándo'], ['nada', 'Nada', '¿Hacemos algo?']] as const).map(([v, l, s]) =>
            <button key={v} className={pick(vibe === v)} onClick={() => setVibe(v)}>{l}<span className="small muted" style={{ fontWeight: 500 }}>{s}</span></button>)}
        </div>
      </div>
      {vibe !== 'nada' && <>
        <div className="field"><label>¿Cuándo, más o menos?</label>
          <div className="grid4">{MOMENTOS.map((m) => <button key={m.id} className={pick(momento === m.id)} onClick={() => { setMomento(m.id); if (plan && !PLANES[plan].m.includes(m.id)) setPlan(null); }}>{m.label}</button>)}</div>
        </div>
        <div className="field"><label>¿Algo en mente? (opcional)</label>
          <div className="row wrap" style={{ gap: 7 }}>{planesFor(g?.likes || [], momento).map((k) =>
            <button key={k} className={plan === k ? 'vchip on' : 'vchip'} onClick={() => setPlan(plan === k ? null : k)}>{PLANES[k].l}{g?.likes.includes(k) ? ' ★' : ''}</button>)}</div>
        </div>
      </>}
      {vibe === 'concreto' && <div className="field"><label>¿Qué día?</label>
        <div className="grid2">{days.map((d) => <button key={d.id} className={pick(dia === d.id)} onClick={() => setDia(d.id)}>{d.label}</button>)}</div>
      </div>}
      <p className="small muted">{vibe === 'concreto' ? 'Tus amigos lo aceptan con un toque, o marcan otro horario.' : vibe === 'vago' ? 'Cada uno marca qué días puede. Qué hacemos y dónde se elige cuando ya está el día.' : 'Cada uno marca cuándo puede. Cuando está el día, eligen qué hacer y dónde.'}</p>
      <button className="btn tomato full" disabled={busy} onClick={create}>{busy ? 'Creando…' : 'Proponer'}</button>
    </Sheet>
  );
}
