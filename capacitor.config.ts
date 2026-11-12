import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bestiariodelendas.app',
  appName: 'Bestiário de Lendas',
  webDir: 'dist',
  backgroundColor: '#0c0a09',
  android: {
    backgroundColor: '#0c0a09',
    allowMixedContent: true
  }
};

export default config;
