import type { CapacitorConfig } from '@capacitor/cli';

import pkg from './package.json';

const config: CapacitorConfig = {
  appId: 'app.capgo.capacitor.transitions',
  appName: 'Capgo Transitions',
  webDir: 'examples/react-app/dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    CapacitorUpdater: {
      autoSplashscreen: true,
      directUpdate: 'atInstall',
      version: pkg.version,
    },
  },
};

export default config;
