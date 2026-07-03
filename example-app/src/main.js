import './style.css';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import '@capgo/capacitor-transitions';
import { initCapTransitions, detectPlatform } from '@capgo/capacitor-transitions';

initCapTransitions({ platform: 'auto' });
document.getElementById('platform').textContent = `Resolved transition platform: ${detectPlatform()}`;

if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch((error) => console.error('Capgo notifyAppReady failed', error));
}
