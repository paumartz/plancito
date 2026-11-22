// Reglas del regalito: cumpleaños, mayoría, presupuesto y vaquita.
import { iso, parseISO } from './dates';

/** Próximo cumpleaños (hoy cuenta como próximo). */
export function nextBirthday(birthday: string, from: Date): Date {
  const b = parseISO(birthday);
  const n = new Date(from.getFullYear(), b.getMonth(), b.getDate());
  if (n < from) n.setFullYear(n.getFullYear() + 1);
  return n;
}
export const daysToBirthday = (birthday: string, from: Date) => Math.round((nextBirthday(birthday, from).getTime() - from.getTime()) / 864e5);

/** Cuántos votos hacen falta para que algo se apruebe por mayoría. */
export const majority = (voters: number) => Math.floor(voters / 2) + 1;

/** Presupuesto llevado a pesos para comparar con los precios. */
export const budgetARS = (amount: number, mode: 'ars' | 'usd', usdRate: number) => (mode === 'usd' ? amount * usdRate : amount);
export const fmtBudget = (amount: number, mode: 'ars' | 'usd') =>
  mode === 'usd' ? 'US$ ' + Math.round(amount).toLocaleString('es-AR') : '$' + Math.round(amount).toLocaleString('es-AR');

/** Monto actualizado por inflación, redondeado a miles. */
export const adjustForInflation = (amount: number, pct: number) => Math.round((amount * (1 + pct / 100)) / 1000) * 1000;

/** Lo que pone cada uno (el que compró también pone su parte). */
export const shareOf = (cost: number, contributors: number) => (contributors ? Math.round(cost / contributors) : 0);

/**
 * Inflación acumulada (IPC nacional del INDEC) desde un mes hasta el último dato publicado.
 * Usa la API pública de series de tiempo de datos.gob.ar. Si no responde, devuelve null
 * y la app pide el porcentaje a mano.
 */
export async function fetchInflationSince(sinceISO: string): Promise<number | null> {
  try {
    const url = 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&format=json&limit=5000&start_date=' + sinceISO.slice(0, 7) + '-01';
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const data: [string, number][] = j.data || [];
    if (data.length < 2) return null;
    const first = data[0][1], last = data[data.length - 1][1];
    return Math.round(((last / first) - 1) * 1000) / 10;
  } catch { return null; }
}

export const todayISO = () => iso(new Date());
