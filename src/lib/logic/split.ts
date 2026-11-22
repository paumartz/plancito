// Cuentas claras estilo Splitwise: solo pagan los involucrados en cada gasto.
export interface Expense { id: string; description: string; amount: number; paidBy: string; involved: string[] }
export interface Debt { from: string; to: string; amount: number }

export function balances(expenses: Expense[]): Record<string, number> {
  const b: Record<string, number> = {};
  for (const e of expenses) {
    if (!e.involved.length) continue;
    const share = e.amount / e.involved.length;
    b[e.paidBy] = (b[e.paidBy] || 0) + e.amount;
    for (const p of e.involved) b[p] = (b[p] || 0) - share;
  }
  return b;
}

/** Simplifica deudas: la menor cantidad de transferencias posible (greedy). */
export function settle(expenses: Expense[]): Debt[] {
  const b = balances(expenses);
  const cred: [string, number][] = [], deb: [string, number][] = [];
  for (const [k, v] of Object.entries(b)) {
    if (v > 0.5) cred.push([k, v]);
    else if (v < -0.5) deb.push([k, -v]);
  }
  cred.sort((x, y) => y[1] - x[1]);
  deb.sort((x, y) => y[1] - x[1]);
  const out: Debt[] = [];
  let i = 0, j = 0;
  while (i < deb.length && j < cred.length) {
    const amt = Math.min(deb[i][1], cred[j][1]);
    out.push({ from: deb[i][0], to: cred[j][0], amount: Math.round(amt) });
    deb[i][1] -= amt; cred[j][1] -= amt;
    if (deb[i][1] < 0.5) i++;
    if (cred[j][1] < 0.5) j++;
  }
  return out;
}
export const debtKey = (d: { from: string; to: string }) => `${d.from}>${d.to}`;
