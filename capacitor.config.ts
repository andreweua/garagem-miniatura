import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.garagemminiatura.app',
  appName: 'Garagem em Miniatura',
  webDir: 'dist',
  server: {
    // Atualizações Live Over-The-Air (OTA) automáticas via GitHub Pages
    url: 'https://andreweua.github.io/garagem-miniatura/',
    androidScheme: 'https',
    cleartext: false
  }
};

export default config;
