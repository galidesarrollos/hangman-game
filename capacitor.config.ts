import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ahorcado.juego',
  appName: 'Juego de ahorcado',
  webDir: 'www',
  android: {
    adjustMarginsForEdgeToEdge: 'auto'
  }
};

export default config;
