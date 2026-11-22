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
2. En **SQL Editor → New query**, pegá el contenido de `supabase/migrations/0001_init.sql` y tocá **Run**.
3. En **Authentication → URL Configuration**, poné como **Site URL** la dirección de Netlify (por ejemplo `https://plancito.netlify.app`) y agregala también en **Redirect URLs** como `https://plancito.netlify.app/**`.
4. En **Project Settings → API** copiá la **Project URL** y la **anon public key**.

### 2. Netlify (publicación)
1. En [netlify.com](https://netlify.com): **Add new site → Import an existing project → GitHub** y elegí este repo.
2. La configuración de build ya está en `netlify.toml` (`npm run build`, carpeta `dist`).
3. En **Site configuration → Environment variables** agregá:
   - `VITE_SUPABASE_URL` = la Project URL
   - `VITE_SUPABASE_ANON_KEY` = la anon public key
4. Volvé a desplegar. Cada cambio que se suba a la rama publicada se despliega solo.

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

## Etapas
1. **Etapa 1 (esta):** perfil y avatar, grupos con link de invitación, proponer y votar en dos rondas, plan definido con recordatorios y Google Calendar, me bajo, gastos con alias y "ya pagué", notificaciones con deudas primero, zumbidos, estrellitas y niveles.
2. **Etapa 2:** regalito (cumpleaños, vaquita, lista de deseos), mapa con punto medio, notificaciones push.
3. **Etapa 3:** presupuesto en dólares o ajustado por inflación, más personalización.
