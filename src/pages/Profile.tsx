import { useEffect, useState } from 'react';
import { enablePush, pushState, type PushState } from '../lib/push';
import { markGuide } from '../components/ProfileGuide';
import { wishJoin, wishTitle, wishUrl } from '../lib/wish';
import { useLocation } from 'react-router-dom';
import { api, type Profile as P } from '../data';
import { useStore } from '../store';
import { Svg, TopBar } from '../components/ui';
import { AV_OPTS, AV_TABS, TEMPLATES, avatar, type AvatarOpts } from '../components/avatarSvg';
import { playBuzz, zIcon } from '../components/fx';
import { pointsOf } from '../lib/derive';
import { LEVELS, POINTS, ZSTYLES, ZUNLOCK, levelOf } from '../lib/logic/points';

import { BARRIOS as BARRIO_MAP } from '../components/PuntoMedio';
const BARRIOS = [...Object.keys(BARRIO_MAP).sort((a, b) => a.localeCompare(b, 'es')), 'Otro (fuera de CABA)'];

const andList = (xs: string[]) => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];

export default function Profile() {
  const { me, userId, points, reload, toast } = useStore();
  const [tab, setTab] = useState('pelo');
  const [custom, setCustom] = useState(false);
  const [wishLink, setWishLink] = useState('');
  const [push, setPush] = useState<PushState | null>(null);
  const [wish, setWish] = useState('');
  useEffect(() => { pushState().then(setPush).catch(() => setPush('unsupported')); }, []);
  // Desde la guía del inicio: ir directo al campo o la sección que falta.
  const loc = useLocation();
  useEffect(() => {
    if (!loc.hash) return;
    const t = setTimeout(() => { const el = document.getElementById(loc.hash.slice(1)); if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true }); }, 250);
    return () => clearTimeout(t);
  }, [loc.hash]);
  if (!me || !userId) return null;
  const pts = pointsOf(points, userId), li = levelOf(pts), nx = LEVELS[li + 1];
  const pct = nx ? ((pts - LEVELS[li][0]) / (nx[0] - LEVELS[li][0])) * 100 : 100;
  const rewards = (n: number) => Object.entries(ZUNLOCK).filter(([, v]) => v === n).map(([k]) => k);
  const zName = (k: string) => ZSTYLES.find((z) => z[0] === k)![1].toLowerCase();

  const save = async (patch: Partial<P>) => { try { await api.saveMe(patch); await reload(); } catch (e) { toast('No se pudo guardar: ' + (e as Error).message); } };
  const setAv = (k: keyof AvatarOpts, v: string) => { markGuide(userId, 'avatar'); save({ avatar: { ...me.avatar, [k]: v } }); };
  const field = (k: 'name' | 'nick' | 'alias' | 'bank', label: string, ph = '') =>
    <div className="field"><label htmlFor={'pf' + k}>{label}</label><input id={'pf' + k} className="inp" defaultValue={me[k]} placeholder={ph} onBlur={(e) => e.target.value !== me[k] && save({ [k]: e.target.value.trim() })} /></div>;

  return <>
    <TopBar title="Tu perfil" right={<span className="pts"><i>★</i>{pts}</span>} />
    <div className="hero-av"><span className="avb" style={{ width: 150, height: 150, borderWidth: 2 }} dangerouslySetInnerHTML={{ __html: avatar(me.avatar, 150) }} /></div>

    <section className="sec"><span className="eyebrow">Arrancá de un modelo</span>
      <div className="row" style={{ overflowX: 'auto', gap: 8, paddingBottom: 4 }}>{TEMPLATES.map((t, i) =>
        <button key={i} className="avb" style={{ width: 58, height: 58, padding: 0 }} aria-label={`Modelo ${i + 1}`} onClick={() => { markGuide(userId, 'avatar'); save({ avatar: { ...t } }); }} dangerouslySetInnerHTML={{ __html: avatar(t, 58) }} />)}</div>
    </section>
    <section className="sec" id="avatar"><span className="eyebrow">Personalizalo</span>
      <div className="tabs">{AV_TABS.map(([k, l]: string[]) => <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="avpicker">{(AV_OPTS as Record<string, string[][]>)[tab].map(([v, l]) =>
        <button key={v} className={(me.avatar as unknown as Record<string, string>)[tab] === v ? 'on' : ''} onClick={() => setAv(tab as keyof AvatarOpts, v)}>
          <Svg html={avatar({ ...me.avatar, [tab]: v }, 54)} />{l}</button>)}
        {tab === 'color' && <button className={me.avatar.color === 'custom' ? 'on' : ''} onClick={() => setCustom(true)}>
          <Svg html={avatar({ ...me.avatar, color: 'custom', c1: me.avatar.c1 || '#7C8B4F', c2: me.avatar.c2 }, 54)} />Tu color</button>}</div>
      {tab === 'color' && custom && <CustomColor av={me.avatar} onSave={(c1, c2) => { markGuide(userId, 'avatar'); save({ avatar: { ...me.avatar, color: 'custom', c1, c2 } }); }} />}
    </section>

    <section className="sec"><h2>Tus datos</h2>
      <div className="grid2">{field('name', 'Nombre')}{field('nick', 'Apodo')}</div>
      <div className="grid2">{field('alias', 'Alias / CVU', 'tu.alias.mp')}{field('bank', 'Banco o billetera', 'Mercado Pago')}</div>
      <div className="stack">
        <div className="field"><label htmlFor="pfBday">Cumpleaños</label><input id="pfBday" type="date" className="inp" defaultValue={me.birthday || ''} onBlur={(e) => save({ birthday: e.target.value || null })} /></div>
        <div className="field"><label htmlFor="pfBarrio">Barrio</label><select id="pfBarrio" className="inp" value={me.barrio || ''} onChange={(e) => save({ barrio: e.target.value || null })}>
          <option value="">Elegí</option>{BARRIOS.map((b) => <option key={b}>{b}</option>)}</select></div>
      </div>
      <p className="small muted" style={{ marginTop: -4 }}>Tu alias lo ven tus grupos para pagarte. Del lugar usamos solo el barrio, nunca tu dirección.</p>
    </section>

    <section className="sec" id="notificaciones"><h2>Notificaciones</h2>
      <div className="card tight">
        {push === 'on' ? <p className="small"><b>Activadas.</b> Te avisamos de zumbidos, plancitos nuevos, recordatorios, deudas y cumples.</p>
          : push === 'needs-install' ? <p className="small">En iPhone, primero agregá Plancito a la pantalla de inicio (Compartir → Agregar a inicio) y abrilo desde ahí.</p>
          : push === 'denied' ? <p className="small">Las bloqueaste en el navegador. Activalas desde los ajustes del navegador para este sitio.</p>
          : push === 'not-configured' ? <p className="small muted">Las notificaciones todavía no están configuradas en el servidor.</p>
          : push === 'unsupported' ? <p className="small muted">Este navegador no permite notificaciones.</p>
          : <><p className="small">Activalas para que te lleguen los zumbidos, los recordatorios y los avisos de deudas aunque no tengas la app abierta.</p>
            <button className="btn" onClick={() => enablePush().then(setPush).catch((e) => toast('No se pudo activar: ' + (e as Error).message))}>Activar notificaciones</button></>}
      </div>
    </section>

    <section className="sec"><h2>Tu lista de deseos</h2><p className="small muted" style={{ marginTop: -6 }}>La ven tus grupos cuando se acerca tu cumple.</p>
      <div className="card tight">{me.wishlist.length > 0 && <div className="list">{me.wishlist.map((w, i) => <div key={i} className="li"><span className="grow">{wishTitle(w)}{wishUrl(w) && <> · <a className="link small" href={wishUrl(w)!} target="_blank" rel="noopener">Ver</a></>}</span>
        <button className="link small" onClick={() => save({ wishlist: me.wishlist.filter((_, j) => j !== i) })}>Quitar</button></div>)}</div>}
        <input className="inp" value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Algo que te gustaría…" />
        <div className="row"><input className="inp" value={wishLink} onChange={(e) => setWishLink(e.target.value)} placeholder="Link (opcional)" inputMode="url" />
          <button className="btn soft" onClick={() => { if (wish.trim()) { save({ wishlist: [...me.wishlist, wishJoin(wish.trim(), wishLink.trim())] }); setWish(''); setWishLink(''); } }}>Sumar</button></div></div>
    </section>
    <section className="sec"><h2>¿O que le pregunten a alguien?</h2><p className="small muted" style={{ marginTop: -6 }}>Si no tenés ganas de armar lista, dejá a alguien que sepa qué te gustaría. Lo ven solo cuando se organiza tu regalo.</p>
      <div className="card tight">
        <div className="grid2">
          <div className="field"><label htmlFor="acName">Nombre</label><input id="acName" className="inp" defaultValue={me.askContact.name || ''} placeholder="Ej: Fran" onBlur={(e) => save({ askContact: { ...me.askContact, name: e.target.value.trim() } })} /></div>
          <div className="field"><label htmlFor="acRel">Quién es</label><input id="acRel" className="inp" defaultValue={me.askContact.rel || ''} placeholder="Ej: Mi novio" onBlur={(e) => save({ askContact: { ...me.askContact, rel: e.target.value.trim() } })} /></div>
        </div>
        <div className="seg" role="group" aria-label="Cómo contactarle">{([['wa', 'WhatsApp'], ['ig', 'Instagram']] as const).map(([k, l]) =>
          <button key={k} className={(me.askContact.via || 'wa') === k ? 'on' : ''} onClick={() => save({ askContact: { ...me.askContact, via: k } })}>{l}</button>)}</div>
        {(me.askContact.via || 'wa') === 'wa'
          ? <div className="field"><label htmlFor="acPhone">WhatsApp</label><input id="acPhone" key="wa" className="inp" inputMode="tel" defaultValue={me.askContact.phone || ''} placeholder="+54 9 11 ..." onBlur={(e) => save({ askContact: { ...me.askContact, phone: e.target.value.trim() } })} /></div>
          : <div className="field"><label htmlFor="acIg">Instagram</label><input id="acIg" key="ig" className="inp" defaultValue={me.askContact.ig || ''} placeholder="@usuario" autoCapitalize="none" onBlur={(e) => save({ askContact: { ...me.askContact, ig: e.target.value.trim().replace(/^@/, '') } })} /></div>}
      </div>
    </section>

    <section className="sec"><div className="sec-h"><h2>Tu nivel: {LEVELS[li][1]}</h2></div>
      <p className="small muted" style={{ marginTop: -6 }}>Cada vez que hacés algo por el grupo sumás estrellitas. Con más estrellitas subís de nivel, y cada nivel te da zumbidos nuevos.</p>
      {nx ? <div className="stack" style={{ gap: 5 }}><div className="meter"><span style={{ width: `${pct}%`, background: 'var(--tomato)' }} /></div>
        <p className="small"><b>Te faltan {nx[0] - pts} ★</b> para {nx[1]}{rewards(nx[0]).length ? ` y desbloquear ${andList(rewards(nx[0]).map(zName))}` : ''}.</p></div> : <p className="small"><b>Llegaste al nivel máximo.</b></p>}
      <div className="card tight"><div className="ladder">{LEVELS.map((l, i) => { const stt = i < li ? 'done' : i === li ? 'now' : 'next', rw = rewards(l[0]);
        return <div key={l[1]} className={`rung ${stt}`}><span className="lv">{i < li ? '✓' : i + 1}</span>
          <div className="grow"><b>{l[1]}</b> <span className="small muted num">· {l[0]} ★</span>{stt === 'now' && <> <span className="chip pastel">Estás acá</span></>}
            <div className="small muted">{rw.length ? (rw.length > 1 ? 'Zumbidos ' : 'Zumbido ') + andList(rw.map(zName)) : 'Clásico, corazones y estrellitas'}</div></div>
          <Svg className="rw" html={(rw.length ? rw : ['clasico']).map((k) => zIcon(k, 24)).join('')} /></div>; })}</div></div>
      <details className="card tight"><summary style={{ fontWeight: 700, cursor: 'pointer' }}>¿Cómo sumo estrellitas?</summary>
        <div className="list" style={{ marginTop: 6 }}>{Object.entries(POINTS).map(([k, [n, l]]) => <div key={k} className="li"><span className="grow">{l}</span><b className="num">+{n} ★</b></div>)}</div></details>
    </section>

    <section className="sec" id="zumbido"><h2>Tu zumbido</h2><p className="small muted" style={{ marginTop: -6 }}>Como en el MSN: sacude la pantalla del grupo. Elegí cómo les llega.</p>
      <div className="grid4">{ZSTYLES.map(([k, l]) => { const need = ZUNLOCK[k] || 0, locked = need > pts;
        return <button key={k} className={`zbtn ${me.zumbido.style === k ? 'on' : ''} ${locked ? 'locked' : ''}`}
          onClick={() => locked ? toast(`Se desbloquea con ${need} ★. Te faltan ${need - pts}.`) : (markGuide(userId, 'zumbido'), save({ zumbido: { ...me.zumbido, style: k } }))}>
          <Svg html={zIcon(k)} />{l}{locked && <span className="lockb">★ {need}</span>}</button>; })}</div>
      <div className="field"><label htmlFor="zMsg">Tu frase</label><input id="zMsg" className="inp" maxLength={40} defaultValue={me.zumbido.msg} onBlur={(e) => { markGuide(userId, 'zumbido'); save({ zumbido: { ...me.zumbido, msg: e.target.value.trim() } }); }} /></div>
      <div className="row between wrap"><label className="check"><input type="checkbox" checked={me.zumbido.sound !== false} onChange={(e) => save({ zumbido: { ...me.zumbido, sound: e.target.checked } })} /> Con sonido</label>
        <button className="btn" onClick={() => playBuzz({ av: me.avatar, text: 'Así les va a llegar tu zumbido', style: me.zumbido.style, msg: me.zumbido.msg, sound: me.zumbido.sound })}>Probar mi zumbido</button></div>
    </section>

    <button className="btn ghost full" onClick={() => api.signOut()}>Cerrar sesión</button>
  </>;
}

/** Elegir el color de la remera: liso o degradé, con el selector de color del teléfono. */
function CustomColor({ av, onSave }: { av: AvatarOpts; onSave: (c1: string, c2?: string) => void }) {
  const [grad, setGrad] = useState(!!av.c2);
  const [c1, setC1] = useState(av.c1 || '#7C8B4F');
  const [c2, setC2] = useState(av.c2 || '#C9B8F5');
  return <div className="card tight">
    <div className="row between wrap"><Svg html={avatar({ ...av, color: 'custom', c1, c2: grad ? c2 : undefined }, 72)} />
      <div className="seg" style={{ flex: 1, minWidth: 180 }}>{([[false, 'Liso'], [true, 'Degradé']] as const).map(([v, l]) =>
        <button key={l} className={grad === v ? 'on' : ''} onClick={() => setGrad(v)}>{l}</button>)}</div></div>
    <div className="row wrap" style={{ gap: 12 }}>
      <label className="colorpick">Color{grad ? ' 1' : ''}<input type="color" value={c1} onChange={(e) => setC1(e.target.value)} /></label>
      {grad && <label className="colorpick">Color 2<input type="color" value={c2} onChange={(e) => setC2(e.target.value)} /></label>}
    </div>
    <button className="btn" onClick={() => onSave(c1, grad ? c2 : undefined)}>Usar este color</button>
  </div>;
}
