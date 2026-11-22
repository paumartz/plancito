import { useEffect, useState } from 'react';
import { api } from '../data';
import { avatar, TEMPLATES } from '../components/avatarSvg';

// Entramos con un código por mail (no con un link): en iPhone, el link abre Safari y la sesión
// queda ahí en vez de en la app de la pantalla de inicio. El código se escribe en la propia app.
export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'code' | 'checking'>('idle');
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const friendly = (m: string) =>
    /rate limit|too many/i.test(m) ? 'Pediste varios códigos seguidos y el servidor de mails puso una pausa. Usá el último código que te llegó (sirve por una hora) o probá de nuevo en un rato.'
      : /expired|invalid|otp/i.test(m) ? 'El código no es correcto o ya venció. Revisá el último mail o pedí uno nuevo.'
      : m;

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Poné un mail válido.'); return; }
    setErr(''); setState('busy');
    try {
      const r = await api.signIn(email.trim());
      if (r === 'sent') { setState('code'); setWait(60); } else setState('idle');
    } catch (ex) { setErr(friendly((ex as Error).message || '')); setState('idle'); }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    const c = code.replace(/\D/g, '');
    if (c.length < 6) { setErr('El código tiene 6 números.'); return; }
    setErr(''); setState('checking');
    try { await api.verifyCode(email.trim(), c); }
    catch (ex) { setErr(friendly((ex as Error).message || '')); setState('code'); }
  }

  const head = <>
    <div className="row" style={{ justifyContent: 'center' }}>
      {TEMPLATES.slice(0, 4).map((t, i) => <span key={i} className="avb" style={{ width: 54, height: 54, marginLeft: i ? -12 : 0 }} dangerouslySetInnerHTML={{ __html: avatar(t, 54) }} />)}
    </div>
    <div className="logo">Plancito</div>
  </>;

  if (state === 'code' || state === 'checking') return (
    <div className="center-page">
      <form className="login" onSubmit={verify}>
        {head}
        <div><h2>Revisá tu mail</h2><p className="muted small">Te mandamos un código de 6 números a <b>{email}</b>. Escribilo acá.</p></div>
        <input id="code" className="inp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} autoFocus
          style={{ fontSize: 28, letterSpacing: '.35em', textAlign: 'center', fontWeight: 700 }}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="······" aria-label="Código de 6 números" />
        {err && <p className="err">{err}</p>}
        <button className="btn tomato full" disabled={state === 'checking'}>{state === 'checking' ? 'Entrando…' : 'Entrar'}</button>
        <div className="row" style={{ justifyContent: 'center', gap: 16 }}>
          <button type="button" className="link small" disabled={wait > 0} onClick={() => send()}>{wait > 0 ? `Reenviar en ${wait} s` : 'Reenviar código'}</button>
          <button type="button" className="link small" onClick={() => { setState('idle'); setCode(''); setErr(''); }}>Cambiar mail</button>
        </div>
        <p className="small muted">Si no lo ves, buscalo en spam o promociones.</p>
      </form>
    </div>
  );

  return (
    <div className="center-page">
      <form className="login" onSubmit={send}>
        {head}
        <p className="muted">Organizá juntadas con tus amigos sin perderte nada en el chat: cuándo, qué, dónde y cuentas claras.</p>
        <div className="field" style={{ textAlign: 'left' }}><label htmlFor="email">Tu mail</label>
          <input id="email" className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@mail.com" /></div>
        {err && <p className="err">{err}</p>}
        <button className="btn tomato full" disabled={state === 'busy'}>{state === 'busy' ? 'Enviando…' : api.mode === 'local' ? 'Entrar' : 'Mandame el código'}</button>
        <p className="small muted">{api.mode === 'local' ? 'Modo local: no se manda ningún mail.' : 'Sin contraseñas: te llega un código para entrar.'}</p>
      </form>
    </div>
  );
}
