import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { pushState, type PushState } from '../lib/push';

// Pasos que ya se hicieron y que no se pueden deducir del perfil (armar el avatar, elegir zumbido).
const key = (uid: string) => 'plancito-guia-' + uid;
const read = (uid: string): Record<string, unknown> => { try { return JSON.parse(localStorage.getItem(key(uid)) || '{}'); } catch { return {}; } };
export function markGuide(uid: string | null, step: string) {
  if (!uid) return;
  try { localStorage.setItem(key(uid), JSON.stringify({ ...read(uid), [step]: true })); } catch { /* sin storage */ }
}

/** Guía suave para completar el perfil: aparece en el inicio hasta que esté todo o la escondas. */
export default function ProfileGuide() {
  const { me, userId, groups } = useStore();
  const nav = useNavigate();
  const [push, setPush] = useState<PushState | null>(null);
  const [, force] = useState(0);
  useEffect(() => { pushState().then(setPush).catch(() => setPush('unsupported')); }, []);
  if (!me || !userId) return null;
  const flags = read(userId);
  if (typeof flags.hiddenUntil === 'number' && Date.now() < flags.hiddenUntil) return null;

  const steps: { id: string; done: boolean; title: string; why: string; to: string }[] = [
    { id: 'nombre', done: !!(me.name.trim() || me.nick.trim()), title: 'Poné tu nombre', why: 'Así te reconocen en el grupo. El apodo es opcional.', to: '/perfil#pfname' },
    { id: 'avatar', done: !!flags.avatar, title: 'Armá tu avatar', why: 'Pelo, lentes, accesorio, mascota…', to: '/perfil#avatar' },
    { id: 'alias', done: !!me.alias.trim(), title: 'Sumá tu alias', why: 'Para que te puedan pagar sin preguntarte.', to: '/perfil#pfalias' },
    { id: 'cumple', done: !!me.birthday, title: 'Cargá tu cumple', why: 'Para que el grupo organice tu regalito.', to: '/perfil#pfBday' },
    { id: 'barrio', done: !!me.barrio, title: 'Elegí tu barrio', why: 'Para buscar lugares a mitad de camino.', to: '/perfil#pfBarrio' },
    { id: 'zumbido', done: !!flags.zumbido || me.zumbido?.style !== 'clasico', title: 'Definí tu zumbido', why: 'Cómo sacudís al grupo cuando nadie responde.', to: '/perfil#zumbido' },
    ...(push && push !== 'unsupported' && push !== 'not-configured' ? [{ id: 'push', done: push === 'on', title: 'Activá las notificaciones', why: 'Zumbidos, recordatorios y deudas, aunque no abras la app.', to: '/perfil#notificaciones' }] : []),
    { id: 'grupo', done: groups.length > 0, title: 'Creá tu primer grupo', why: 'O sumate con el link que te pasaron.', to: '/grupos?crear=1' },
  ];
  const done = steps.filter((s) => s.done).length, pending = steps.filter((s) => !s.done);
  if (!pending.length) return null;

  return <div className="card guide">
    <div className="row between"><div><span className="eyebrow">Completá tu perfil</span><h3>{done} de {steps.length} listos</h3></div>
      <button className="link small" style={{ color: 'var(--ink-2)' }} onClick={() => { try { localStorage.setItem(key(userId), JSON.stringify({ ...flags, hiddenUntil: Date.now() + 3 * 864e5 })); } catch { /* */ } force((x) => x + 1); }}>Más tarde</button></div>
    <div className="meter"><span style={{ width: `${(done / steps.length) * 100}%`, background: 'var(--tomato)' }} /></div>
    <div className="list">{pending.slice(0, 3).map((s) => <button key={s.id} className="li guide-row" onClick={() => nav(s.to)}>
      <span className="tick" aria-hidden="true" /><span className="grow" style={{ textAlign: 'left' }}><b>{s.title}</b><br /><span className="small muted">{s.why}</span></span><span className="cta">›</span></button>)}</div>
    {pending.length > 3 && <p className="small muted">Y {pending.length - 3} más.</p>}
  </div>;
}
