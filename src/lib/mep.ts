// Dólar MEP promedio del mes (lo calcula la función usd-mep de Netlify).
export interface Mep { rate: number; month: string; days: number; last: string; source: string }

export async function fetchMep(): Promise<Mep | null> {
  try {
    const r = await fetch('/.netlify/functions/usd-mep');
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null;
    const j = await r.json();
    return typeof j.rate === 'number' && j.rate > 0 ? j : null;
  } catch { return null; }
}

export const monthName = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long' });
};
