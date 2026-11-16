import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SecurityStatus, SecurityModule, SecurityLog, AuditExportPayload } from '../types';
import { INITIAL_MODULES } from '../constants';
import DeviceCommandsMonitor from './DeviceCommandsMonitor';
import PacketTrafficChart from './PacketTrafficChart';
import { ScreenMaskGuardPanel } from './ScreenMaskOverlay';
import { audioAnnouncer } from '../services/audioAnnouncer';
import { androidPatchScanner, AndroidPatchScannerSnapshot } from '../services/androidPatchScanner';
import { inboundCommsService, InboundCommsSnapshot } from '../services/inboundCommsService';
import { hardwareIntegrityService } from '../services/hardwareIntegrityService';
import { screenMaskService } from '../services/screenMaskService';
import { simSwitchLockService } from '../services/simSwitchLockService';
import { HardwareIntegrityState, ScreenMaskState, SimSwitchLockState } from '../types';

interface SecurityDashboardProps {
  stealthMode: boolean;
  theme?: 'dark' | 'light';
  onNavigateToCommands?: () => void;
  onNavigateToMobile?: (section?: 'patches' | 'comms' | 'sim_lock' | 'apk') => void;
  onNavigateToNetwork?: (
    section?:
      | 'contacted_domains'
      | 'analytics_blocker'
      | 'node_access'
      | 'cloudflare_packets'
      | 'foreign_states'
      | 'bluetooth_shield'
      | 'hardware_integrity'
      | 'network_sharing'
      | 'packet_concealment'
      | 'nearby_ips'
      | 'firewall_reload'
      | 'location_changer'
      | 'block_domains'
      | 'vpn_proxy_tunnel'
  ) => void;
}

