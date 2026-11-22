import { useState } from 'react';
import { api, type Group } from '../data';
import { useStore } from '../store';
import { GroupPic, Svg } from './ui';
import { ART_COLORS, ART_GRADS, ART_GRAD_LABELS, ART_KEYS, GROUP_ARTS, groupArtSvg } from './groupArt';

/** Elegir la ilustración del grupo (y su color) o subir una foto. */
export default function GroupImageEditor({ g }: { g: Group }) {
  const { toast, reload } = useStore();
  const [busy, setBusy] = useState(false);
  const icon = { icon: GROUP_ARTS[g.icon.icon] ? g.icon.icon : 'globo', color: ART_GRADS[g.icon.color] ? g.icon.color : 'sunset' };

  async function save(patch: Parameters<typeof api.updateGroup>[1], ok?: string) {
    setBusy(true);
    try { await api.updateGroup(g.id, patch); await reload(); if (ok) toast(ok); }
    catch (e) { toast('No se pudo guardar: ' + (e as Error).message); }
    finally { setBusy(false); }
  }
  function onPhoto(f?: File) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        // Recorte cuadrado y chico: se guarda liviano.
        const side = Math.min(im.width, im.height), out = 320, c = document.createElement('canvas');
        c.width = out; c.height = out;
        c.getContext('2d')!.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, out, out);
        save({ photoUrl: c.toDataURL('image/jpeg', 0.82) }, 'Foto del grupo actualizada');
      };
      im.onerror = () => toast('No pudimos leer esa imagen. Probá con otra.');
      im.src = rd.result as string;
    };
    rd.readAsDataURL(f);
  }

  return <div className="stack" style={{ gap: 14 }}>
    <div className="row"><GroupPic g={g} size={72} /><div className="grow"><h3>Imagen del grupo</h3><p className="small muted">Elegí una ilustración o subí una foto.</p></div></div>
    <div className="row wrap">
      <label className="btn sm" style={{ cursor: 'pointer' }}>{g.photoUrl ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {g.photoUrl && <button className="btn sm ghost" disabled={busy} onClick={() => save({ photoUrl: null }, 'Ahora se usa la ilustración')}>Usar ilustración</button>}
    </div>
    <div className="artpick">{ART_KEYS.map((k) => <button key={k} className={!g.photoUrl && icon.icon === k ? 'on' : ''} disabled={busy} aria-label={GROUP_ARTS[k].label}
      onClick={() => save({ icon: { ...icon, icon: k }, ...(g.photoUrl ? { photoUrl: null } : {}) })}><Svg html={groupArtSvg({ icon: k, color: icon.color }, 52)} /></button>)}</div>
    <div className="swatches">{ART_COLORS.map((k) => { const c = ART_GRADS[k];
      return <button key={k} aria-label={ART_GRAD_LABELS[k]} className={icon.color === k ? 'on' : ''} disabled={busy} style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]}, ${c[2]})` }}
        onClick={() => save({ icon: { ...icon, color: k } })} />; })}</div>
  </div>;
}
