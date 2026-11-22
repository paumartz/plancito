import { useState } from 'react';
import { api, type Group, type NoteKind } from '../data';
import { useStore } from '../store';
import { Av, Sheet } from './ui';
import { activeNotes } from '../lib/derive';
import { fmtDay } from '../lib/logic/dates';

const KINDS: [NoteKind, string, string, string][] = [
  ['no-estoy', 'No estoy (fechas)', 'Ej: me voy de vacaciones', 'bg-sky'],
  ['semanal', 'Todas las semanas', 'Ej: los viernes a la noche entreno', 'bg-lilac'],
  ['fecha', 'Fecha importante', 'Ej: cumple mi mamá', 'bg-pink'],
  ['recomendacion', 'Recomendación', 'Ej: me recomendaron una parrilla en Palermo', 'bg-lime'],
  ['otro', 'Otro aviso', 'Ej: los miércoles voy a la oficina, no puedo', 'bg-peach'],
];
const kindInfo = (k: NoteKind) => KINDS.find((x) => x[0] === k) || KINDS[3];
const WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEK_LONG = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const MOMENT_TXT: Record<string, string> = { manana: 'a la mañana', mediodia: 'al mediodía', tarde: 'a la tarde', noche: 'a la noche' };
const weekly = (rep?: number[] | null, moment?: string | null) => {
  if (!rep?.length) return '';
  const names = [...rep].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEK_LONG[d]);
  const list = names.length < 2 ? names[0] : names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
  return `los ${list}${moment ? ' ' + MOMENT_TXT[moment] : ''}`;
};
const when = (from?: string | null, to?: string | null) => {
  if (!from) return '';
  const f = (s: string) => fmtDay(s, { day: 'numeric', month: 'short' });
  return to && to !== from ? `del ${f(from)} al ${f(to)}` : f(from);
};

/** Tablón de avisos fijados del grupo: lo ve todo el grupo. */
export default function NotesBoard({ g }: { g: Group }) {
  const { notes, userId, profiles, nick, toast, reload } = useStore();
  const [adding, setAdding] = useState(false);
  const list = activeNotes(notes, g.id);

  return <section className="sec">
    <div className="sec-h"><h2>Avisos del grupo</h2><button className="link" onClick={() => setAdding(true)}>+ Agregar</button></div>
    {list.length ? list.map((n) => { const k = kindInfo(n.kind);
      return <div key={n.id} className={`sticker ${k[3]} note-card`}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Av p={profiles[n.author]} size={34} />
          <div className="grow"><span className="eyebrow" style={{ color: 'inherit' }}>{k[1]}{n.kind === 'semanal' ? ` · ${weekly(n.repeat, n.moment)}` : n.from ? ` · ${when(n.from, n.to)}` : ''}</span>
            <p style={{ fontWeight: 700 }}>{n.text}</p><p className="small muted">{nick(n.author)}</p></div>
          {n.author === userId && <button className="link small" style={{ color: 'inherit' }} onClick={() => api.deleteNote(n.id).then(reload).catch((e) => toast('No se pudo borrar: ' + (e as Error).message))}>Borrar</button>}
        </div></div>; })
      : <button className="empty" style={{ width: '100%' }} onClick={() => setAdding(true)}>Dejá un aviso fijado para todo el grupo: vacaciones, fechas importantes, días que no podés o un lugar que te recomendaron.</button>}
    {adding && <AddNote g={g} onClose={() => setAdding(false)} />}
  </section>;
}

function AddNote({ g, onClose }: { g: Group; onClose: () => void }) {
  const { toast, reload } = useStore();
  const [kind, setKind] = useState<NoteKind>('no-estoy');
  const [text, setText] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [rep, setRep] = useState<number[]>([]);
  const [moment, setMoment] = useState<string>('');
  const k = kindInfo(kind), dated = kind === 'no-estoy' || kind === 'fecha';

  async function save() {
    if (!text.trim()) { toast('Escribí el aviso'); return; }
    if (kind === 'no-estoy' && !from) { toast('Poné desde qué día no estás'); return; }
    if (kind === 'semanal' && !rep.length) { toast('Elegí qué días de la semana'); return; }
    if (to && from && to < from) { toast('La fecha "hasta" es antes que "desde"'); return; }
    setBusy(true);
    try { await api.addNote({ groupId: g.id, kind, text: text.trim(), from: dated && from ? from : null, to: kind === 'no-estoy' && to ? to : null, repeat: kind === 'semanal' ? rep : null, moment: kind === 'semanal' && moment ? moment : null }); await reload(); toast('Aviso fijado para todo el grupo'); onClose(); }
    catch (e) { toast('No se pudo publicar: ' + (e as Error).message); }
    finally { setBusy(false); }
  }

  return <Sheet onClose={onClose}>
    <h2>Nuevo aviso</h2><p className="small muted">Queda fijado y lo ve todo el grupo.</p>
    <div className="row wrap" style={{ gap: 7 }}>{KINDS.map(([id, l]) => <button key={id} className={kind === id ? 'vchip on' : 'vchip'} onClick={() => setKind(id)}>{l}</button>)}</div>
    <div className="field"><label htmlFor="nText">Aviso</label><input id="nText" className="inp" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder={k[2]} /></div>
    {dated && <div className="grid2">
      <div className="field"><label htmlFor="nFrom">{kind === 'fecha' ? 'Fecha' : 'Desde'}</label><input id="nFrom" type="date" className="inp" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
      {kind === 'no-estoy' && <div className="field"><label htmlFor="nTo">Hasta (opcional)</label><input id="nTo" type="date" className="inp" value={to} onChange={(e) => setTo(e.target.value)} /></div>}
    </div>}
    {kind === 'semanal' && <>
      <div className="field"><label>¿Qué días?</label><div className="row wrap" style={{ gap: 6 }}>{[1, 2, 3, 4, 5, 6, 0].map((d) =>
        <button key={d} className={rep.includes(d) ? 'vchip on' : 'vchip'} onClick={() => setRep(rep.includes(d) ? rep.filter((x) => x !== d) : [...rep, d])}>{WEEK[d]}</button>)}</div></div>
      <div className="field"><label>¿En qué horario?</label><div className="row wrap" style={{ gap: 6 }}>{([['', 'Todo el día'], ['manana', 'Mañana'], ['mediodia', 'Mediodía'], ['tarde', 'Tarde'], ['noche', 'Noche']] as const).map(([id, l]) =>
        <button key={id} className={moment === id ? 'vchip on' : 'vchip'} onClick={() => setMoment(id)}>{l}</button>)}</div></div>
    </>}
    {(kind === 'no-estoy' || kind === 'semanal') && <p className="small muted">Esos días {kind === 'semanal' ? 'y horarios ' : ''}van a aparecer marcados cuando voten un plancito.</p>}
    <button className="btn tomato full" disabled={busy} onClick={save}>{busy ? 'Publicando…' : 'Fijar aviso'}</button>
  </Sheet>;
}