const INITIAL_LOGS: SecurityLog[] = [
  {
    id: 'log-sec-901',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    event: 'Anomalous traffic signature detected on ingress interface',
    status: SecurityStatus.THREAT_DETECTED,
    severity: 'HIGH',
    protocol: 'HTTPS/TLS 1.3',
    origin: 'Gateway-US-East',
    sourceIp: '198.51.100.42',
    destinationPort: 443
  },
  {
    id: 'log-sec-902',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    event: 'Unauthorized packet drop: SYN flood threshold exceeded',
    status: SecurityStatus.BLOCKED,
    severity: 'MEDIUM',
    protocol: 'TCP',
    origin: 'Edge-Proxy-04',
    sourceIp: '203.0.113.195',
    destinationPort: 8080
  },
  {
    id: 'log-sec-903',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    event: 'Heartbeat signal synchronized across distributed nodes',
    status: SecurityStatus.ACTIVE,
    severity: 'INFO',
    protocol: 'gRPC/mTLS',
    origin: 'Node-14',
    sourceIp: '10.0.1.24',
    destinationPort: 50051
  },
  {
    id: 'log-sec-904',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    event: 'Heuristic packet inspection passed zero-knowledge proof',
    status: SecurityStatus.ACTIVE,
    severity: 'LOW',
    protocol: 'TLS 1.3',
    origin: 'Node-88',
    sourceIp: '172.16.4.11',
    destinationPort: 443
  },
  {
    id: 'log-sec-905',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    event: 'Malicious payload signature blocked in encrypted tunnel',
    status: SecurityStatus.BLOCKED,
    severity: 'HIGH',
    protocol: 'SSH/v2',
    origin: 'Node-201',
    sourceIp: '192.0.2.77',
    destinationPort: 22
  },
  {
    id: 'log-sec-906',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    event: 'Biometric authorization credentials validated with HSM',
    status: SecurityStatus.ACTIVE,
    severity: 'INFO',
    protocol: 'FIDO2/WebAuthn',
    origin: 'Auth-Cluster-02',
    sourceIp: '10.0.0.5',
    destinationPort: 8443
  }
];

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  stealthMode,
  theme = 'dark',
  onNavigateToCommands,
  onNavigateToMobile,
  onNavigateToNetwork
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'commands'>('overview');
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState<boolean>(false);
  const [currentSpokenAction, setCurrentSpokenAction] = useState<string | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(audioAnnouncer.getIsMuted());
  const [patchSnapshot, setPatchSnapshot] = useState<AndroidPatchScannerSnapshot>(() =>
    androidPatchScanner.getSnapshot()
  );
  const [commsSnapshot, setCommsSnapshot] = useState<InboundCommsSnapshot>(() =>
    inboundCommsService.getSnapshot()
  );
  const [hwSnapshot, setHwSnapshot] = useState<HardwareIntegrityState>(() =>
    hardwareIntegrityService.getSnapshot()
  );
  const [maskSnapshot, setMaskSnapshot] = useState<ScreenMaskState>(() =>
    screenMaskService.getSnapshot()
  );
  const [simSnapshot, setSimSnapshot] = useState<SimSwitchLockState>(() =>
    simSwitchLockService.getSnapshot()
  );
  const [modules, setModules] = useState<SecurityModule[]>(INITIAL_MODULES as unknown as SecurityModule[]);
  const [logs, setLogs] = useState<SecurityLog[]>(INITIAL_LOGS);
  const [filter, setFilter] = useState<SecurityStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [exportNotification, setExportNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const logsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = audioAnnouncer.subscribe(s => {
      setIsVoiceSpeaking(s.isSpeaking);
      setCurrentSpokenAction(s.currentText);
      setIsVoiceMuted(s.isMuted);
    });
    const unsubPatch = androidPatchScanner.subscribe(setPatchSnapshot);
    const unsubComms = inboundCommsService.subscribe(setCommsSnapshot);
    const unsubHw = hardwareIntegrityService.subscribe(setHwSnapshot);
    const unsubMask = screenMaskService.subscribe(setMaskSnapshot);
    const unsubSim = simSwitchLockService.subscribe(setSimSnapshot);
    return () => {
      unsub();
      unsubPatch();
      unsubComms();
      unsubHw();
      unsubMask();
      unsubSim();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Score calculation
  const securityScore = useMemo(() => {
    const totalHealth = modules.reduce((acc, m) => acc + m.health, 0);
    const avgHealth = totalHealth / modules.length;
    // Penalize score if any module is in THREAT_DETECTED status
    const penalty = modules.filter(m => m.status === SecurityStatus.THREAT_DETECTED).length * 15;
    return Math.max(0, Math.min(100, Math.round(avgHealth - penalty)));
  }, [modules]);

  // Simulate incoming logs and occasional threats
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = [SecurityStatus.ACTIVE, SecurityStatus.BLOCKED, SecurityStatus.THREAT_DETECTED];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const protocols = ['TLS 1.3', 'HTTPS', 'TCP', 'DNS-over-HTTPS', 'SSH/v2', 'gRPC'];
      const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
      const randomIp = `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const now = new Date();

      const newLog: SecurityLog = {
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now.toLocaleTimeString(),
        isoTimestamp: now.toISOString(),
        event: randomStatus === SecurityStatus.THREAT_DETECTED 
          ? 'Anomalous traffic signature detected: atypical packet payload' 
          : randomStatus === SecurityStatus.BLOCKED 
          ? 'Unauthorized packet drop: ingress filtering rule triggered' 
          : 'Heartbeat signal synchronized across neural mesh',
        status: randomStatus,
        severity: randomStatus === SecurityStatus.THREAT_DETECTED 
          ? 'HIGH' 
          : randomStatus === SecurityStatus.BLOCKED 
          ? 'MEDIUM' 
          : 'INFO',
        protocol: randomProtocol,
        origin: `Node-${Math.floor(Math.random() * 255)}`,
        sourceIp: randomIp,
        destinationPort: randomStatus === SecurityStatus.THREAT_DETECTED ? 443 : 8080
      };

      setLogs(prev => [newLog, ...prev].slice(0, 75));

      // If threat detected, update a random module temporarily
      if (randomStatus === SecurityStatus.THREAT_DETECTED) {
        const randomIndex = Math.floor(Math.random() * modules.length);
        const originalStatus = modules[randomIndex].status;
        const originalHealth = modules[randomIndex].health;
        
        setModules(prev => {
          const next = [...prev];
          next[randomIndex] = { ...next[randomIndex], status: SecurityStatus.THREAT_DETECTED, health: Math.max(30, next[randomIndex].health - 15) };
          return next;
        });

        // Resolve after a few seconds
        setTimeout(() => {
          setModules(prev => {
            const next = [...prev];
            next[randomIndex] = { ...next[randomIndex], status: originalStatus as SecurityStatus, health: Math.min(100, originalHealth + 5) };
            return next;
          });
        }, 3500);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [modules]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesFilter = filter === 'ALL' || log.status === filter;
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.event.toLowerCase().includes(q) ||
        log.origin.toLowerCase().includes(q) ||
        (log.sourceIp && log.sourceIp.toLowerCase().includes(q)) ||
        (log.protocol && log.protocol.toLowerCase().includes(q))
      );
    });
  }, [logs, filter, searchQuery]);

  // Construct structured audit export payload
  const buildExportPayload = (scope: 'all' | 'filtered'): AuditExportPayload => {
    const logsToExport = scope === 'filtered' ? filteredLogs : logs;
    return {
      reportHeader: {
        auditTitle: 'SENTINEL Security Operations Center - Network Interception Audit Report',
        exportTimestamp: new Date().toISOString(),
        generatedBy: 'SENTINEL-X AI Security Core (Active Node 01)',
        environment: stealthMode ? 'CLASSIFIED / STEALTH DEFENSE GRID' : 'PRODUCTION DEFENSE GRID',
        systemIntegrityScore: `${securityScore}%`,
        filterApplied: scope === 'filtered' ? filter : 'ALL',
        totalEntries: logsToExport.length,
        threatSummary: {
          active: logsToExport.filter(l => l.status === SecurityStatus.ACTIVE).length,
          blocked: logsToExport.filter(l => l.status === SecurityStatus.BLOCKED).length,
          threatDetected: logsToExport.filter(l => l.status === SecurityStatus.THREAT_DETECTED).length,
        },
        moduleHealthSnapshot: modules.map(m => ({
          id: m.id,
          name: m.name,
          status: m.status,
          health: m.health
        }))
      },
      interceptionLogs: logsToExport
    };
  };

  // Download JSON file directly
  const handleExportJSON = (scope: 'all' | 'filtered' = 'all') => {
    const payload = buildExportPayload(scope);
    if (payload.interceptionLogs.length === 0) {
      setExportNotification({
        type: 'info',
        message: 'No logs available to export for the current selection.'
      });
      setIsExportMenuOpen(false);
      return;
    }

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const safeDate = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sentinel-audit-logs-${scope}-${safeDate}.json`;

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    setIsExportMenuOpen(false);
    setExportNotification({
      type: 'success',
      message: `Successfully exported ${payload.interceptionLogs.length} audit logs to ${filename}`
    });

    setTimeout(() => {
      setExportNotification(null);
    }, 4500);
  };

  const currentPreviewPayload = useMemo(() => {
    return buildExportPayload(filter === 'ALL' && !searchQuery ? 'all' : 'filtered');
  }, [logs, filteredLogs, filter, searchQuery, modules, securityScore, stealthMode]);

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentPreviewPayload, null, 2));
      setCopiedPreview(true);
      setTimeout(() => setCopiedPreview(false), 2500);
    } catch {
      // Fallback
      setCopiedPreview(false);
    }
  };

  const getStatusColor = (status: SecurityStatus) => {
    switch (status) {
      case SecurityStatus.ACTIVE: return 'text-emerald-400';
      case SecurityStatus.BLOCKED: return 'text-amber-400';
      case SecurityStatus.THREAT_DETECTED: return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: SecurityStatus) => {
    switch (status) {
      case SecurityStatus.ACTIVE: return 'bg-emerald-400/10 border-emerald-400/20';
      case SecurityStatus.BLOCKED: return 'bg-amber-400/10 border-amber-400/20';
      case SecurityStatus.THREAT_DETECTED: return 'bg-red-400/10 border-red-400/20';
      default: return 'bg-slate-400/10 border-slate-400/20';
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification for Export */}
      {exportNotification && (
        <div 
          id="export-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in ${
            exportNotification.type === 'success' 
              ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200' 
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}
        >
          <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs">
            <p className="font-bold uppercase tracking-wider text-[10px] text-cyan-400">Audit Export Complete</p>
            <p className="font-medium">{exportNotification.message}</p>
          </div>
          <button 
            onClick={() => setExportNotification(null)}
            className="ml-2 text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs: Threat Matrix vs Device Inbound Commands */}
      <div className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <button
            id="subtab-overview-btn"
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'overview'
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Network Threat Matrix & Logs</span>
          </button>

          <button
            id="subtab-commands-btn"
            onClick={() => setActiveSubTab('commands')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeSubTab === 'commands'
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Device Inbound Commands</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {onNavigateToNetwork && (
            <button
              id="subtab-network-shield-btn"
              onClick={onNavigateToNetwork}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>VPN, Proxy & Domain Shield</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          )}
        </div>

        {/* Live Audio Announcer Status Pill */}
        <div className="flex items-center gap-3 px-3 py-1">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${isVoiceSpeaking ? 'bg-cyan-400 animate-ping' : isVoiceMuted ? 'bg-red-400' : 'bg-emerald-400'}`} />
            <span className="text-[11px] text-slate-400">
              Voice Announcer: <strong className={isVoiceSpeaking ? 'text-cyan-400' : isVoiceMuted ? 'text-red-400' : 'text-emerald-400'}>
                {isVoiceSpeaking ? 'ANNOUNCING NOW' : isVoiceMuted ? 'MUTED' : 'ONLINE'}
              </strong>
            </span>
          </div>

          <button
            id="top-mask-screen-btn"
            type="button"
            onClick={() =>
              maskSnapshot.isMaskEngaged
                ? screenMaskService.disengageMask()
                : screenMaskService.engageManualMask()
            }
            className={`text-[10px] px-2.5 py-1 rounded font-bold border transition-colors whitespace-nowrap ${
              maskSnapshot.isMaskEngaged
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {maskSnapshot.isMaskEngaged ? 'Unmask Screen' : 'Mask Screen'}
          </button>

          <button
            id="top-test-chime-btn"
            onClick={() => {
              if (activeSubTab !== 'commands') {
                setActiveSubTab('commands');
              }
              audioAnnouncer.testAnnouncement();
            }}
            className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 transition-colors"
          >
            Test Chime
          </button>
        </div>
      </div>

      {activeSubTab === 'commands' ? (
        <DeviceCommandsMonitor
          stealthMode={stealthMode}
          theme={theme}
          onNavigateBack={() => setActiveSubTab('overview')}
        />
      ) : (
        <>
          {/* Inbound Commands Live Telemetry Strip on Overview */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isVoiceSpeaking 
              ? 'bg-cyan-950/80 border-cyan-500 shadow-cyan text-cyan-200 animate-pulse'
              : isLight 
              ? 'bg-slate-50 border-slate-200 text-slate-800' 
              : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Target Device Inbound Telemetry</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Channel Online
                  </span>
                </div>
                <p className="text-xs font-medium mt-0.5">
                  {currentSpokenAction ? (
                    <span>Announcing to device: <strong>&ldquo;{currentSpokenAction}&rdquo;</strong></span>
                  ) : (
                    <span className="text-slate-400">Commands sent to your device are announced aloud in real-time.</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('commands')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-cyan transition-all shrink-0 self-start sm:self-auto"
            >
              <span>View Commands Stream & Audio</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Header Section with Score Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`col-span-1 md:col-span-2 glass rounded-2xl p-8 flex items-center justify-between border shadow-cyan ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">System Integrity Score</h2>
            <p className="text-slate-400 max-w-md">Real-time aggregate of heuristic analysis, packet inspection, and neural module stability.</p>
            <div className="flex gap-4">
               <div className="px-3 py-1 rounded bg-cyan-500/10 text-cyan-500 text-xs font-bold border border-cyan-500/20 uppercase">Core Optimal</div>
               <div className="px-3 py-1 rounded bg-slate-500/10 text-slate-500 text-xs font-bold border border-slate-500/20 uppercase">Live Interception Active</div>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80" cy="80" r="70"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                className={isLight ? 'text-slate-200' : 'text-slate-800'}
              />
              <circle
                cx="80" cy="80" r="70"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * securityScore) / 100}
                strokeLinecap="round"
                className={`${securityScore > 80 ? 'text-cyan-400' : securityScore > 50 ? 'text-amber-400' : 'text-red-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-4xl font-black mono">
                {stealthMode ? `0x${securityScore.toString(16).toUpperCase()}` : `${securityScore}%`}
               </span>
               <span className="text-[10px] uppercase font-bold text-slate-500">Integrity</span>
            </div>
          </div>
        </div>

        <div className={`glass rounded-2xl p-8 flex flex-col justify-between border ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
           <div className="space-y-1">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-widest">Active Threats Intercepted</h3>
              <p className="text-4xl font-black">{logs.filter(l => l.status === SecurityStatus.THREAT_DETECTED).length}</p>
           </div>
           <div className={`pt-4 mt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                 <span>NEURAL UPTIME</span>
                 <span>99.99%</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                 <div className="h-full bg-cyan-500 w-[99%]" />
              </div>
           </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {modules.map(module => (
          <div 
            key={module.id} 
            className={`glass rounded-xl p-5 border transition-all duration-300 ${module.status === SecurityStatus.THREAT_DETECTED ? 'border-red-500/50 shadow-red animate-pulse' : isLight ? 'border-slate-200' : 'border-slate-800'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg text-cyan-400 ${isLight ? 'bg-slate-100' : 'bg-slate-900'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBg(module.status)} ${getStatusColor(module.status)}`}>
                {module.status}
              </span>
            </div>
            <h4 className="font-semibold text-sm mb-1">{module.name}</h4>
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                <div 
                  className={`h-full transition-all duration-500 ${module.health > 80 ? 'bg-cyan-500' : 'bg-red-500'}`} 
                  style={{ width: `${module.health}%` }} 
                />
              </div>
              <span className="text-[10px] text-slate-500 mono">{module.health}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Network Shield & Domain Sinkhole Operational Highlight Card */}
      {onNavigateToNetwork && (
        <div className={`glass rounded-2xl p-5 border flex flex-col gap-4 transition-all shadow-cyan ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/40'
        }`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-cyan">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm tracking-tight text-white">Active Defense Perimeter & Network Shield</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    All Subsystems Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 mono">
                  <span>Cloudflare: <strong className="text-rose-400">Incoming Dropped</strong></span>
                  <span>Analytics: <strong className="text-rose-400">Zero Logging</strong></span>
                  <span>Node Access: <strong className="text-amber-400">100% Blocked</strong></span>
                  <span>Foreign States: <strong className="text-rose-400">All Blocked</strong></span>
                  <span>Bluetooth: <strong className="text-cyan-400">Radio Killed</strong></span>
                  <span>Packets: <strong className="text-emerald-400">Concealed</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToNetwork('foreign_states')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-cyan transition-all shrink-0 self-end lg:self-auto"
            >
              <span>Foreign & RF Shield</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* Quick Engine Jump Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 pt-3 border-t border-slate-800">
            <button
              id="dash-quick-analytics-btn"
              onClick={() => onNavigateToNetwork('analytics_blocker')}
              className="px-2.5 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                <span>Analytics</span>
                <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-200">ZERO LOG</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Telemetry Block</span>
            </button>

            <button
              id="dash-quick-node-access-btn"
              onClick={() => onNavigateToNetwork('node_access')}
              className="px-2.5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>Node Access</span>
                <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-200">BLOCKED</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Zero Node Ingress</span>
            </button>

            <button
              id="dash-quick-cloudflare-btn"
              onClick={() => onNavigateToNetwork('cloudflare_packets')}
              className="px-2.5 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                <span>Cloudflare</span>
                <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-200">DROP 100%</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Incoming Packets</span>
            </button>

            <button
              id="dash-quick-foreign-states-btn"
              onClick={() => onNavigateToNetwork('foreign_states')}
              className="px-2.5 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                <span>Foreign States</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Geoblock Defense</span>
            </button>

            <button
              id="dash-quick-bluetooth-btn"
              onClick={() => onNavigateToNetwork('bluetooth_shield')}
              className="px-2.5 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                <span>Bluetooth Kill</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Zero Pairing</span>
            </button>

            <button
              id="dash-quick-hardware-btn"
              onClick={() => onNavigateToNetwork('hardware_integrity')}
              className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                hwSnapshot.killSwitchTripped
                  ? 'border-rose-500 bg-rose-500/20 hover:bg-rose-500/30'
                  : 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                <span>HW Integrity</span>
                <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-200">
                  {hwSnapshot.killSwitchTripped ? 'KILLED' : 'GUARD'}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">OTG & Audio Jack</span>
            </button>

            <button
              id="dash-quick-sharing-btn"
              onClick={() => onNavigateToNetwork('network_sharing')}
              className="px-2.5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>Sharing Block</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">SMB/NFS/AFP Drop</span>
            </button>

            <button
              id="dash-quick-packet-btn"
              onClick={() => onNavigateToNetwork('packet_concealment')}
              className="px-2.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                <span>Anti-DPI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Conceal Traffic</span>
            </button>

            <button
              onClick={() => onNavigateToNetwork('firewall_reload')}
              className="px-2.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                <span>1-Min Reload</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">60s Auto-Reload</span>
            </button>

            <button
              onClick={() => onNavigateToNetwork('location_changer')}
              className="px-2.5 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                <span>Location Hop</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Multi-Country</span>
            </button>

            <button
              onClick={() => onNavigateToNetwork('nearby_ips')}
              className="px-2.5 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
                <span>Nearby IPs</span>
                <span className="text-[9px] px-1 rounded bg-rose-500/30 text-rose-200">BLOCKED</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">Subnet Intrusions</span>
            </button>

            <button
              id="dash-quick-vpn-btn"
              onClick={() => onNavigateToNetwork('vpn_proxy_tunnel')}
              className="px-2.5 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                <span>VPN & Tunnel</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <span className="text-[9px] text-slate-400 block mt-0.5">mTLS & SOCKS5</span>
            </button>
          </div>
        </div>
      )}

      {/* D3.js Real-Time Packet Volume & Block Activity Line Chart */}
      <PacketTrafficChart
        theme={theme}
        stealthMode={stealthMode}
        latestLog={logs[0] || null}
        onNavigateToLogs={() => {
          logsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Mobile Phone Patch Scanner & Incoming Calls/Messages Live Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phone System Patch & Update Status Card */}
        {(() => {
          const ecoPatches = patchSnapshot.patches.filter(
            p => p.ecosystem === patchSnapshot.profile.ecosystem
          );
          const pending = ecoPatches.filter(p => p.status !== 'INSTALLED');
          const critical = pending.filter(p => p.severity === 'CRITICAL');

          return (
            <div className={`glass rounded-2xl border p-6 flex flex-col justify-between gap-4 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    Phone System Patches & Updates
                  </span>
                  <h3 className="text-lg font-bold mt-0.5">
                    {stealthMode ? 'REDACTED ANDROID DEVICE' : patchSnapshot.profile.modelName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {patchSnapshot.profile.osVersion} · SPL{' '}
                    <span className="font-mono tabular-nums text-slate-200">
                      {patchSnapshot.profile.currentSecurityPatchLevel}
                    </span>
                  </p>
                </div>

                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                    critical.length > 0
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      : pending.length > 0
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {critical.length > 0
                    ? `${critical.length} CRITICAL`
                    : pending.length > 0
                    ? `${pending.length} PENDING`
                    : 'UP TO DATE'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Pending</span>
                  <span className="font-mono font-bold tabular-nums text-base text-amber-400">
                    {pending.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Auto-Poll</span>
                  <span className="font-mono font-bold tabular-nums text-base text-cyan-400">
                    {patchSnapshot.isScanning
                      ? 'Scan...'
                      : patchSnapshot.autoPollEnabled
                      ? `${patchSnapshot.nextScanCountdownSec}s`
                      : 'Paused'}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Voice Alert</span>
                  <span className="font-mono font-bold text-base text-emerald-400">
                    {patchSnapshot.voiceAlertsEnabled ? 'Armed' : 'Muted'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-mono">
                  Last scan: {patchSnapshot.lastScanTimestamp}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => androidPatchScanner.scanNow()}
                    disabled={patchSnapshot.isScanning}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-500/10 disabled:opacity-50"
                  >
                    {patchSnapshot.isScanning ? 'Scanning...' : 'Scan Now'}
                  </button>
                  {onNavigateToMobile && (
                    <button
                      type="button"
                      onClick={() => onNavigateToMobile('patches')}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                    >
                      Open Patch Scanner
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Incoming Messages & Phone Calls Live Card */}
        <div className={`glass rounded-2xl border p-6 flex flex-col justify-between gap-4 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Incoming Messages & Phone Calls
              </span>
              <h3 className="text-lg font-bold mt-0.5">Live Call & SMS Screening Feed</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {commsSnapshot.totalCallsReceived} calls · {commsSnapshot.totalMessagesReceived} messages ·{' '}
                <span className="text-rose-400 font-semibold">{commsSnapshot.totalBlockedComms} blocked</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => inboundCommsService.simulateIncoming('CALL')}
                className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-500/10"
              >
                + Call
              </button>
              <button
                type="button"
                onClick={() => inboundCommsService.simulateIncoming('MESSAGE')}
                className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-500/10"
              >
                + SMS
              </button>
            </div>
          </div>

          <div className="space-y-2" data-sensitive-data="true">
            {commsSnapshot.events.slice(0, 3).map(ev => (
              <div
                key={ev.id}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400">{ev.channel}</span>
                    <span className="font-semibold truncate">
                      {stealthMode ? 'REDACTED' : ev.senderName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {ev.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-400 truncate mt-0.5">{ev.previewText}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    ev.status === 'BLOCKED'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      : ev.status === 'SUSPICIOUS'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {ev.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500">
              STIR/SHAKEN & smishing filter active
            </span>
            {onNavigateToMobile && (
              <button
                type="button"
                onClick={() => onNavigateToMobile('comms')}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
              >
                View All Calls & Messages
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SIM Switch Lock Status Strip */}
      <div
        className={`glass rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          simSnapshot.lockdownTripped
            ? 'border-rose-500 bg-rose-950/30'
            : isLight
            ? 'border-slate-200 bg-white'
            : 'border-slate-800 bg-slate-900/50'
        }`}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-cyan-400">
              SIM Switch Lock &amp; Port-Out Freeze
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span
              className={`font-mono font-bold ${
                simSnapshot.lockdownTripped
                  ? 'text-rose-400'
                  : simSnapshot.simSwitchLocked
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {simSnapshot.lockdownTripped
                ? 'SWAP LOCKDOWN TRIPPED'
                : simSnapshot.simSwitchLocked
                ? 'LOCKED (PIN PROTECTED)'
                : 'UNLOCKED'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Active slot:{' '}
            <strong className="text-slate-200">
              {simSnapshot.activeSlot === 'ESIM_PROFILE_2' ? 'Slot 2 (eSIM)' : 'Slot 1 (Physical SIM)'}
            </strong>{' '}
            · Bound ICCID:{' '}
            <span className="font-mono tabular-nums text-slate-300" data-sensitive-data="true">
              {stealthMode ? 'REDACTED-ICCID' : simSnapshot.boundPrimaryIccid}
            </span>{' '}
            · {simSnapshot.totalSwapAttemptsBlocked} swap attempts blocked
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => simSwitchLockService.simulateSwapThreat('physical_swap')}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold whitespace-nowrap"
          >
            Test Swap Block
          </button>
          {onNavigateToMobile && (
            <button
              type="button"
              onClick={() => onNavigateToMobile('sim_lock')}
              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold whitespace-nowrap"
            >
              Manage SIM Switch Lock
            </button>
          )}
        </div>
      </div>

      {/* Screen-Masking Overlay & Capture Guard Controls */}
      <ScreenMaskGuardPanel theme={theme} />

      {/* Log History & Audit Export Section */}
      <div ref={logsSectionRef} className={`glass rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        {/* Card Header with Controls & Export Actions */}
        <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-900/30'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-widest">Network Interception Logs</h3>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  {filteredLogs.length} / {logs.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">Live packet inspection trail for security auditing & compliance verification</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search event, IP, node..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`text-xs rounded-lg px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border transition-all ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' 
                    : 'bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className={`flex rounded-lg p-0.5 border ${isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
              {(['ALL', SecurityStatus.ACTIVE, SecurityStatus.BLOCKED, SecurityStatus.THREAT_DETECTED] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    filter === s 
                      ? 'bg-cyan-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s === 'ALL' ? 'ALL' : s === SecurityStatus.THREAT_DETECTED ? 'THREATS' : s}
                </button>
              ))}
            </div>

            {/* Export Actions Menu */}
            <div className="relative" ref={dropdownRef}>
              <div className="inline-flex rounded-lg shadow-sm">
                <button
                  id="export-json-primary-btn"
                  onClick={() => handleExportJSON(filter === 'ALL' && !searchQuery ? 'all' : 'filtered')}
                  title="Export audit logs to downloadable JSON"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 border border-cyan-500/30 transition-colors shadow-cyan"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export JSON</span>
                </button>
                <button
                  id="export-json-menu-toggle"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  title="Export Options"
                  className="px-2 py-1.5 rounded-r-lg text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-600 border-t border-b border-r border-cyan-500/30 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Dropdown Options */}
              {isExportMenuOpen && (
                <div className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-2xl py-2 z-50 backdrop-blur-lg animate-in ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700 text-white'
                }`}>
                  <div className="px-3 py-1.5 border-b border-slate-700/50 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Audit Export</p>
                    <p className="text-[11px] text-slate-500">RFC 8259 compliant structured JSON for SIEM ingestion</p>
                  </div>

                  <button
                    id="export-filtered-logs-btn"
                    onClick={() => handleExportJSON('filtered')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span>Export Filtered View</span>
                    </span>
                    <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {filteredLogs.length} items
                    </span>
                  </button>

                  <button
                    id="export-all-logs-btn"
                    onClick={() => handleExportJSON('all')}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Export Full Audit Trail</span>
                    </span>
                    <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {logs.length} items
                    </span>
                  </button>

                  <div className="border-t border-slate-700/50 my-1 pt-1">
                    <button
                      id="preview-json-btn"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        setIsPreviewOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Preview Audit JSON Schema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[10px] text-slate-500 uppercase font-bold tracking-tighter sticky top-0 z-10 ${
                isLight ? 'bg-slate-100 border-b border-slate-200' : 'bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm'
              }`}>
                <th className="px-6 py-3">Timestamp / ISO</th>
                <th className="px-6 py-3">Event Description</th>
                <th className="px-6 py-3">Protocol / Port</th>
                <th className="px-6 py-3">Origin & IP</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody data-sensitive-data="true" className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
              {filteredLogs.map(log => (
                <tr key={log.id} className={`text-xs transition-colors ${isLight ? 'hover:bg-slate-100/60' : 'hover:bg-slate-900/40'}`}>
                  <td className="px-6 py-3.5">
                    <div className="mono font-medium">{log.timestamp}</div>
                    <div className="text-[10px] text-slate-500 mono truncate max-w-[140px]">{log.isoTimestamp || 'UTC'}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium">{log.event}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] mono text-slate-500">{log.id}</span>
                      {log.severity && (
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="mono text-xs font-semibold text-cyan-400">{log.protocol || 'TCP'}</div>
                    <div className="text-[10px] text-slate-500 mono">Port: {log.destinationPort || 443}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="mono font-semibold">{log.origin}</div>
                    <div className="text-[10px] text-slate-500 mono">{log.sourceIp || '10.0.0.1'}</div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className={`inline-block text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBg(log.status)} ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic uppercase tracking-widest text-[10px]">
                    No network logs matching current filter or search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className={`px-6 py-3 border-t flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'}`}>
          <div className="flex items-center gap-4">
            <span>Buffer: <strong className="mono">{logs.length} events recorded</strong></span>
            <span>Active Threats: <strong className="mono text-red-400">{logs.filter(l => l.status === SecurityStatus.THREAT_DETECTED).length}</strong></span>
            <span>Blocked: <strong className="mono text-amber-400">{logs.filter(l => l.status === SecurityStatus.BLOCKED).length}</strong></span>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => handleExportJSON('all')}
              className="text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider text-[10px] underline underline-offset-4"
            >
              Export JSON ({logs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Audit JSON Preview Modal */}
      {isPreviewOpen && (
        <div 
          id="audit-preview-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Security Audit JSON Payload</h3>
                  <p className="text-xs text-slate-500">Previewing downloadable JSON file formatted for compliance auditing</p>
                </div>
              </div>

              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Subheader Metrics */}
            <div className={`px-6 py-3 border-b flex flex-wrap gap-4 text-xs ${isLight ? 'border-slate-200 bg-slate-100/50' : 'border-slate-800 bg-slate-900/30'}`}>
              <div>
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Log Entries</span>
                <span className="mono font-bold text-cyan-400">{currentPreviewPayload.interceptionLogs.length}</span>
              </div>
              <div className="border-l border-slate-700/50 pl-4">
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Integrity Score</span>
                <span className="mono font-bold text-emerald-400">{currentPreviewPayload.reportHeader.systemIntegrityScore}</span>
              </div>
              <div className="border-l border-slate-700/50 pl-4">
                <span className="text-slate-500 uppercase text-[10px] font-bold block">Threats in Payload</span>
                <span className="mono font-bold text-red-400">{currentPreviewPayload.reportHeader.threatSummary.threatDetected}</span>
              </div>
              <div className="border-l border-slate-700/50 pl-4">
                <span className="text-slate-500 uppercase text-[10px] font-bold block">File Format</span>
                <span className="mono font-bold text-slate-300">application/json</span>
              </div>
            </div>

            {/* Monospace JSON Code View */}
            <div data-sensitive-data="true" className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs text-cyan-300/90 leading-relaxed select-text">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(currentPreviewPayload, null, 2)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className={`px-6 py-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
              <button
                id="copy-audit-json-btn"
                onClick={handleCopyPreview}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {copiedPreview ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  id="download-from-preview-btn"
                  onClick={() => {
                    handleExportJSON(filter === 'ALL' && !searchQuery ? 'all' : 'filtered');
                    setIsPreviewOpen(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-cyan transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download JSON File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SecurityDashboard;
