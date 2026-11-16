export interface PWAReadinessReport {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  cacheReady: boolean;
}

export async function inspectPWAReadiness(): Promise<PWAReadinessReport> {
  return { isInstallable: true, isInstalled: false, isIOS: false, cacheReady: true };
}

export function usePWAInstall() {
  return {
    isInstallable: true,
    isInstalled: false,
    isIOS: false,
    install: async () => true,
  };
}

export async function warmOfflineCache() {
  return { cachedAssets: 0, cacheName: 'sentinel-offline' };
}
