import { useState } from 'react';
import { api, type Group, type Plan } from '../data';
import { useStore } from '../store';
import { Av, Sheet } from './ui';

const CAR_COLORS = ['#F6B5C6', '#BCD7EA', '#D7EEA4', '#F5BE92', '#D3C4F6'];

/** "¿Cómo llegamos?": autos con lugares libres para ir juntos. */
export default function Rides({ p, g, att }: { p: Plan; g: Group; att: string[] }) {
  const { rides, userId, profiles, nick, toast, reload } = useStore();
  const me = userId!;
  const [offering, setOffering] = useState(false);
  const list = rides.filter((r) => r.planId === p.id);
  const myCar = list.find((r) => r.driver === me), myRide = list.find((r) => r.riders.includes(me));
  const run = (fn: () => Promise<unknown>, ok: string) => fn().then(async () => { await reload(); toast(ok); }).catch((e) => toast('No se pudo: ' + (e as Error).message));
  const covered = new Set(list.flatMap((r) => [r.driver, ...r.riders]));
  const walking = att.filter((x) => !covered.has(x));

  return <section className="sec">
    <div className="sec-h"><h2>¿Cómo llegamos?</h2>{!myCar && <button className="link" onClick={() => setOffering(true)}>Yo voy en auto</button>}</div>
    {list.length ? list.map((r, i) => {
      const free = r.seats - r.riders.length, mine = r.driver === me, inIt = r.riders.includes(me);
      return <div key={r.id} className="card tight ride">
        <div className="car" style={{ ['--car' as string]: CAR_COLORS[i % CAR_COLORS.length] }}>
          <div className="car-cabin">
            <span className="seat driver"><Av p={profiles[r.driver]} size={40} /><small>maneja</small></span>
            {r.riders.map((u) => <span key={u} className="seat"><Av p={profiles[u]} size={40} /><small>{nick(u)}</small></span>)}
            {Array.from({ length: Math.max(0, free) }, (_, k) => <span key={'f' + k} className="seat"><span className="seat-free">libre</span><small>&nbsp;</small></span>)}
          </div>
          <div className="car-body"><span className="light" /><span className="wheel l" /><span className="wheel r" /></div>
        </div>
        <div className="row between wrap">
          <p className="small"><b>{mine ? 'Tu auto' : `Auto de ${nick(r.driver)}`}</b> · {free > 0 ? `${free} ${free === 1 ? 'lugar libre' : 'lugares libres'}` : 'lleno'}</p>
          {mine ? <button className="btn sm ghost" onClick={() => run(() => api.deleteRide(r.id), 'Listo, ya no llevás auto')}>Ya no llevo auto</button>
            : inIt ? <button className="btn sm ghost" onClick={() => run(() => api.leaveRide(r.id), 'Te bajaste del auto')}>Bajarme</button>
            : free > 0 && !myCar && !myRide ? <button className="btn sm" onClick={() => run(() => api.joinRide(r.id), `¡Vas con ${nick(r.driver)}!`)}>Sumarme</button> : null}
        </div>
      </div>; })
      : <button className="empty" style={{ width: '100%' }} onClick={() => setOffering(true)}>¿Alguien va en auto? Ofrecé lugares y el resto se suma.</button>}
    {list.length > 0 && walking.length > 0 && <p className="small muted">Van por su cuenta: {walking.map(nick).join(', ')}</p>}
    {offering && <OfferSheet onClose={() => setOffering(false)} onSave={(seats) => run(() => api.addRide(p.id, seats), '¡Auto listo! El grupo ya puede sumarse').then(() => setOffering(false))} max={Math.max(1, Math.min(6, att.length - 1))} groupName={g.name} />}
  </section>;
}

function OfferSheet({ onClose, onSave, max }: { onClose: () => void; onSave: (seats: number) => void; max: number; groupName: string }) {
  const [seats, setSeats] = useState(Math.min(3, max));
  return <Sheet onClose={onClose}>
    <h2>Yo voy en auto</h2><p className="small muted">¿Cuántos lugares libres tenés? Los demás se suman hasta que se llene.</p>
    <div className="row wrap" style={{ gap: 7 }}>{Array.from({ length: max }, (_, i) => i + 1).map((n) =>
      <button key={n} className={seats === n ? 'vchip on' : 'vchip'} onClick={() => setSeats(n)}>{n} {n === 1 ? 'lugar' : 'lugares'}</button>)}</div>
    <button className="btn tomato full" onClick={() => onSave(seats)}>Ofrecer {seats} {seats === 1 ? 'lugar' : 'lugares'}</button>
  </Sheet>;
}
