import { useState } from 'react';
import { cap, iso, today } from '../lib/logic/dates';

const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Mini calendario para elegir días (hasta 3 meses para adelante).
 * "marks" agrega un puntito o un texto chiquito a ciertos días (por ejemplo, quién no está).
 */
export default function MiniCalendar({ selected, onToggle, multi = true, months = 3, marks = {} }: {
  selected: string[]; onToggle: (day: string) => void; multi?: boolean; months?: number; marks?: Record<string, string>;
}) {
  const t = today();
  const [offset, setOffset] = useState(0);
  const first = new Date(t.getFullYear(), t.getMonth() + offset, 1);
  const startPad = (first.getDay() + 6) % 7; // lunes primero
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);
  const last = new Date(t.getFullYear(), t.getMonth() + months, t.getDate());

  return (
    <div className="mcal">
      <div className="row between">
        <button type="button" className="back" style={{ width: 32, height: 32 }} disabled={offset === 0} onClick={() => setOffset(offset - 1)} aria-label="Mes anterior">‹</button>
        <b>{cap(first.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }))}</b>
        <button type="button" className="back" style={{ width: 32, height: 32 }} disabled={offset >= months - 1} onClick={() => setOffset(offset + 1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="mcal-grid">
        {WD.map((d, i) => <span key={'h' + i} className="mcal-h">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const id = iso(d), past = d <= t, beyond = d > last, on = selected.includes(id), we = d.getDay() === 0 || d.getDay() === 6 || d.getDay() === 5;
          return <button type="button" key={id} disabled={past || beyond} aria-pressed={on} title={marks[id] || undefined}
            className={`mcal-d ${on ? 'on' : ''} ${we ? 'we' : ''} ${marks[id] ? 'mk' : ''}`} onClick={() => onToggle(id)}>{d.getDate()}</button>;
        })}
      </div>
      <p className="small muted">{multi ? 'Tocá todos los días que quieras poner a votación.' : 'Tocá el día que proponés.'} Los viernes, sábados y domingos están resaltados.</p>
    </div>
  );
}
