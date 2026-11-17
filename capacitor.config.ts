import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.sentinelx.security.app',
  appName: 'Sentinel-X',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
