// Para la versión descargable (App Store / Google Play) más adelante:
//   npm run build && npx cap add ios && npx cap add android && npx cap sync
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.plancito',
  appName: 'Plancito',
  webDir: 'dist',
};

export default config;
