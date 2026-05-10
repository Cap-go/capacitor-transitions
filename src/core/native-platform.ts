import type { NativePlatform, NativePlatformInfo } from './types';

interface CapacitorRuntime {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
}

function getCapacitorRuntime(): CapacitorRuntime | undefined {
  return (globalThis as { Capacitor?: CapacitorRuntime }).Capacitor;
}

function normalizePlatform(platform: string | undefined): NativePlatform {
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }

  return 'unknown';
}

export function detectNativePlatform(): NativePlatformInfo {
  const capacitor = getCapacitorRuntime();
  const platform = normalizePlatform(capacitor?.getPlatform?.());
  const isNative = capacitor?.isNativePlatform?.() ?? (platform === 'ios' || platform === 'android');

  return {
    platform,
    isNative,
  };
}

export function isNativeBackSwipePlatform(): boolean {
  const { platform, isNative } = detectNativePlatform();

  return isNative && platform === 'ios';
}
