# Plancito

Organizador de planes para grupos de amigos y parejas: proponer un plancito, votar cuándo y qué, recordatorios, cuentas claras con alias para pagar y zumbidos estilo MSN.

- `prototype/index.html`: el prototipo clickeable original (referencia de diseño y de reglas).
- `src/`: la app (React + TypeScript + Vite), instalable como web app (PWA) y lista para empaquetar con Capacitor.
- `supabase/migrations/`: el esquema de la base de datos.

## Probarla en tu compu

```bash
npm install
npm run dev
```

Sin configurar Supabase corre en **modo local**: los datos quedan en el navegador y el login no manda mails. Sirve para probar sola.

## Ponerla online (Supabase + Netlify)

### 1. Supabase (base de datos y login)
1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor → New query**, pegá el contenido de `supabase/migrations/0001_init.sql` y tocá **Run**. Después hacé lo mismo con `supabase/migrations/0002_regalito_push.sql` y con `supabase/migrations/0003_permisos.sql` (sin este último aparece "permission denied for table").
3. En **Authentication → URL Configuration**, poné como **Site URL** la dirección de Netlify (por ejemplo `https://plancito.netlify.app`) y agregala también en **Redirect URLs** como `https://plancito.netlify.app/**`.
4. **Mail con código** (para que en iPhone se pueda entrar desde la app de la pantalla de inicio): en **Authentication → Emails → Templates**, en las plantillas **Magic Link** y **Confirm signup**, reemplazá el contenido por el de `supabase/email/codigo.html` (muestra un código de 6 números en vez de un link). Asunto sugerido: `Tu código para entrar a Plancito`.
5. Copiá la **Project URL** (Project Settings → Data API, tiene la forma `https://xxxx.supabase.co`) y la **Publishable key** (Project Settings → API Keys, empieza con `sb_publishable_`; en proyectos viejos se llama *anon key*).

### 2. Netlify (publicación)
1. En [netlify.com](https://netlify.com): **Add new site → Import an existing project → GitHub** y elegí este repo.
2. La configuración de build ya está en `netlify.toml` (`npm run build`, carpeta `dist`).
3. En **Site configuration → Environment variables** agregá:
   - `VITE_SUPABASE_URL` = la Project URL
   - `VITE_SUPABASE_ANON_KEY` = la Publishable key (`sb_publishable_...`)
4. Volvé a desplegar. Cada cambio que se suba a la rama publicada se despliega solo.

### 3. Notificaciones push (zumbidos, recordatorios, deudas, cumples)
Las mandan dos funciones de Netlify: `notify` (al instante, cuando pasa algo) y `reminders` (todos los días a las 9).
1. Generá las claves en tu compu: `npx web-push generate-vapid-keys`.
2. En Netlify → **Environment variables** agregá:
   - `VITE_VAPID_PUBLIC_KEY` y `VAPID_PUBLIC_KEY` = la clave pública
   - `VAPID_PRIVATE_KEY` = la clave privada
   - `VAPID_SUBJECT` = `https://` + la dirección de tu sitio
   - `SUPABASE_SERVICE_ROLE_KEY` = en Supabase, **Project Settings → API Keys → Secret key** (`sb_secret_...`; en proyectos viejos, *service_role*). Es secreta: solo va en Netlify, nunca en la app ni en un chat
   - `NOTIFY_SECRET` = una clave inventada larga (por ejemplo, 30 letras y números al azar)
3. En Supabase → **SQL Editor**, conectá la base con la función (usá tu dirección y la misma clave secreta):
   ```sql
   update app_settings set value = 'https://TU-SITIO.netlify.app/.netlify/functions/notify' where key = 'notify_url';
   update app_settings set value = 'LA-MISMA-CLAVE-DE-NOTIFY_SECRET' where key = 'notify_secret';
   ```
4. Volvé a desplegar en Netlify. Cada persona activa las notificaciones desde su **Perfil**.

En iPhone las notificaciones funcionan solo si Plancito está agregado a la pantalla de inicio (Compartir → Agregar a inicio), con iOS 16.4 o más nuevo. En Android funcionan siempre y el zumbido vibra.

## Comandos
- `npm run dev`: servidor local
- `npm test`: tests de la lógica (votación, cuentas)
- `npm run build`: chequeo de tipos y build de producción

## Versión descargable (más adelante)
La misma app se empaqueta para App Store y Google Play con Capacitor:
```bash
npm run build
npx cap add ios
npx cap add android
npx cap sync
```
Requiere cuenta de Apple Developer (USD 99/año) y de Google Play (USD 25, un pago).

## Qué hay
Ya incluye: perfil y avatar, grupos con link de invitación, foto o ícono, gustos y lugares de siempre; proponer y votar en dos rondas; plan definido con recordatorios y Google Calendar; me bajo; gastos con alias y "ya pagué"; notificaciones con deudas primero; zumbidos; estrellitas y niveles; regalito (el cumpleañero no ve nada, lista de deseos o contacto, ideas con votación por mayoría, presupuesto en pesos con ajuste por inflación o en dólares, vaquita e historial); mapa con punto medio por barrio; notificaciones push.

Pendiente: guardar las fotos de grupo en el almacenamiento de Supabase (hoy van chiquitas dentro de la base) y la versión descargable con Capacitor.
