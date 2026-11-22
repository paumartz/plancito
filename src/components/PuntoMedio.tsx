import { useState } from 'react';
import type { Profile } from '../data';

// Centro aproximado de cada barrio de CABA. Usamos el barrio (no la dirección) para calcular un punto medio.
export const BARRIOS: Record<string, [number, number]> = {
  'Almagro': [-58.420, -34.609], 'Balvanera': [-58.405, -34.608], 'Belgrano': [-58.457, -34.562], 'Boedo': [-58.416, -34.630],
  'Caballito': [-58.441, -34.618], 'Chacarita': [-58.455, -34.588], 'Colegiales': [-58.449, -34.574], 'Flores': [-58.463, -34.628],
  'Núñez': [-58.462, -34.545], 'Palermo': [-58.425, -34.580], 'Recoleta': [-58.394, -34.588], 'San Telmo': [-58.372, -34.621],
  'Villa Crespo': [-58.440, -34.598], 'Villa Urquiza': [-58.487, -34.573], 'Saavedra': [-58.483, -34.553], 'Villa Devoto': [-58.513, -34.601],
  'Parque Patricios': [-58.403, -34.637], 'Barracas': [-58.383, -34.646], 'La Boca': [-58.363, -34.635], 'Puerto Madero': [-58.363, -34.610],
  'Monserrat': [-58.382, -34.612], 'San Nicolás': [-58.384, -34.603], 'Retiro': [-58.378, -34.592], 'Villa Ortúzar': [-58.468, -34.580],
};
const CABA: [number, number][] = [[-58.53, -34.62], [-58.50, -34.55], [-58.46, -34.535], [-58.40, -34.56], [-58.37, -34.58], [-58.335, -34.60], [-58.35, -34.64], [-58.39, -34.66], [-58.42, -34.70], [-58.46, -34.68], [-58.50, -34.66]];
const proj = ([lon, lat]: [number, number]): [number, number] => [((lon + 58.54) / 0.22) * 320, ((-34.525 - lat) / 0.185) * 200];

export function midpoint(people: Profile[]): [number, number] | null {
  const pts = people.map((p) => (p.barrio ? BARRIOS[p.barrio] : undefined)).filter(Boolean) as [number, number][];
  if (!pts.length) return null;
  return [pts.reduce((a, b) => a + b[0], 0) / pts.length, pts.reduce((a, b) => a + b[1], 0) / pts.length];
}
const nearest = (pt: [number, number]) => Object.entries(BARRIOS).sort((a, b) => Math.hypot(a[1][0] - pt[0], a[1][1] - pt[1]) - Math.hypot(b[1][0] - pt[0], b[1][1] - pt[1]))[0][0];

/** Botones que abren Google Maps con la búsqueda hecha (opcionalmente, los mejor valorados). */
function Searches({ barrio, center, focus, good, setGood }: { barrio: string; center: [number, number]; focus?: string; good: boolean; setGood: (v: boolean) => void }) {
  const gm = (q: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${q}${good ? ' mejor valorados' : ''} en ${barrio}, CABA`)}/@${center[1].toFixed(4)},${center[0].toFixed(4)},15z`;
  const searches = focus ? [focus] : ['cafés', 'restos', 'bares', 'plazas'];
  return <>
    <p className="small muted" style={{ marginBottom: -4 }}>Buscar en {barrio}, en Google Maps:</p>
    <div className="row wrap" style={{ gap: 7 }}>{searches.map((q) => <a key={q} className="vchip" href={gm(q)} target="_blank" rel="noopener">{q.charAt(0).toUpperCase() + q.slice(1)}</a>)}</div>
    <label className="check" style={{ alignSelf: 'flex-start' }}><input type="checkbox" checked={good} onChange={(e) => setGood(e.target.checked)} /> Solo los mejor valorados</label>
  </>;
}

/**
 * Punto de encuentro:
 * - si todos son del mismo barrio, busca directo ahí;
 * - si son de barrios distintos, se elige: juntarse en el barrio de alguien o calcular un punto medio.
 */
export default function PuntoMedio({ people, focus }: { people: Profile[]; focus?: string }) {
  const [choice, setChoice] = useState<string>('');
  const [good, setGood] = useState(true);
  const located = people.filter((p) => p.barrio && BARRIOS[p.barrio]);
  if (!located.length) return <div className="empty">Carguen su barrio en el perfil para encontrar dónde juntarse.</div>;
  const barrios = [...new Set(located.map((p) => p.barrio!))];

  if (barrios.length === 1) return (
    <div className="card tight">
      <p className="small">Todos son de <b>{barrios[0]}</b>. ¿Qué buscan?</p>
      <Searches barrio={barrios[0]} center={BARRIOS[barrios[0]]} focus={focus} good={good} setGood={setGood} />
    </div>
  );

  const mid = midpoint(located)!, [mx, my] = proj(mid), near = nearest(mid);
  const whoIn = (b: string) => located.filter((p) => p.barrio === b).map((p) => p.nick || p.name).join(', ');
  return (
    <div className="card tight">
      <p className="small" style={{ fontWeight: 700 }}>¿Dónde se juntan?</p>
      <div className="row wrap" style={{ gap: 7 }}>
        {barrios.map((b) => <button key={b} className={choice === b ? 'vchip on' : 'vchip'} onClick={() => setChoice(b)}>En {b} <span className="small" style={{ opacity: .7 }}>({whoIn(b)})</span></button>)}
        <button className={choice === 'medio' ? 'vchip on' : 'vchip'} onClick={() => setChoice('medio')}>Buscar un punto medio</button>
      </div>
      {choice === 'medio' && <>
        <svg className="map" viewBox="0 0 320 200" role="img" aria-label={`Mapa de CABA: el punto medio queda cerca de ${near}`}>
          <path d={'M' + CABA.map(proj).map((x) => x.map((n) => n.toFixed(1)).join(' ')).join(' L') + ' Z'} fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
          <text x="304" y="44" textAnchor="end" fontSize="10" fill="var(--ink-2)">Río de la Plata</text>
          {located.map((p) => { const [x, y] = proj(BARRIOS[p.barrio!]); return <line key={'l' + p.id} x1={x} y1={y} x2={mx} y2={my} stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 3" />; })}
          {located.map((p) => { const [x, y] = proj(BARRIOS[p.barrio!]); return <g key={p.id}><circle cx={x} cy={y} r="9" fill="var(--lilac)" stroke="#2A1F1D" strokeWidth="1.5" />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2A1F1D">{(p.nick || p.name || '?').charAt(0).toUpperCase()}</text></g>; })}
          <path d={`M${mx} ${my - 11} l3.2 6.8 7.4 .8 -5.6 5 1.6 7.4 -6.6 -3.9 -6.6 3.9 1.6 -7.4 -5.6 -5 7.4 -.8z`} fill="#FFD166" stroke="#2A1F1D" strokeWidth="1.5" />
        </svg>
        <p className="small">El punto medio queda cerca de <b>{near}</b>.</p>
        <Searches barrio={near} center={mid} focus={focus} good={good} setGood={setGood} />
      </>}
      {choice && choice !== 'medio' && <Searches barrio={choice} center={BARRIOS[choice]} focus={focus} good={good} setGood={setGood} />}
    </div>
  );
}
