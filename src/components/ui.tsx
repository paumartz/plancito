import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatar } from './avatarSvg';
import { groupArtSvg } from './groupArt';
import type { Group, Profile } from '../data';
import { useStore } from '../store';

export function Av({ p, size = 40, crown }: { p?: Profile; size?: number; crown?: boolean }) {
  if (!p) return <span className="avb" style={{ width: size, height: size }} />;
  return <span className="avb" style={{ width: size, height: size }} title={p.nick || p.name}
    dangerouslySetInnerHTML={{ __html: avatar(p.avatar, size, { crown }) }} />;
}
export function AvStack({ ids, size = 28 }: { ids: string[]; size?: number }) {
  const { profiles } = useStore();
  return <span className="avstack">{ids.map((i) => <Av key={i} p={profiles[i]} size={size} />)}</span>;
}
export function GroupPic({ g, size = 46 }: { g: Group; size?: number }) {
  if (g.photoUrl) return <span className="gph" style={{ width: size, height: size }}><img src={g.photoUrl} alt="" /></span>;
  return <span className="avb" style={{ width: size, height: size, background: '#FFFDF9' }} dangerouslySetInnerHTML={{ __html: groupArtSvg(g.icon, size) }} />;
}
export function Svg({ html, className }: { html: string; className?: string }) {
  return <span className={className} style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function TopBar({ title, back, right }: { title: ReactNode; back?: string | true; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="top">
      {back && <button className="back" aria-label="Volver" onClick={() => (back === true ? nav(-1) : nav(back))}>{I.back}</button>}
      <h1 className="grow" style={{ fontSize: 24 }}>{title}</h1>
      {right}
    </div>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true"><span className="grab" />{children}</div>
    </div>
  );
}

export async function copyText(text: string, toast: (m: string) => void, msg = 'Copiado') {
  try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast('No se pudo copiar: ' + text); }
}
/** Comparte con el menú nativo del teléfono (WhatsApp, etc.) o copia si no hay. */
export async function shareText(text: string, toast: (m: string) => void) {
  if (navigator.share) { try { await navigator.share({ text }); return; } catch { /* cancelado */ } }
  copyText(text, toast, 'Copiado: pegalo en el grupo');
}

const sv = (d: ReactNode, size = 20) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
export const I = {
  home: sv(<path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4Z" />, 24),
  groups: sv(<><circle cx="9" cy="9" r="3.5" /><circle cx="17" cy="10" r="2.6" /><path d="M3 20 c0-4 3-6 6-6 s6 2 6 6 M15 15 c3-.6 6 1 6 5" /></>, 24),
  plus: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5 V19 M5 12 H19" /></svg>,
  me: sv(<><circle cx="12" cy="9" r="4" /><path d="M4 21 c0-4 4-7 8-7 s8 3 8 7" /></>, 24),
  back: sv(<path d="M15 5 L8 12 L15 19" />),
  bell: sv(<path d="M6 16 V11 a6 6 0 0 1 12 0 V16 L20 18 H4 Z M10 21 h4" />, 21),
  copy: sv(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8 V5 a1 1 0 0 0 -1 -1 H5 a1 1 0 0 0 -1 1 V15 a1 1 0 0 0 1 1 H8" /></>, 16),
  cal: sv(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10 H20 M9 3 V7 M15 3 V7" /></>, 16),
  bolt: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" /></svg>,
};
