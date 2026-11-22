export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);

export const fmtDay = (s: string, o: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  parseISO(s).toLocaleDateString('es-AR', o).replace(/\./g, '');

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface DayOption { id: string; date: string; label: string; phrase: string }

export const dayOption = (s: string): DayOption => ({ id: s, date: s, label: cap(fmtDay(s)), phrase: 'el ' + fmtDay(s, { weekday: 'long', day: 'numeric' }) });

/** Próximos viernes, sábados y domingos a partir de mañana. */
export function upcomingDays(from: Date = today(), n = 5): DayOption[] {
  const out: DayOption[] = [];
  const d = new Date(from);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w === 5 || w === 6 || w === 0) {
      const s = iso(d);
      out.push({ id: s, date: s, label: cap(fmtDay(s)), phrase: 'el ' + fmtDay(s, { weekday: 'long', day: 'numeric' }) });
    }
  }
  return out;
}

export const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
