import React, { useEffect, useMemo, useState } from 'react';
import {
  AndroidEcosystem,
  AndroidSystemPatch,
  PatchSeverity,
  PatchStatus,
} from '../types';
import {
  androidPatchScanner,
  AndroidPatchScannerSnapshot,
} from '../services/androidPatchScanner';
import {
  GeneratedPackageArtifact,
  MobilePackageConfig,
  PackageTargetFormat,
  generateMobilePackage,
  triggerBlobDownload,
} from '../services/apkPackager';
import {
  inspectPWAReadiness,
  PWAReadinessReport,
  usePWAInstall,
  warmOfflineCache,
} from '../services/usePWAInstall';
import InboundCommsMonitor from './InboundCommsMonitor';
import SimSwitchLockPanel from './SimSwitchLockPanel';

export type MobileCenterSection = 'patches' | 'comms' | 'sim_lock' | 'apk';

interface MobileCenterProps {
  theme?: 'dark' | 'light';
  stealthMode?: boolean;
  defaultSection?: MobileCenterSection;
}

export const MobileCenter: React.FC<MobileCenterProps> = ({
  theme = 'dark',
  stealthMode = false,
  defaultSection = 'patches',
}) => {
  const isLight = theme === 'light';
  const [activeSection, setActiveSection] = useState<MobileCenterSection>(defaultSection);

  useEffect(() => {
    setActiveSection(defaultSection);
  }, [defaultSection]);

  // ---------------------------------------------------------------------------
  // 1. Android System Patches & Updates Scanner State
  // ---------------------------------------------------------------------------
  const [scanner, setScanner] = useState<AndroidPatchScannerSnapshot>(() =>
    androidPatchScanner.getSnapshot()
  );
  const [patchStatusFilter, setPatchStatusFilter] = useState<'ALL' | 'PENDING' | 'INSTALLED'>('ALL');
  const [patchSeverityFilter, setPatchSeverityFilter] = useState<'ALL' | PatchSeverity>('ALL');
  const [expandedPatchId, setExpandedPatchId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = androidPatchScanner.subscribe(setScanner);
    return () => unsub();
  }, []);

  const ecosystemPatches = useMemo(() => {
    return scanner.patches.filter(p => p.ecosystem === scanner.profile.ecosystem);
  }, [scanner.patches, scanner.profile.ecosystem]);

  const filteredPatches = useMemo(() => {
    return ecosystemPatches.filter(p => {
      if (patchStatusFilter === 'PENDING' && p.status === 'INSTALLED') return false;
      if (patchStatusFilter === 'INSTALLED' && p.status !== 'INSTALLED') return false;
      if (patchSeverityFilter !== 'ALL' && p.severity !== patchSeverityFilter) return false;
      return true;
    });
  }, [ecosystemPatches, patchStatusFilter, patchSeverityFilter]);

  const patchCounts = useMemo(() => {
    const pending = ecosystemPatches.filter(p => p.status !== 'INSTALLED');
    const critical = pending.filter(p => p.severity === 'CRITICAL');
    const verified = pending.filter(p => p.status === 'VERIFIED');
    const installed = ecosystemPatches.filter(p => p.status === 'INSTALLED');
    return {
      total: ecosystemPatches.length,
      pending: pending.length,
      critical: critical.length,
      verified: verified.length,
      installed: installed.length,
    };
  }, [ecosystemPatches]);

  const handleExportPatchAudit = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      deviceProfile: scanner.profile,
      summary: patchCounts,
      patches: ecosystemPatches,
      recentScans: scanner.scanHistory,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    triggerBlobDownload(
      blob,
      `sentinel-android-patch-audit-${scanner.profile.ecosystem}.json`
    );
  };

  // ---------------------------------------------------------------------------
  // 2. APK & Offline PWA Install Center State
  // ---------------------------------------------------------------------------
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [readiness, setReadiness] = useState<PWAReadinessReport | null>(null);
  const [isWarmingCache, setIsWarmingCache] = useState(false);
  const [cacheWarmMessage, setCacheWarmMessage] = useState<string | null>(null);
  const [iconPreviewShape, setIconPreviewShape] = useState<'circle' | 'squircle' | 'splash'>('squircle');

  const [pkgConfig, setPkgConfig] = useState<MobilePackageConfig>(() => ({
    appName: 'Sentinel AI Assistant',
    shortName: 'Sentinel',
    packageId: 'com.sentinel.security.app',
    versionName: '4.2.1',
    versionCode: 40201,
    displayMode: 'standalone',
    targetUrl: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
    themeColor: '#020617',
    backgroundColor: '#020617',
    offlineCachingEnabled: true,
  }));

  const [isBuildingPkg, setIsBuildingPkg] = useState(false);
  const [buildProgressLabel, setBuildProgressLabel] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildHistory, setBuildHistory] = useState<GeneratedPackageArtifact[]>([]);
  const [copiedShaId, setCopiedShaId] = useState<string | null>(null);
  const [showIosGuideModal, setShowIosGuideModal] = useState(false);

  const packageIdValid = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(pkgConfig.packageId);
  const shortNameValid = pkgConfig.shortName.trim().length > 0 && pkgConfig.shortName.trim().length <= 12;
  const versionCodeValid = Number.isInteger(pkgConfig.versionCode) && pkgConfig.versionCode > 0;
  const formValid = packageIdValid && shortNameValid && versionCodeValid && pkgConfig.appName.trim().length > 0;

  const refreshReadiness = async () => {
    const report = await inspectPWAReadiness();
    setReadiness(report);
  };

  useEffect(() => {
    if (activeSection === 'apk') {
      refreshReadiness();
    }
  }, [activeSection]);

  const handleWarmCache = async () => {
    setIsWarmingCache(true);
    setCacheWarmMessage(null);
    try {
      const res = await warmOfflineCache();
      await refreshReadiness();
      setCacheWarmMessage(
        `Cached ${res.cachedAssets} core assets into ${res.cacheName} for offline launch.`
      );
    } finally {
      setIsWarmingCache(false);
    }
  };

  const handleDownloadPackage = async (format: PackageTargetFormat) => {
    if (!formValid || isBuildingPkg) return;
    setIsBuildingPkg(true);
    setBuildError(null);
    setBuildProgressLabel('Initializing package builder...');

    try {
      const artifact = await generateMobilePackage(format, pkgConfig, stage =>
        setBuildProgressLabel(stage)
      );
      setBuildHistory(prev => [artifact, ...prev].slice(0, 8));
      triggerBlobDownload(artifact.blob, artifact.filename);
      setBuildProgressLabel(`Downloaded ${artifact.filename}`);
    } catch (err) {
      setBuildError(
        err instanceof Error ? err.message : 'Unable to assemble Android package archive.'
      );
    } finally {
      setIsBuildingPkg(false);
    }
  };

  const handleCopySha = (id: string, sha: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sha).catch(() => {});
      setCopiedShaId(id);
      setTimeout(() => setCopiedShaId(null), 2000);
    }
  };

  const cardBase = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/60 border-slate-800 text-slate-100';

  const inputBase = isLight
    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
    : 'bg-slate-950/70 border-slate-700 text-slate-100 focus:border-cyan-500';

  const getSeverityBadge = (sev: PatchSeverity) => {
    if (sev === 'CRITICAL') return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (sev === 'HIGH') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
  };

  const getPatchStatusBadge = (status: PatchStatus) => {
    if (status === 'INSTALLED') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (status === 'VERIFIED') return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    if (status === 'DOWNLOADING') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Top Section Header & Segmented Switcher */}
      <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${cardBase}`}>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {stealthMode ? 'MOBILE DEVICE CENTER' : 'Mobile Center & Android Operations'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated Android patch scanning, incoming call & SMS screening, offline PWA installation, and APK packaging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSection('patches')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeSection === 'patches'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>System Patches & Updates</span>
            {patchCounts.critical > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-mono tabular-nums">
                {patchCounts.critical}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('comms')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'comms'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Messages & Phone Calls
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('sim_lock')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'sim_lock'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SIM Switch Lock
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('apk')}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'apk'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            APK & Offline Install
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ANDROID SYSTEM PATCHES & UPDATES AUTO-SCANNER                */}
      {/* =================================================================== */}
      {activeSection === 'patches' && (
        <div className="space-y-6">
          {/* Continuous Background Polling & Voice Alert Bar */}
          <div className={`rounded-2xl border p-5 space-y-4 ${cardBase}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base font-bold">
                    Automated Android Security Patch Scanner
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-cyan-400">
                    {scanner.isScanning
                      ? 'Polling OEM & AOSP channels...'
                      : scanner.autoPollEnabled
                      ? `Next auto-scan in ${scanner.nextScanCountdownSec}s`
                      : 'Auto-poll paused'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Continuously polls AOSP Security Bulletins, Google Play System (Mainline), Vendor Firmware, and Kernel/Baseband feeds. Last check: <span className="font-mono tabular-nums">{scanner.lastScanTimestamp}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => androidPatchScanner.scanNow()}
                  disabled={scanner.isScanning}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                >
                  {scanner.isScanning ? 'Scanning...' : 'Scan Now'}
                </button>

                <button
                  type="button"
                  onClick={() => androidPatchScanner.testCriticalVoiceAlert()}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isLight
                      ? 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800'
                      : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  Test Voice Alert
                </button>

                <button
                  type="button"
                  onClick={handleExportPatchAudit}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isLight
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Export Report
                </button>
              </div>
            </div>

            {/* Polling Interval & Voice Alert Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => androidPatchScanner.toggleAutoPoll()}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                  scanner.autoPollEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>Background Auto-Polling</span>
                <span className="font-mono">{scanner.autoPollEnabled ? 'ACTIVE' : 'PAUSED'}</span>
              </button>

              <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">Poll Cadence</span>
                <div className="flex items-center gap-1">
                  {([15, 30, 60] as const).map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => androidPatchScanner.setPollInterval(sec)}
                      className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                        scanner.pollIntervalSec === sec
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => androidPatchScanner.toggleVoiceAlerts()}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                  scanner.voiceAlertsEnabled
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>Critical Patch Voice Alerts</span>
                <span className="font-mono">{scanner.voiceAlertsEnabled ? 'VOICE ON' : 'MUTED'}</span>
              </button>
            </div>
          </div>

          {/* Device Ecosystem & Browser Telemetry Profile */}
          <div className={`rounded-2xl border p-5 space-y-4 ${cardBase}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Target Android Device Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browser telemetry: <span className="font-mono">{scanner.profile.detectedBrowserOs}</span> · <span className="font-mono">{scanner.profile.detectedWebViewVersion}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['pixel', 'samsung', 'aosp'] as AndroidEcosystem[]).map(eco => (
                  <button
                    key={eco}
                    type="button"
                    onClick={() => androidPatchScanner.setEcosystem(eco)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      scanner.profile.ecosystem === eco
                        ? 'bg-cyan-600 text-white'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {eco === 'pixel'
                      ? 'Google Pixel'
                      : eco === 'samsung'
                      ? 'Samsung Galaxy'
                      : 'AOSP / Custom ROM'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => androidPatchScanner.redetectDeviceHints()}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-cyan-400 whitespace-nowrap"
                >
                  Re-detect
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Device Model
                </label>
                <input
                  type="text"
                  value={scanner.profile.modelName}
                  onChange={e =>
                    androidPatchScanner.updateProfile({ modelName: e.target.value })
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none ${inputBase}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Android Version
                </label>
                <input
                  type="text"
                  value={scanner.profile.osVersion}
                  onChange={e =>
                    androidPatchScanner.updateProfile({ osVersion: e.target.value })
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none ${inputBase}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Installed Security Patch Level (SPL)
                </label>
                <input
                  type="text"
                  value={scanner.profile.currentSecurityPatchLevel}
                  onChange={e =>
                    androidPatchScanner.updateProfile({
                      currentSecurityPatchLevel: e.target.value,
                    })
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-mono tabular-nums focus:outline-none ${inputBase}`}
                />
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-2xl border p-4 ${cardBase}`}>
              <span className="text-xs text-slate-500">Current Patch Level</span>
              <p className="text-lg font-bold font-mono tabular-nums mt-1 text-cyan-400">
                {scanner.profile.currentSecurityPatchLevel}
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${cardBase}`}>
              <span className="text-xs text-slate-500">Critical Pending CVEs</span>
              <p className="text-lg font-bold font-mono tabular-nums mt-1 text-rose-400">
                {patchCounts.critical}
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${cardBase}`}>
              <span className="text-xs text-slate-500">Total Pending Updates</span>
              <p className="text-lg font-bold font-mono tabular-nums mt-1 text-amber-400">
                {patchCounts.pending}
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${cardBase}`}>
              <span className="text-xs text-slate-500">Verified & Installed</span>
              <p className="text-lg font-bold font-mono tabular-nums mt-1 text-emerald-400">
                {patchCounts.installed} / {patchCounts.total}
              </p>
            </div>
          </div>

          {/* Patch List + Filter Bar */}
          <div className={`rounded-2xl border overflow-hidden ${cardBase}`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'PENDING', 'INSTALLED'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPatchStatusFilter(st)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      patchStatusFilter === st
                        ? 'bg-cyan-600 text-white'
                        : isLight
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Patches'
                      : st === 'PENDING'
                      ? `Pending (${patchCounts.pending})`
                      : `Installed (${patchCounts.installed})`}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setPatchSeverityFilter(sev)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      patchSeverityFilter === sev
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-800/70 text-slate-400'
                    }`}
                  >
                    {sev === 'ALL' ? 'All Severities' : sev}
                  </button>
                ))}
              </div>
            </div>

            {filteredPatches.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm font-bold text-emerald-400">
                  System Up to Date — Zero Matching Pending CVEs
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All security bulletins for your selected filter are verified and installed, or switch filters to review installed updates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPatchStatusFilter('ALL');
                    setPatchSeverityFilter('ALL');
                    androidPatchScanner.resetCatalog();
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-500/10"
                >
                  Reset Catalog Baseline
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPatches.map((patch: AndroidSystemPatch) => {
                  const isExpanded = expandedPatchId === patch.id;

                  return (
                    <div key={patch.id} className="p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold">{patch.title}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(
                                patch.severity
                              )}`}
                            >
                              {patch.severity} · CVSS {patch.cvssScore.toFixed(1)}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPatchStatusBadge(
                                patch.status
                              )}`}
                            >
                              {patch.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 font-mono tabular-nums">
                            <span>{patch.cveIds.join(', ')}</span>
                            <span aria-hidden="true">·</span>
                            <span>SPL {patch.patchLevelDate}</span>
                            <span aria-hidden="true">·</span>
                            <span>{patch.versionTag}</span>
                            <span aria-hidden="true">·</span>
                            <span>{patch.sizeMb.toFixed(1)} MB</span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {patch.summary}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPatchId(isExpanded ? null : patch.id)
                            }
                            className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                              isLight
                                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {isExpanded ? 'Hide Advisory' : 'CVE & SHA-256'}
                          </button>

                          {patch.status === 'AVAILABLE' && (
                            <button
                              type="button"
                              onClick={() =>
                                androidPatchScanner.stageAndVerifyPatch(patch.id)
                              }
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              Download & Verify
                            </button>
                          )}

                          {patch.status === 'DOWNLOADING' && (
                            <span className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center">
                              Verifying {patch.downloadProgress || 0}%
                            </span>
                          )}

                          {patch.status === 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={() => androidPatchScanner.applyPatch(patch.id)}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              Apply Update
                            </button>
                          )}

                          {patch.status === 'INSTALLED' && (
                            <span className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center">
                              Patched
                            </span>
                          )}
                        </div>
                      </div>

                      {patch.status === 'DOWNLOADING' && (
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${patch.downloadProgress || 25}%` }}
                          />
                        </div>
                      )}

                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block">Affected Subsystems</span>
                            <span className="font-medium">
                              {patch.affectedComponents.join(' · ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Expected OTA SHA-256 Digest</span>
                            <span className="font-mono text-[11px] break-all text-cyan-400">
                              {patch.sha256}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Background Polling Audit Log */}
          <div className={`rounded-2xl border p-5 space-y-3 ${cardBase}`}>
            <h3 className="text-sm font-bold">Background Polling Telemetry</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanner.scanHistory.map(ev => (
                <div
                  key={ev.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 last:border-0"
                >
                  <span className="text-slate-600 dark:text-slate-300">{ev.message}</span>
                  <span className="font-mono tabular-nums text-slate-500 shrink-0">
                    {ev.timestamp} · {ev.ecosystem.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: INCOMING MESSAGES & PHONE CALLS                              */}
      {/* =================================================================== */}
      {activeSection === 'comms' && (
        <InboundCommsMonitor theme={theme} stealthMode={stealthMode} />
      )}

      {/* =================================================================== */}
      {/* TAB 3: SIM SWITCH LOCK & PORT-OUT FREEZE                            */}
      {/* =================================================================== */}
      {activeSection === 'sim_lock' && (
        <SimSwitchLockPanel theme={theme} stealthMode={stealthMode} />
      )}

      {/* =================================================================== */}
      {/* TAB 4: APK & OFFLINE PWA INSTALL CENTER                             */}
      {/* =================================================================== */}
      {activeSection === 'apk' && (
        <div className="space-y-6">
          {/* Readiness & Direct Install Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Offline Caching & PWA Readiness */}
            <div className={`rounded-2xl border p-5 space-y-4 ${cardBase}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Offline Cache & Standalone Readiness</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Service worker precaching, standalone display mode, and home-screen icon diagnostics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleWarmCache}
                  disabled={isWarmingCache}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-bold whitespace-nowrap shrink-0"
                >
                  {isWarmingCache ? 'Caching...' : 'Warm Offline Cache'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Service Worker</span>
                  <span
                    className={`font-mono font-bold mt-0.5 block ${
                      readiness?.serviceWorkerActive ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {readiness?.serviceWorkerActive ? 'ACTIVE & CACHING' : 'REGISTERING'}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Cached Entries</span>
                  <span className="font-mono font-bold tabular-nums mt-0.5 block text-cyan-400">
                    {readiness?.cachedEntryCount ?? 0} assets
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Display Mode</span>
                  <span className="font-mono font-bold mt-0.5 block">
                    {readiness?.isStandalone ? 'STANDALONE ACTIVE' : 'STANDALONE READY'}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Web App Manifest</span>
                  <span
                    className={`font-mono font-bold mt-0.5 block ${
                      readiness?.manifestDetected ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  >
                    {readiness?.manifestDetected ? 'VERIFIED' : 'CONFIGURED'}
                  </span>
                </div>
              </div>

              {cacheWarmMessage && (
                <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                  {cacheWarmMessage}
                </div>
              )}
            </div>

            {/* Instant Android Install + Icon Preview */}
            <div className={`rounded-2xl border p-5 space-y-4 ${cardBase}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Android Launcher & Splash Preview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maskable 512px safe-zone icon and standalone fullscreen splash preview.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 self-start">
                  {(['circle', 'squircle', 'splash'] as const).map(shape => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setIconPreviewShape(shape)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize ${
                        iconPreviewShape === shape
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-5">
                {iconPreviewShape === 'splash' ? (
                  <div className="w-28 h-40 rounded-2xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center gap-2 p-2 shrink-0">
                    <img
                      src="/pwa-192x192.png"
                      alt="Sentinel splash icon"
                      className="w-12 h-12 rounded-xl"
                    />
                    <span className="text-[10px] font-bold text-slate-200 truncate max-w-full">
                      {pkgConfig.shortName}
                    </span>
                    <span className="text-[9px] text-cyan-400 font-mono">standalone</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <img
                      src="/pwa-maskable-512x512.png"
                      alt="Sentinel Android launcher icon"
                      className={`w-20 h-20 border border-slate-700 object-cover ${
                        iconPreviewShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-slate-400">
                      {pkgConfig.shortName}
                    </span>
                  </div>
                )}

                <div className="space-y-2.5 flex-1">
                  {isInstalled ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
                      Sentinel is currently running in standalone installed app mode.
                    </div>
                  ) : isInstallable ? (
                    <button
                      type="button"
                      onClick={install}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-cyan"
                    >
                      Install Directly to Android Home Screen (WebAPK)
                    </button>
                  ) : isIOS ? (
                    <button
                      type="button"
                      onClick={() => setShowIosGuideModal(true)}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                    >
                      Show iOS Add to Home Screen Guide
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      In Android Chrome, tap the browser menu and select <strong>Install app</strong> (or use the downloadable APK / TWA package bundles below).
                    </p>
                  )}

                  <p className="text-[11px] text-slate-500">
                    Includes <span className="font-mono">192x192</span>, <span className="font-mono">512x512</span>, <span className="font-mono">maskable</span>, and <span className="font-mono">180x180</span> Apple Touch PNG assets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Configuration + APK / Bundle Downloads */}
          <div className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${cardBase}`}>
            <div>
              <h3 className="text-base font-bold">Android APK & Wrapper Package Builder</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your Android package identity and download ready-to-sign `.apk` wrapper archives, Bubblewrap TWA bundles, Capacitor projects, or icon packs with live SHA-256 verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={pkgConfig.appName}
                  onChange={e =>
                    setPkgConfig(prev => ({ ...prev, appName: e.target.value }))
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs focus:outline-none ${inputBase}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Launcher Short Name (max 12 chars)
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={pkgConfig.shortName}
                  onChange={e =>
                    setPkgConfig(prev => ({ ...prev, shortName: e.target.value }))
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs focus:outline-none ${inputBase}`}
                />
                {!shortNameValid && (
                  <span className="text-[11px] text-rose-400 mt-1 block">
                    Short name must be 1–12 characters.
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Android Package ID
                </label>
                <input
                  type="text"
                  value={pkgConfig.packageId}
                  onChange={e =>
                    setPkgConfig(prev => ({ ...prev, packageId: e.target.value.trim() }))
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none ${inputBase}`}
                />
                {!packageIdValid && (
                  <span className="text-[11px] text-rose-400 mt-1 block">
                    Use reverse-domain format (e.g. com.sentinel.security.app).
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Version Name
                </label>
                <input
                  type="text"
                  value={pkgConfig.versionName}
                  onChange={e =>
                    setPkgConfig(prev => ({ ...prev, versionName: e.target.value }))
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none ${inputBase}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Version Code
                </label>
                <input
                  type="number"
                  min={1}
                  value={pkgConfig.versionCode}
                  onChange={e =>
                    setPkgConfig(prev => ({
                      ...prev,
                      versionCode: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-mono tabular-nums focus:outline-none ${inputBase}`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Android Display Mode
                </label>
                <select
                  value={pkgConfig.displayMode}
                  onChange={e =>
                    setPkgConfig(prev => ({
                      ...prev,
                      displayMode: e.target.value as 'standalone' | 'fullscreen',
                    }))
                  }
                  className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs focus:outline-none ${inputBase}`}
                >
                  <option value="standalone">Standalone (No browser chrome)</option>
                  <option value="fullscreen">Immersive Fullscreen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Target Origin URL
              </label>
              <input
                type="url"
                value={pkgConfig.targetUrl}
                onChange={e =>
                  setPkgConfig(prev => ({ ...prev, targetUrl: e.target.value }))
                }
                className={`w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs font-mono focus:outline-none ${inputBase}`}
              />
            </div>

            {/* Download Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                disabled={!formValid || isBuildingPkg}
                onClick={() => handleDownloadPackage('apk_package')}
                className="min-h-[48px] px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-left transition-colors"
              >
                <span className="text-xs font-bold block">Download APK Wrapper (.apk)</span>
                <span className="text-[11px] text-cyan-100 block mt-0.5">
                  Manifest, icons & sideload guide
                </span>
              </button>

              <button
                type="button"
                disabled={!formValid || isBuildingPkg}
                onClick={() => handleDownloadPackage('twa_bundle')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-left transition-colors disabled:opacity-50 ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold block">TWA Bubblewrap Bundle (.zip)</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  twa-manifest.json & Gradle project
                </span>
              </button>

              <button
                type="button"
                disabled={!formValid || isBuildingPkg}
                onClick={() => handleDownloadPackage('capacitor_bundle')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-left transition-colors disabled:opacity-50 ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold block">Capacitor Offline Bundle (.zip)</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  capacitor.config.json & Android XML
                </span>
              </button>

              <button
                type="button"
                disabled={!formValid || isBuildingPkg}
                onClick={() => handleDownloadPackage('icon_pack')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-left transition-colors disabled:opacity-50 ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold block">Android Icon Pack (.zip)</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  192px, 512px, maskable & SVG
                </span>
              </button>
            </div>

            {buildProgressLabel && (
              <div className="text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-2.5">
                {buildProgressLabel}
              </div>
            )}

            {buildError && (
              <div className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2.5">
                {buildError}
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Packaging note: Browser exports assemble unsigned Android wrapper archives and ready-to-compile Gradle/Bubblewrap/Capacitor bundles. To install directly on Android without a workstation, tap <strong>Install Directly to Android Home Screen</strong> above or Chrome&apos;s <strong>Install app</strong> action, which compiles a signed WebAPK natively on-device.
            </p>
          </div>

          {/* Session Export History */}
          {buildHistory.length > 0 && (
            <div className={`rounded-2xl border p-5 space-y-3 ${cardBase}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Session Export History</h3>
                <button
                  type="button"
                  onClick={() => setBuildHistory([])}
                  className="text-xs text-slate-500 hover:text-rose-400"
                >
                  Clear History
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {buildHistory.map(item => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold">{item.filename}</span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          {formatBytes(item.sizeBytes)} · {item.fileCount} files · {item.generatedAt}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        SHA-256: {item.sha256}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopySha(item.id, item.sha256)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-500/10"
                      >
                        {copiedShaId === item.id ? 'Copied SHA-256' : 'Copy SHA-256'}
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerBlobDownload(item.blob, item.filename)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                      >
                        Download Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* iOS Guide Modal */}
      {showIosGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 space-y-4 ${cardBase}`}>
            <h3 className="text-base font-bold">Install on iPhone / iPad</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
              1. Open Sentinel in Safari and tap the <strong>Share</strong> icon.<br />
              2. Scroll down and select <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> to launch in standalone mode with offline caching.
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuideModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCenter;
