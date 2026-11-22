import { useState } from 'react';
import { api } from '../data';

// Se abre desde el mail de "olvidé mi contraseña" (en iPhone, en Safari). Acá se elige la nueva
// y después se vuelve a la app de la pantalla de inicio para entrar con ella.
export default function ResetPassword() {
  const [pw, setPw] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setErr('La contraseña tiene que tener al menos 6 caracteres.'); return; }
    setErr(''); setState('busy');
    try { await api.updatePassword(pw); await api.signOut(); setState('done'); }
    catch (ex) {
      const m = (ex as Error).message || '';
      setErr(/session|jwt|expired|missing/i.test(m) ? 'El link venció o ya se usó. Pedí uno nuevo desde la app con "¿Te olvidaste la contraseña?".' : m);
      setState('idle');
    }
  }

  return (
    <div className="center-page">
      <form className="login" onSubmit={submit}>
        <div className="logo">Plancito</div>
        {state === 'done' ? (
          <div className="sticker bg-lime"><h3>¡Listo!</h3><p className="small">Ya cambiaste tu contraseña. Cerrá esta página, abrí Plancito desde el ícono de tu pantalla de inicio y entrá con <b>Ya tengo cuenta</b>.</p></div>
        ) : <>
          <div><h2>Elegí una contraseña nueva</h2><p className="muted small">Después entrás con ella desde la app.</p></div>
          <div className="field" style={{ textAlign: 'left' }}><label htmlFor="npw">Contraseña nueva</label>
            <input id="npw" className="inp" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
          {err && <p className="err">{err}</p>}
          <button className="btn tomato full" disabled={state === 'busy'}>{state === 'busy' ? 'Guardando…' : 'Guardar contraseña'}</button>
        </>}
      </form>
    </div>
  );
}
