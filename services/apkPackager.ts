export type PackageTargetFormat =
  | 'apk_package'
  | 'twa_bundle'
  | 'capacitor_bundle'
  | 'icon_pack';

export interface MobilePackageConfig {
  appName: string;
  shortName: string;
  packageId: string;
  versionName: string;
  versionCode: number;
  displayMode: 'standalone' | 'fullscreen' | 'minimal-ui';
  targetUrl: string;
  themeColor: string;
  backgroundColor: string;
  offlineCachingEnabled: boolean;
}

export interface GeneratedPackageArtifact {
  filename: string;
  blob: Blob;
  sha256: string;
}

export interface PWAReadinessReport {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  cacheReady: boolean;
}

export async function generateMobilePackage(
  _format: PackageTargetFormat,
  _config: MobilePackageConfig,
  onStage?: (stage: string) => void,
): Promise<GeneratedPackageArtifact> {
  onStage?.('Preparing package artifacts...');
  const blob = new Blob(['{}'], { type: 'application/json' });
  return {
    filename: 'sentinel-ai-package.zip',
    blob,
    sha256: 'stub-sha256',
  };
}

export { triggerBlobDownload } from '../apkPackager';
