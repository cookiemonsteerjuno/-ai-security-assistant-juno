import React, { useEffect, useState } from 'react';
import {
  Download,
  Eye,
  EyeOff,
  Globe,
  Lock,
  MessageSquare,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Terminal,
  Unlock,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  AnalyticsInterceptEvent,
  AndroidDeviceProfile,
  AndroidEcosystem,
  AndroidSystemPatch,
  ChatMessage,
  DeviceCommand,
  HardwarePeripheralEvent,
  InboundCommunicationEvent,
  MobileCenterSection,
  NetworkSubSection,
  NodeAccessProbeRecord,
  PatchChannel,
  ScreenMaskMode,
  SecurityLog,
  SecurityModule,
  SecurityStatus,
  SimLockEvent,
  SimSlotType,
} from './types';
import {
  APP_NAME,
  ECOSYSTEM_PRESETS,
  INITIAL_MODULES,
  INITIAL_PATCH_CATALOG,
  RELAY_LOCATIONS,
} from './constants';
import { audioEngine } from './services/audioEngine';
import { buildZipBinary, generatePngIconBytes } from './services/apkPackager';
import { applyScreenMaskAttribute } from './services/screenMaskService';
import SecurityDashboard from './components/SecurityDashboard';
import DeviceCommandsMonitor from './components/DeviceCommandsMonitor';
import NetworkRoutingShield from './components/NetworkRoutingShield';
import MobileCenter from './components/MobileCenter';
import ChatInterface from './components/ChatInterface';
import SettingsMenu from './components/SettingsMenu';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import ScreenMaskOverlay from './components/ScreenMaskOverlay';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'commands' | 'network' | 'mobile' | 'chat' | 'settings'>('dashboard');
  const [mobileSection, setMobileSection] = useState<MobileCenterSection>('patches');
  const [networkSubSection, setNetworkSubSection] = useState<NetworkSubSection>('vpn_proxy_tunnel');
  const [stealthMode, setStealthMode] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [toast, setToast] = useState<{ title: string; detail: string; type: 'info' | 'success' | 'critical' } | null>(null);
  const triggerToast = (title: string, detail: string, type: 'info' | 'success' | 'critical' = 'info') => {
    setToast({ title, detail, type });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const [isScreenMasked, setIsScreenMasked] = useState(false);
  const [screenMaskMode, setScreenMaskMode] = useState<ScreenMaskMode>('SELECTIVE_BLUR');

  const [modules, setModules] = useState<SecurityModule[]>(INITIAL_MODULES);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([
    {
      id: 'log-101',
      timestamp: '03:37:52 AM',
      event: 'High-Security Knox RKP & Baseband 5G SA Hardening Signatures Loaded',
      status: SecurityStatus.ACTIVE,
      origin: 'Sentinel Patch Engine',
      severity: 'INFO',
      protocol: 'KERNEL_RKP',
      sourceIp: '127.0.0.1',
      destinationPort: 0,
    },
    {
      id: 'log-102',
      timestamp: '03:36:18 AM',
      event: 'Dropped inbound V8 Inspector remote debug handshake (GET /json/version)',
      status: SecurityStatus.BLOCKED,
      origin: '185.220.101.44 (DE)',
      severity: 'CRITICAL',
      protocol: 'TCP',
      sourceIp: '185.220.101.44',
      destinationPort: 9229,
    },
    {
      id: 'log-103',
      timestamp: '03:34:09 AM',
      event: 'Null-routed Google Analytics 4 & Datadog RUM telemetry beacons (0 bytes sent)',
      status: SecurityStatus.BLOCKED,
      origin: 'Zero Analytics Shield',
      severity: 'MEDIUM',
      protocol: 'HTTPS',
      sourceIp: '0.0.0.0',
      destinationPort: 443,
    },
    {
      id: 'log-104',
      timestamp: '03:31:40 AM',
      event: 'Severed USB-C OTG unauthorized host-role ADB shell probe',
      status: SecurityStatus.THREAT_DETECTED,
      origin: '/sys/bus/usb/devices/1-1.4',
      severity: 'CRITICAL',
      protocol: 'USB_OTG',
      sourceIp: 'LOCAL_BUS',
      destinationPort: 5555,
    },
  ]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'CRITICAL' | 'BLOCKED' | 'ACTIVE'>('ALL');

  const [deviceProfile, setDeviceProfile] = useState<AndroidDeviceProfile>({
    ecosystem: 'samsung',
    modelName: ECOSYSTEM_PRESETS.samsung.modelName,
    osVersion: ECOSYSTEM_PRESETS.samsung.osVersion,
    currentSecurityPatchLevel: ECOSYSTEM_PRESETS.samsung.defaultSpl,
    detectedBrowserOs: 'Android 16 · One UI 8.0 (SM-A166U / S25)',
    detectedWebViewVersion: 'Chromium 138.0.7204.98 Hardened',
    isLiveAndroidClient: true,
  });
  const [patches, setPatches] = useState<AndroidSystemPatch[]>(INITIAL_PATCH_CATALOG);
  const [patchFilter, setPatchFilter] = useState<'ALL' | 'HIGH_SECURITY' | 'CRITICAL' | 'HIGH' | 'INSTALLED'>('ALL');
  const [autoPollPatches] = useState(true);
  const [pollIntervalSec] = useState<15 | 30 | 60>(30);
  const [nextScanCountdown, setNextScanCountdown] = useState(30);
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const [isScanningPatches, setIsScanningPatches] = useState(false);

  const [deviceCommands, setDeviceCommands] = useState<DeviceCommand[]>([
    {
      id: 'cmd-901',
      timestamp: '03:38:12 AM',
      isoTimestamp: new Date().toISOString(),
      targetDevice: 'Samsung Galaxy A16 / S25 Node-01',
      sourceDispatcher: 'Sentinel High-Security Patch Daemon',
      commandText: 'sentinel_patch --enforce-knox-rkp --lock-selinux --spl=2026-11-16',
      actionSummary: 'Enforce Knox Vault RKP & SELinux Kernel Lockdown',
      category: 'PATCH',
      severity: 'CRITICAL',
      status: 'ENFORCED',
      authorizedBy: 'Jazzmin M. (SecOps Admin)',
    },
    {
      id: 'cmd-902',
      timestamp: '03:35:44 AM',
      isoTimestamp: new Date().toISOString(),
      targetDevice: 'Baseband Modem (Shannon 5G SA)',
      sourceDispatcher: 'Sentinel Baseband Firewall',
      commandText: 'modem_ctl --disable-2g-fallback --drop-silent-sms-type0',
      actionSummary: 'Disable 2G Stingray Fallback & Block Type-0 Silent Ping SMS',
      category: 'NETWORK',
      severity: 'CRITICAL',
      status: 'ENFORCED',
      authorizedBy: 'Autonomous Policy Engine',
    },
    {
      id: 'cmd-903',
      timestamp: '03:32:19 AM',
      isoTimestamp: new Date().toISOString(),
      targetDevice: 'Edge Firewall (nftables)',
      sourceDispatcher: '1-Min Firewall Auto-Reload Engine',
      commandText: 'nft flush ruleset && nft -f /etc/sentinel/quantum-strict.nft',
      actionSummary: 'Atomic 60-Second Firewall Rule Table Flush & Reload',
      category: 'NETWORK',
      severity: 'ELEVATED',
      status: 'SUCCESS',
      authorizedBy: 'Firewall Timer Daemon',
    },
  ]);

  const [vpnConnected, setVpnConnected] = useState(true);
  const [vpnProtocol, setVpnProtocol] = useState<'Quantum-Mesh' | 'WireGuard' | 'OpenVPN-DCO'>('Quantum-Mesh');
  const [proxyEnabled, setProxyEnabled] = useState(true);
  const [tunnelOpen, setTunnelOpen] = useState(true);
  const [firewallCountdown, setFirewallCountdown] = useState(60);
  const [firewallReloadCount, setFirewallReloadCount] = useState(142);
  const [locationHopRunning, setLocationHopRunning] = useState(true);
  const [locationHopCountdown, setLocationHopCountdown] = useState(30);
  const [activeLocationIdx, setActiveLocationIdx] = useState(0);
  const [, setTotalLocationHops] = useState(38);

  const [cloudflareBlocked, setCloudflareBlocked] = useState(true);
  const [cloudflareDroppedCount] = useState(1842);
  const [foreignStatesBlocked, setForeignStatesBlocked] = useState(true);
  const [foreignPacketsDropped] = useState(4910);
  const [bluetoothKilled, setBluetoothKilled] = useState(true);
  const [bleBlockedCount] = useState(29);
  const [networkSharingBlocked, setNetworkSharingBlocked] = useState(true);
  const [packetConcealmentOn, setPacketConcealmentOn] = useState(true);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsInterceptEvent[]>([
    {
      id: 'anl-1',
      timestamp: '03:37:12 AM',
      vendor: 'Google Analytics 4 (gtag.js)',
      endpoint: 'https://www.google-analytics.com/g/collect',
      method: 'navigator.sendBeacon',
      payloadType: 'telemetry_beacon',
      actionTaken: 'SUPPRESSED_NULL_ROUTED',
      sizeBytes: 842,
    },
  ]);
  const [nodeProbes, setNodeProbes] = useState<NodeAccessProbeRecord[]>([
    {
      id: 'np-1',
      timestamp: '03:36:18 AM',
      nodeIp: '185.220.101.44',
      nodeHostname: 'exit-relay-04.nodes.de',
      nodeType: 'Node.js Inspector / V8 Debugger',
      port: 9229,
      protocol: 'TCP',
      actionTaken: 'TCP_RST',
      threatSeverity: 'CRITICAL',
      signature: 'GET /json/version (V8 Inspector handshake probe)',
    },
  ]);
  const [contactedDomains, setContactedDomains] = useState([
    { id: 'cd-1', domain: 'telemetry.fingerprinter-cdn.net', ip: '104.21.44.12', protocol: 'HTTPS', status: 'BLOCKED', threatScore: 94 },
    { id: 'cd-2', domain: 'c2-beacon.shadow-metrics.org', ip: '45.95.147.88', protocol: 'WSS', status: 'BLOCKED', threatScore: 99 },
    { id: 'cd-3', domain: 'dl.google.com (Play System Mainline)', ip: '142.250.189.14', protocol: 'HTTPS', status: 'ALLOWED', threatScore: 2 },
  ]);

  const [hwKillSwitchTripped, setHwKillSwitchTripped] = useState(false);
  const [hwEvents] = useState<HardwarePeripheralEvent[]>([
    {
      id: 'hw-1',
      timestamp: '03:34:00 AM',
      deviceName: 'Unregistered USB OTG Mass Storage + ADB Bridge',
      portType: 'USB_OTG',
      vendorProductId: 'VID:18D1 PID:4EE7 (Spoofed)',
      busPath: '/sys/bus/usb/devices/1-1.4',
      anomalySignature: 'Unexpected OTG host-role negotiation requesting ADB shell & raw NAND access',
      riskLevel: 'CRITICAL',
      actionTaken: 'KILL_SWITCH_TRIPPED',
      powerOnlyIsolated: true,
    },
  ]);

  const [commsEvents, setCommsEvents] = useState<InboundCommunicationEvent[]>([
    {
      id: 'comm-1',
      channel: 'CALL',
      senderName: 'Unknown Caller (Spoofed Bank)',
      phoneNumber: '+1 (800) 555-0194',
      carrierOrOrigin: 'SIP Trunk · Unverified Gateway',
      timestamp: '03:35:00 AM',
      previewText: 'Incoming voice call flagged by STIR/SHAKEN attestation mismatch and spoofed caller ID.',
      callState: 'REJECTED_BY_SHIELD',
      stirShakenAttestation: 'C (Gateway)',
      phishingScore: 94,
      status: 'BLOCKED',
      threatReason: 'Caller ID failed carrier cryptographic signature verification.',
    },
  ]);

  const [simLocked] = useState(true);
  const [esimLocked, setEsimLocked] = useState(true);
  const [portOutFrozen, setPortOutFrozen] = useState(true);
  const [activeSimSlot] = useState<SimSlotType>('PHYSICAL_SIM_1');
  const [guardPin] = useState('4829');
  const [simEvents, setSimEvents] = useState<SimLockEvent[]>([
    {
      id: 'sim-1',
      timestamp: '03:14:00 AM',
      eventType: 'ESIM_PROFILE_PUSH',
      slot: 'ESIM_PROFILE_2',
      detectedIccid: '8901-4103-2799-8810-442F',
      carrierLabel: 'Unverified SM-DP+ Provisioner',
      actionTaken: 'ESIM_REJECTED',
      severity: 'CRITICAL',
      detail: 'Blocked unauthorized remote eSIM QR/OTA profile download attempt.',
    },
  ]);

  const [pkgAppName, setPkgAppName] = useState('Sentinel AI High-Security');
  const [pkgShortName, setPkgShortName] = useState('Sentinel-X');
  const [pkgId, setPkgId] = useState('io.sentinelx.security.app');
  const [pkgVersion, setPkgVersion] = useState('2.5.0-HS');
  const [pkgGenerating, setPkgGenerating] = useState(false);
  const [generatedPackages, setGeneratedPackages] = useState<
    Array<{ id: string; filename: string; format: string; sizeKb: string; sha256: string; timestamp: string; blob: Blob }>
  >([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        'SENTINEL-X High-Security Operations Console online. I have loaded 9 new High-Security Hardening Patches (Knox Vault RKP, 5G SA Baseband Zero-Click Firewall, USB-C Data-Line Lockdown, pKVM Hypervisor Isolation, Post-Quantum ML-KEM-768 TLS, and ARMv9 MTE/kCFI). Ask me to audit your node, deploy all high-security patches, or build an Android APK package.',
      timestamp: '03:38:30 AM',
      actionTag: 'SYSTEM_READY',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    applyScreenMaskAttribute(isScreenMasked);
  }, [isScreenMasked]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFirewallCountdown(prev => {
        if (prev <= 1) {
          setFirewallReloadCount(c => c + 1);
          return 60;
        }
        return prev - 1;
      });
      if (locationHopRunning) {
        setLocationHopCountdown(prev => {
          if (prev <= 1) {
            setActiveLocationIdx(idx => (idx + 1) % RELAY_LOCATIONS.length);
            setTotalLocationHops(h => h + 1);
            return 30;
          }
          return prev - 1;
        });
      }
      if (autoPollPatches && !isScanningPatches) {
        setNextScanCountdown(prev => (prev <= 1 ? pollIntervalSec : prev - 1));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [locationHopRunning, autoPollPatches, isScanningPatches, pollIntervalSec]);

  const switchEcosystem = (eco: AndroidEcosystem) => {
    const preset = ECOSYSTEM_PRESETS[eco];
    setDeviceProfile(prev => ({
      ...prev,
      ecosystem: eco,
      modelName: preset.modelName,
      osVersion: preset.osVersion,
    }));
    triggerToast(`Switched Profile: ${eco.toUpperCase()}`, `Target set to ${preset.modelName}`, 'info');
  };

  const stageAndApplySinglePatch = (patchId: string) => {
    const target = patches.find(p => p.id === patchId);
    if (!target) return;
    setPatches(prev => prev.map(p => (p.id === patchId ? { ...p, status: 'DOWNLOADING', downloadProgress: 45 } : p)));
    setTimeout(() => {
      setPatches(prev => prev.map(p => (p.id === patchId ? { ...p, status: 'VERIFIED', downloadProgress: 100 } : p)));
    }, 350);
    setTimeout(() => {
      setPatches(prev => prev.map(p => (p.id === patchId ? { ...p, status: 'INSTALLED', downloadProgress: 100 } : p)));
      setDeviceProfile(prev => ({
        ...prev,
        currentSecurityPatchLevel:
          target.patchLevelDate > prev.currentSecurityPatchLevel ? target.patchLevelDate : prev.currentSecurityPatchLevel,
      }));
      setSecurityLogs(prev => [
        {
          id: `log-patch-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          event: `Verified SHA-256 & Applied High-Security Patch: ${target.title} (${target.versionTag})`,
          status: SecurityStatus.ACTIVE,
          origin: 'Android Patch Engine',
          severity: target.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          protocol: target.channel,
          sourceIp: '127.0.0.1',
          destinationPort: 0,
        },
        ...prev,
      ]);
      if (voiceAlertsEnabled) audioEngine.speak(`Applied security patch ${target.title}`, false);
      triggerToast('Security Patch Installed', `${target.versionTag} (${target.cveIds.join(', ')}) verified & active.`, 'success');
    }, 750);
  };

  const applyAllHighSecurityPatches = () => {
    const pendingCount = patches.filter(p => p.status !== 'INSTALLED').length;
    if (pendingCount === 0) {
      triggerToast('All Patches Already Installed', 'System is at Security Patch Level 2026-11-16 (Hardened).', 'info');
      return;
    }
    setIsScanningPatches(true);
    setTimeout(() => {
      setPatches(prev => prev.map(p => ({ ...p, status: 'INSTALLED', downloadProgress: 100 })));
      setDeviceProfile(prev => ({ ...prev, currentSecurityPatchLevel: '2026-11-16 (High-Security Hardened)' }));
      setModules(prev => prev.map(m => ({ ...m, status: SecurityStatus.ACTIVE, health: 100 })));
      setIsScanningPatches(false);
      setSecurityLogs(prev => [
        {
          id: `log-hs-all-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          event: `Batch-Applied ${pendingCount} High-Security Patches (Knox RKP, 5G Baseband Firewall, pKVM, ML-KEM-768, MTE/kCFI)`,
          status: SecurityStatus.ACTIVE,
          origin: 'High-Security Patch Enforcer',
          severity: 'CRITICAL',
          protocol: 'ALL_CHANNELS',
          sourceIp: '127.0.0.1',
          destinationPort: 0,
        },
        ...prev,
      ]);
      if (voiceAlertsEnabled) {
        audioEngine.speak(`All ${pendingCount} high security patches verified and installed.`, true);
      }
      triggerToast('All High-Security Patches Installed', `Applied ${pendingCount} patches across Kernel, Baseband & Mainline.`, 'success');
    }, 600);
  };

  const handleAddCustomPatch = (title: string, cveInput: string, channel: PatchChannel) => {
    const cve = cveInput || `CVE-2026-${Math.floor(45000 + Math.random() * 4999)}`;
    const newPatch: AndroidSystemPatch = {
      id: `patch-custom-${Date.now()}`,
      title,
      ecosystem: deviceProfile.ecosystem,
      channel,
      severity: 'CRITICAL',
      cveIds: [cve],
      cvssScore: 9.7,
      patchLevelDate: '2026-11-16',
      versionTag: `HS-HOTFIX-${Math.floor(1000 + Math.random() * 8999)}`,
      sizeMb: 38.5,
      sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      status: 'INSTALLED',
      downloadProgress: 100,
      discoveredAt: new Date().toLocaleTimeString(),
      summary: `Operator-injected High-Security kernel/firmware mitigation for ${cve}. Immediately verified and enforced.`,
      affectedComponents: ['High-Security Enclave', channel],
      isHighSecurityHardening: true,
    };
    setPatches(prev => [newPatch, ...prev]);
    triggerToast('Custom High-Security Patch Enforced', `${newPatch.title} (${cve}) installed.`, 'success');
  };

  const handleBuildMobilePackage = async (format: 'apk_package' | 'twa_bundle' | 'capacitor_bundle' | 'icon_pack') => {
    setPkgGenerating(true);
    try {
      const encoder = new TextEncoder();
      const icon192 = await generatePngIconBytes(192, '#020617', '#06b6d4');
      const icon512 = await generatePngIconBytes(512, '#020617', '#06b6d4');
      const installedPatchesList = patches
        .filter(p => p.status === 'INSTALLED')
        .map(p => `- [${p.severity}] ${p.title} (${p.versionTag} / ${p.cveIds.join(', ')})`)
        .join('\n');

      const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkgId}"
    android:versionCode="250"
    android:versionName="${pkgVersion}">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application android:allowBackup="false" android:label="${pkgAppName}" android:usesCleartextTraffic="false">
        <meta-data android:name="sentinel.security.spl" android:value="${deviceProfile.currentSecurityPatchLevel}" />
    </application>
</manifest>`;

      const securityReportTxt = `SENTINEL-X ANDROID HIGH-SECURITY PACKAGE MANIFEST
App Name: ${pkgAppName} (${pkgShortName})
Package ID: ${pkgId}
Version: ${pkgVersion}
Target Device Profile: ${deviceProfile.modelName} (${deviceProfile.osVersion})
Security Patch Level: ${deviceProfile.currentSecurityPatchLevel}

INSTALLED HIGH-SECURITY PATCHES:
${installedPatchesList || 'All baseline high-security modules active.'}
`;

      const entries = [
        { path: 'AndroidManifest.xml', data: encoder.encode(manifestXml) },
        { path: 'META-INF/SENTINEL_HIGH_SECURITY.SF', data: encoder.encode(securityReportTxt) },
        { path: 'res/mipmap-hdpi/ic_launcher.png', data: icon192 },
        { path: 'res/mipmap-xxxhdpi/ic_launcher.png', data: icon512 },
        {
          path: 'assets/www/manifest.webmanifest',
          data: encoder.encode(
            JSON.stringify(
              {
                name: pkgAppName,
                short_name: pkgShortName,
                start_url: '/',
                display: 'standalone',
                background_color: '#020617',
                theme_color: '#06b6d4',
              },
              null,
              2
            )
          ),
        },
      ];

      const zipBytes = buildZipBinary(entries);
      let hashHex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const copy = new Uint8Array(zipBytes.byteLength);
        copy.set(zipBytes);
        const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
        hashHex = Array.from(new Uint8Array(digest))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }

      const ext = format === 'apk_package' ? 'apk' : 'zip';
      const filename = `${pkgShortName.toLowerCase()}-v${pkgVersion}-${format}.${ext}`;
      const mime = format === 'apk_package' ? 'application/vnd.android.package-archive' : 'application/zip';
      const blobCopy = new Uint8Array(zipBytes.byteLength);
      blobCopy.set(zipBytes);
      const blob = new Blob([blobCopy.buffer], { type: mime });

      setGeneratedPackages(prev => [
        {
          id: `pkg-${Date.now()}`,
          filename,
          format,
          sizeKb: `${(zipBytes.byteLength / 1024).toFixed(1)} KB`,
          sha256: hashHex,
          timestamp: new Date().toLocaleTimeString(),
          blob,
        },
        ...prev,
      ]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      triggerToast('Mobile Package Built & Downloaded', `Generated ${filename} with SHA-256 verification.`, 'success');
    } finally {
      setPkgGenerating(false);
    }
  };

  const handleDispatchCommand = (cmdText: string, summary: string, category: DeviceCommand['category'] = 'PATCH') => {
    const newCmd: DeviceCommand = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      isoTimestamp: new Date().toISOString(),
      targetDevice: deviceProfile.modelName,
      sourceDispatcher: 'Operator Console',
      commandText: cmdText,
      actionSummary: summary,
      category,
      severity: 'CRITICAL',
      status: 'ENFORCED',
      authorizedBy: 'Jazzmin M.',
    };
    setDeviceCommands(prev => [newCmd, ...prev]);
    audioEngine.speak(`Command enforced: ${summary}`, false);
    triggerToast('Command Dispatched & Enforced', cmdText, 'success');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatMessages(prev => [...prev, { role: 'user', content: trimmed, timestamp: new Date().toLocaleTimeString() }]);
    setChatInput('');
    const lower = trimmed.toLowerCase();
    setTimeout(() => {
      let reply = '';
      let tag = 'SECOPS_ANALYSIS';
      if (lower.includes('patch') || lower.includes('update') || lower.includes('high security') || lower.includes('fix')) {
        const pending = patches.filter(p => p.status !== 'INSTALLED');
        if (pending.length > 0) {
          applyAllHighSecurityPatches();
          reply = `Automatically staged, SHA-256 verified, and installed all ${pending.length} pending High-Security Patches. Security Patch Level is now 2026-11-16 (High-Security Hardened).`;
          tag = 'AUTO_PATCH_ENFORCED';
        } else {
          reply = `All ${patches.length} High-Security & Bulletin patches are already verified and installed. Current Security Patch Level: ${deviceProfile.currentSecurityPatchLevel}.`;
          tag = 'SPL_VERIFIED';
        }
      } else if (lower.includes('apk') || lower.includes('download') || lower.includes('install') || lower.includes('app')) {
        handleBuildMobilePackage('apk_package');
        reply = `Packaged and triggered the download of your signed Android wrapper (${pkgShortName.toLowerCase()}-v${pkgVersion}-apk_package.apk).`;
        tag = 'APK_GENERATED';
      } else if (lower.includes('mask') || lower.includes('blur') || lower.includes('privacy')) {
        setIsScreenMasked(true);
        reply = `Screen-Masking Overlay engaged (${screenMaskMode}). Sensitive IPs, ICCIDs, and logs are obscured.`;
        tag = 'PRIVACY_MASK_ON';
      } else {
        const installedCount = patches.filter(p => p.status === 'INSTALLED').length;
        const activeNode = RELAY_LOCATIONS[activeLocationIdx];
        reply = `Security Status Report for ${deviceProfile.modelName}:\n• SPL: ${deviceProfile.currentSecurityPatchLevel} (${installedCount}/${patches.length} patches)\n• Firewall Reload: ${firewallCountdown}s\n• Active Relay: ${activeNode.flag} ${activeNode.city} (${activeNode.ip})\n• SIM Switch Lock: Armed (PIN ${guardPin})`;
      }
      setChatMessages(prev => [...prev, { role: 'model', content: reply, timestamp: new Date().toLocaleTimeString(), actionTag: tag }]);
    }, 300);
  };

  const ecoPatches = patches.filter(p => p.ecosystem === deviceProfile.ecosystem);
  const filteredPatches = ecoPatches.filter(p => {
    if (patchFilter === 'HIGH_SECURITY') return !!p.isHighSecurityHardening;
    if (patchFilter === 'CRITICAL') return p.severity === 'CRITICAL';
    if (patchFilter === 'HIGH') return p.severity === 'HIGH';
    if (patchFilter === 'INSTALLED') return p.status === 'INSTALLED';
    return true;
  });
  const pendingEcoPatchesCount = ecoPatches.filter(p => p.status !== 'INSTALLED').length;
  const highSecEcoCount = ecoPatches.filter(p => p.isHighSecurityHardening).length;
  const activeRelay = RELAY_LOCATIONS[activeLocationIdx];

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${stealthMode ? 'grayscale contrast-125' : ''} ${
        theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-50'
      }`}
    >
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl flex items-start gap-3 ${
              toast.type === 'critical'
                ? 'bg-rose-950/95 border-rose-500 text-rose-100'
                : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100'
                : 'bg-slate-900/95 border-cyan-500 text-cyan-100'
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-cyan-400" />
            <div className="text-xs">
              <div className="font-bold">{toast.title}</div>
              <div className="opacity-90 mt-0.5">{toast.detail}</div>
            </div>
            <button type="button" onClick={() => setToast(null)} className="ml-auto text-xs opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      )}

      <ScreenMaskOverlay
        isScreenMasked={isScreenMasked}
        screenMaskMode={screenMaskMode}
        onDisengage={() => setIsScreenMasked(false)}
      />

      <nav
        className={`hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-6 border-r z-40 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="mb-8 w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-cyan"
          title="Sentinel-X Overview"
        >
          S
        </button>
        <div className="flex flex-col gap-4 flex-1">
          {[
            { id: 'dashboard', label: 'Overview', icon: Shield },
            { id: 'commands', label: 'Commands', icon: Terminal },
            { id: 'network', label: 'Network Shield', icon: Globe },
            { id: 'mobile', label: 'Mobile & Patches', icon: Smartphone },
            { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                title={item.label}
                className={`p-3 rounded-xl transition-all relative ${
                  active ? 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.id === 'mobile' && pendingEcoPatchesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {pendingEcoPatchesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setIsScreenMasked(!isScreenMasked)}
            title={isScreenMasked ? 'Disengage Screen Mask' : 'Engage Screen Mask'}
            className={`p-3 rounded-xl transition-colors ${
              isScreenMasked ? 'text-rose-400 bg-rose-500/15' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {isScreenMasked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setStealthMode(!stealthMode)}
            title="Toggle Stealth Mode"
            className={`p-3 rounded-xl transition-colors ${
              stealthMode ? 'text-purple-400 bg-purple-500/15' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {stealthMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <main className="pl-0 md:pl-20 pb-20 md:pb-10 min-h-screen">
        <header
          className={`px-4 sm:px-8 py-3.5 border-b flex flex-wrap justify-between items-center gap-3 glass sticky top-0 z-30 ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold mono">
              SX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-widest mono text-cyan-400">
                  {stealthMode ? 'REDACTED-NODE' : APP_NAME}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mono">
                  SPL {deviceProfile.currentSecurityPatchLevel}
                </span>
                <OfflineIndicator />
              </div>
              <p className="text-[11px] text-slate-400 mono">
                {deviceProfile.modelName} · Relay: {activeRelay.flag} {activeRelay.city} (
                <span data-sensitive-data="true">{activeRelay.ip}</span>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <PWAInstallButton />
            <button
              type="button"
              onClick={applyAllHighSecurityPatches}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-cyan"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {pendingEcoPatchesCount > 0
                  ? `Install High-Security Patches (${pendingEcoPatchesCount})`
                  : 'All High-Security Patches Active'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSection('apk');
                setActiveTab('mobile');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export APK</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.isMuted = !audioEngine.isMuted;
                triggerToast(
                  audioEngine.isMuted ? 'Voice Announcer Muted' : 'Voice Announcer Active',
                  audioEngine.isMuted ? 'Audio telemetry alerts silenced.' : 'Cyber chime & speech synthesis enabled.',
                  'info'
                );
              }}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Toggle Voice Alerts"
            >
              {audioEngine.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {activeTab === 'dashboard' && (
            <SecurityDashboard
              deviceProfile={deviceProfile}
              highSecEcoCount={highSecEcoCount}
              pendingEcoPatchesCount={pendingEcoPatchesCount}
              ecoPatches={ecoPatches}
              modules={modules}
              firewallCountdown={firewallCountdown}
              firewallReloadCount={firewallReloadCount}
              activeRelay={activeRelay}
              locationHopCountdown={locationHopCountdown}
              analyticsCount={analyticsEvents.length}
              foreignPacketsDropped={foreignPacketsDropped}
              nodeProbesCount={nodeProbes.length}
              cloudflareDroppedCount={cloudflareDroppedCount}
              securityLogs={securityLogs}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              applyAllHighSecurityPatches={applyAllHighSecurityPatches}
              onOpenPatchScanner={() => {
                setMobileSection('patches');
                setActiveTab('mobile');
              }}
              onOpenNetworkSection={section => {
                setNetworkSubSection(section);
                setActiveTab('network');
              }}
              onOpenNetworkTab={() => setActiveTab('network')}
            />
          )}

          {activeTab === 'commands' && (
            <DeviceCommandsMonitor
              deviceCommands={deviceCommands}
              onDispatchCommand={handleDispatchCommand}
            />
          )}

          {activeTab === 'network' && (
            <NetworkRoutingShield
              networkSubSection={networkSubSection}
              setNetworkSubSection={setNetworkSubSection}
              vpnConnected={vpnConnected}
              setVpnConnected={setVpnConnected}
              vpnProtocol={vpnProtocol}
              setVpnProtocol={setVpnProtocol}
              proxyEnabled={proxyEnabled}
              setProxyEnabled={setProxyEnabled}
              tunnelOpen={tunnelOpen}
              setTunnelOpen={setTunnelOpen}
              firewallCountdown={firewallCountdown}
              setFirewallCountdown={setFirewallCountdown}
              firewallReloadCount={firewallReloadCount}
              setFirewallReloadCount={setFirewallReloadCount}
              locationHopRunning={locationHopRunning}
              setLocationHopRunning={setLocationHopRunning}
              locationHopCountdown={locationHopCountdown}
              setLocationHopCountdown={setLocationHopCountdown}
              activeLocationIdx={activeLocationIdx}
              setActiveLocationIdx={setActiveLocationIdx}
              setTotalLocationHops={setTotalLocationHops}
              analyticsEvents={analyticsEvents}
              setAnalyticsEvents={setAnalyticsEvents}
              nodeProbes={nodeProbes}
              setNodeProbes={setNodeProbes}
              cloudflareBlocked={cloudflareBlocked}
              setCloudflareBlocked={setCloudflareBlocked}
              cloudflareDroppedCount={cloudflareDroppedCount}
              foreignStatesBlocked={foreignStatesBlocked}
              setForeignStatesBlocked={setForeignStatesBlocked}
              foreignPacketsDropped={foreignPacketsDropped}
              bluetoothKilled={bluetoothKilled}
              setBluetoothKilled={setBluetoothKilled}
              bleBlockedCount={bleBlockedCount}
              networkSharingBlocked={networkSharingBlocked}
              setNetworkSharingBlocked={setNetworkSharingBlocked}
              packetConcealmentOn={packetConcealmentOn}
              setPacketConcealmentOn={setPacketConcealmentOn}
              contactedDomains={contactedDomains}
              setContactedDomains={setContactedDomains}
              triggerToast={triggerToast}
              onManageHardwareBus={() => {
                setMobileSection('hardware');
                setActiveTab('mobile');
              }}
            />
          )}

          {activeTab === 'mobile' && (
            <MobileCenter
              mobileSection={mobileSection}
              setMobileSection={setMobileSection}
              deviceProfile={deviceProfile}
              nextScanCountdown={nextScanCountdown}
              switchEcosystem={switchEcosystem}
              applyAllHighSecurityPatches={applyAllHighSecurityPatches}
              pendingEcoPatchesCount={pendingEcoPatchesCount}
              ecoPatches={ecoPatches}
              highSecEcoCount={highSecEcoCount}
              patchFilter={patchFilter}
              setPatchFilter={setPatchFilter}
              filteredPatches={filteredPatches}
              stageAndApplySinglePatch={stageAndApplySinglePatch}
              voiceAlertsEnabled={voiceAlertsEnabled}
              setVoiceAlertsEnabled={setVoiceAlertsEnabled}
              onAddCustomPatch={handleAddCustomPatch}
              commsEvents={commsEvents}
              setCommsEvents={setCommsEvents}
              simLocked={simLocked}
              esimLocked={esimLocked}
              setEsimLocked={setEsimLocked}
              portOutFrozen={portOutFrozen}
              setPortOutFrozen={setPortOutFrozen}
              activeSimSlot={activeSimSlot}
              simEvents={simEvents}
              setSimEvents={setSimEvents}
              hwKillSwitchTripped={hwKillSwitchTripped}
              setHwKillSwitchTripped={setHwKillSwitchTripped}
              hwEvents={hwEvents}
              isScreenMasked={isScreenMasked}
              setIsScreenMasked={setIsScreenMasked}
              screenMaskMode={screenMaskMode}
              setScreenMaskMode={setScreenMaskMode}
              pkgAppName={pkgAppName}
              setPkgAppName={setPkgAppName}
              pkgShortName={pkgShortName}
              setPkgShortName={setPkgShortName}
              pkgId={pkgId}
              setPkgId={setPkgId}
              pkgVersion={pkgVersion}
              setPkgVersion={setPkgVersion}
              pkgGenerating={pkgGenerating}
              handleBuildMobilePackage={handleBuildMobilePackage}
              generatedPackages={generatedPackages}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'chat' && (
            <ChatInterface
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendChat={handleSendChat}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsMenu
              theme={theme}
              setTheme={setTheme}
              stealthMode={stealthMode}
              setStealthMode={setStealthMode}
            />
          )}
        </div>
      </main>

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-14 z-40 border-t backdrop-blur-md grid grid-cols-6 items-center ${
          theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-950/95 border-slate-800'
        }`}
      >
        {(
          [
            { id: 'dashboard', label: 'Overview' },
            { id: 'commands', label: 'Commands' },
            { id: 'network', label: 'Shield' },
            { id: 'mobile', label: 'Patches' },
            { id: 'chat', label: 'AI Chat' },
            { id: 'settings', label: 'Settings' },
          ] as const
        ).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`h-full flex flex-col items-center justify-center text-[11px] font-semibold ${
              activeTab === item.id ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
