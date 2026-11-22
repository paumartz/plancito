// Crea la cuenta ya confirmada, sin mandar ningún mail de confirmación.
// Si el mail quedó registrado de antes sin confirmar (por ejemplo, de un intento anterior),
// lo confirma y le pone la contraseña nueva. Si la cuenta ya está confirmada, no la toca.
import { createClient } from '@supabase/supabase-js';

const json = (body: unknown, status = 200) => Response.json(body, { status });

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json({ error: 'not-configured' }, 501);

  let email = '', password = '';
  try { ({ email, password } = await req.json()); } catch { return json({ error: 'Datos inválidos' }, 400); }
  email = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Mail inválido' }, 400);
  if (String(password || '').length < 6) return json({ error: 'La contraseña tiene que tener al menos 6 caracteres' }, 400);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (!created.error) return json({ ok: true });

  if (!/already|registered|exists/i.test(created.error.message)) return json({ error: created.error.message }, 400);

  // Ya existe: buscarlo y, solo si nunca se confirmó, confirmarlo con esta contraseña.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return json({ error: error.message }, 500);
    const u = data.users.find((x) => (x.email || '').toLowerCase() === email);
    if (u) {
      if (u.email_confirmed_at) return json({ error: 'already-registered' }, 409);
      const up = await admin.auth.admin.updateUserById(u.id, { password, email_confirm: true });
      return up.error ? json({ error: up.error.message }, 500) : json({ ok: true });
    }
    if (data.users.length < 200) break;
  }
  return json({ error: 'already-registered' }, 409);
};
