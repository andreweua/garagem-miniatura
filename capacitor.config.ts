import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.garagemminiatura.app',
  appName: 'Garagem em Miniatura',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
