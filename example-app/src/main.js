/* eslint-env browser */
import './style.css';
import { Capacitor } from '@capacitor/core';
import { initCapTransitions, detectPlatform } from '@capgo/capacitor-transitions';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

initCapTransitions({ platform: 'auto' });
document.getElementById('platform').textContent = `Resolved transition platform: ${detectPlatform()}`;

if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch((error) => console.error('Capgo notifyAppReady failed', error));
}
