import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../services/usePWAInstall';
import {
  generateMobilePackage,
  MobilePackageConfig,
  triggerBlobDownload,
} from '../services/apkPackager';

interface PWAInstallButtonProps {
  theme?: 'dark' | 'light';
  onOpenMobileCenter?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  theme = 'dark',
  onOpenMobileCenter,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [downloadConfirm, setDownloadConfirm] = useState(false);
  const isLight = theme === 'light';

  const handleDirectApkDownload = async () => {
    if (isDownloadingApk) return;
    setIsDownloadingApk(true);
    setDownloadConfirm(false);
    try {
      const config: MobilePackageConfig = {
        appName: 'Sentinel AI Assistant',
        shortName: 'Sentinel',
        packageId: 'com.sentinel.security.app',
        versionName: '4.2.1',
        versionCode: 40201,
        displayMode: 'standalone',
        targetUrl:
          typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
        themeColor: '#020617',
        backgroundColor: '#020617',
        offlineCachingEnabled: true,
      };
      const artifact = await generateMobilePackage('apk_package', config);
      triggerBlobDownload(artifact.blob, artifact.filename);
      setDownloadConfirm(true);
      setTimeout(() => setDownloadConfirm(false), 3000);
    } finally {
      setIsDownloadingApk(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* Direct APK Download Button */}
        <button
          type="button"
          id="header-download-apk-btn"
          onClick={handleDirectApkDownload}
          disabled={isDownloadingApk}
          className="flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-bold shadow-cyan transition-colors whitespace-nowrap shrink-0"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>
            {isDownloadingApk
              ? 'Packing APK...'
              : downloadConfirm
              ? 'APK Downloaded'
              : 'Download APK'}
          </span>
        </button>

        {/* Native App Install Button (Chromium / Android WebAPK) */}
        {!isInstalled && isInstallable && (
          <button
            type="button"
            id="header-install-app-btn"
            onClick={install}
            className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span>Install App</span>
          </button>
        )}

        {/* iOS Guided Install Button */}
        {!isInstalled && !isInstallable && isIOS && (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Install on iOS</span>
          </button>
        )}

        {/* Mobile / APK Export Center Quick Link */}
        {onOpenMobileCenter && (
          <button
            type="button"
            onClick={onOpenMobileCenter}
            className={`hidden sm:flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>APK Options</span>
          </button>
        )}
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            <h3 className="text-base font-bold">Install Sentinel on iPhone / iPad</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
              2. Scroll down and select <strong>Add to Home Screen</strong>.<br />
              3. Launch from your home screen in standalone mode.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-400/40">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
      <span>Offline Mode — Cached security assets active</span>
    </div>
  );
};
