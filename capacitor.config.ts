import type { CapacitorConfig } from '@capacitor/cli';

// Aaria's Blue Elephant Games — one hybrid app for Android, Fire tablets
// (Amazon Appstore takes the same Android build), and iOS.
// The whole site + all games are BUNDLED (offline-first, Kids-Category safe);
// the app opens straight on the /games launcher via the snippet in index.html.
const config: CapacitorConfig = {
  appId: 'org.aariasblueelephant.games',
  appName: "Aaria's Games",
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
  },
  server: {
    // serve bundled assets from a stable local origin so localStorage
    // (saves, passport, profiles) persists across app updates
    androidScheme: 'https',
  },
};

export default config;
