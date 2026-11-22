import { useState } from 'react';
import { api } from '../data';
import { avatar, TEMPLATES } from '../components/avatarSvg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Poné un mail válido.'); return; }
    setErr(''); setState('busy');
    try {
      const r = await api.signIn(email.trim());
      setState(r === 'sent' ? 'sent' : 'idle');
    } catch (ex) { setErr((ex as Error).message); setState('idle'); }
  }

  return (
    <div className="center-page">
      <form className="login" onSubmit={submit}>
        <div className="row" style={{ justifyContent: 'center' }}>
          {TEMPLATES.slice(0, 4).map((t, i) => <span key={i} className="avb" style={{ width: 54, height: 54, marginLeft: i ? -12 : 0 }} dangerouslySetInnerHTML={{ __html: avatar(t, 54) }} />)}
        </div>
        <div className="logo">Plancito</div>
        <p className="muted">Organizá juntadas con tus amigos sin perderte nada en el chat: cuándo, qué, dónde y cuentas claras.</p>
        {state === 'sent' ? (
          <div className="sticker bg-lime"><h3>Revisá tu mail</h3><p className="small">Te mandamos un link a <b>{email}</b>. Abrilo desde este teléfono para entrar.</p></div>
        ) : <>
          <div className="field" style={{ textAlign: 'left' }}><label htmlFor="email">Tu mail</label>
            <input id="email" className="inp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@mail.com" /></div>
          {err && <p className="err">{err}</p>}
          <button className="btn tomato full" disabled={state === 'busy'}>{state === 'busy' ? 'Enviando…' : api.mode === 'local' ? 'Entrar' : 'Mandame el link'}</button>
          <p className="small muted">{api.mode === 'local' ? 'Modo local: no se manda ningún mail.' : 'Sin contraseñas: te llega un link para entrar.'}</p>
        </>}
      </form>
    </div>
  );
}
