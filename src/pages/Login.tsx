import { useState } from 'react';
import { api } from '../data';
import { avatar, TEMPLATES } from '../components/avatarSvg';

declare const __BUILD__: string;

// Mail y contraseña: se entra directo desde la app de la pantalla de inicio, sin mails ni links
// (en iPhone, un link del mail abre Safari y la sesión no llega a la app instalada).
export default function Login() {
  const [mode, setMode] = useState<'entrar' | 'crear'>('crear');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const friendly = (m: string) =>
    /invalid login credentials/i.test(m) ? 'El mail o la contraseña no son correctos. Si no te la acordás, tocá "¿Te olvidaste la contraseña?".'
      : /already registered|already exists/i.test(m) ? 'Ya hay una cuenta con ese mail. Tocá "Ya tengo cuenta" y entrá con tu contraseña (si no te la acordás, usá "¿Te olvidaste la contraseña?").'
      : /email not confirmed/i.test(m) ? 'Esta cuenta todavía no está confirmada. Pedile a quien administra Plancito que apague "Confirm email" en Supabase.'
      : /password/i.test(m) && /6|short|least/i.test(m) ? 'La contraseña tiene que tener al menos 6 caracteres.'
      : /rate limit|too many/i.test(m) ? 'Muchos intentos seguidos. Esperá un ratito y probá de nuevo.'
      : /Failed to fetch|NetworkError|Load failed/i.test(m) ? 'No hay conexión con el servidor. Revisá tu internet.'
      : m;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Poné un mail válido.'); return; }
    if (api.mode !== 'local' && pw.length < 6) { setErr('La contraseña tiene que tener al menos 6 caracteres.'); return; }
    setBusy(true);
    try {
      if (mode === 'crear') {
        const r = await api.signUp(email.trim(), pw);
        if (r === 'confirm') setInfo('Te mandamos un mail para confirmar la cuenta. Después volvé acá y entrá con tu contraseña.');
      } else await api.signIn(email.trim(), pw);
    } catch (ex) { setErr(friendly((ex as Error).message || '')); }
    finally { setBusy(false); }
  }

  async function forgot() {
    setErr(''); setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Escribí tu mail arriba y tocá de nuevo "¿Te olvidaste la contraseña?".'); return; }
    setBusy(true);
    try { await api.requestPasswordReset(email.trim()); setInfo('Te mandamos un mail con un link para elegir una contraseña nueva. Abrilo, elegila y después volvé acá y entrá.'); }
    catch (ex) { setErr(friendly((ex as Error).message || '')); }
    finally { setBusy(false); }
  }

  return (
    <div className="center-page">
      <form className="login" onSubmit={submit}>
        <div className="row" style={{ justifyContent: 'center' }}>
          {TEMPLATES.slice(0, 4).map((t, i) => <span key={i} className="avb" style={{ width: 54, height: 54, marginLeft: i ? -12 : 0 }} dangerouslySetInnerHTML={{ __html: avatar(t, 54) }} />)}
        </div>
        <div className="logo">Plancito</div>
        <p className="muted">Organizá juntadas con tus amigos sin perderte nada en el chat: cuándo, qué, dónde y cuentas claras.</p>
        <div className="seg" role="tablist">
          <button type="button" className={mode === 'crear' ? 'on' : ''} onClick={() => { setMode('crear'); setErr(''); }}>Soy nuevo/a</button>
          <button type="button" className={mode === 'entrar' ? 'on' : ''} onClick={() => { setMode('entrar'); setErr(''); }}>Ya tengo cuenta</button>
        </div>
        <div className="field" style={{ textAlign: 'left' }}><label htmlFor="email">Tu mail</label>
          <input id="email" className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@mail.com" /></div>
        {api.mode !== 'local' && <div className="field" style={{ textAlign: 'left' }}><label htmlFor="pw">{mode === 'crear' ? 'Elegí una contraseña' : 'Tu contraseña'}</label>
          <input id="pw" className="inp" type="password" autoComplete={mode === 'crear' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>}
        {err && <p className="err">{err}</p>}
        {info && <div className="sticker bg-lime"><p className="small">{info}</p></div>}
        <button className="btn tomato full" disabled={busy}>{busy ? 'Un segundo…' : mode === 'crear' ? 'Crear mi cuenta' : 'Entrar'}</button>
        {mode === 'entrar' && api.mode !== 'local' && <button type="button" className="link small" onClick={forgot}>¿Te olvidaste la contraseña?</button>}
        {api.mode === 'local' && <p className="small muted">Modo local: no hace falta contraseña.</p>}
        <p className="small muted" style={{ opacity: .6 }}>Versión {__BUILD__}</p>
      </form>
    </div>
  );
}
