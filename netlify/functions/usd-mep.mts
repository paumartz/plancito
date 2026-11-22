// Dólar MEP promedio del mes en curso (precio de venta), desde la API pública de ArgentinaDatos.
// Si el mes recién empieza y no hay datos, usa el mes anterior.
interface Row { fecha: string; compra: number; venta: number }

export default async () => {
  try {
    const r = await fetch('https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa');
    if (!r.ok) throw new Error('ArgentinaDatos respondió ' + r.status);
    const data = (await r.json()) as Row[];
    const ar = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let month = ym(ar);
    let rows = data.filter((x) => x.fecha.startsWith(month) && x.venta > 0);
    if (!rows.length) {
      const prev = new Date(ar.getFullYear(), ar.getMonth() - 1, 1);
      month = ym(prev);
      rows = data.filter((x) => x.fecha.startsWith(month) && x.venta > 0);
    }
    if (!rows.length) throw new Error('Sin datos del MEP');
    const rate = Math.round(rows.reduce((s, x) => s + x.venta, 0) / rows.length);
    return Response.json(
      { rate, month, days: rows.length, last: rows[rows.length - 1].fecha, source: 'ArgentinaDatos' },
      { headers: { 'cache-control': 'public, max-age=21600' } },
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
};
