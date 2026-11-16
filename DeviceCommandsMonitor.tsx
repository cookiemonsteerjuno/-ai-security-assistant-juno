import React, { useState, useEffect, useRef } from 'react';
import { DeviceCommand, CommandSeverity, CommandExecutionStatus } from '../types';
import { audioAnnouncer } from '../services/audioAnnouncer';

interface DeviceCommandsMonitorProps {
  stealthMode?: boolean;
  theme?: 'dark' | 'light';
  onNavigateBack?: () => void;
}

const SAMPLE_DISPATCHERS = [
  'SOC Security Core (US-East)',
  'Autonomous Threat Daemon #07',
  'Admin SecOps Remote Terminal',
  'Kernel Integrity Watcher',
  'Zero-Trust Access Controller',
  'Incident Response Automation',
  'Distributed Endpoint Guardian'
];

const PRESET_COMMANDS: Array<{
  actionSummary: string;
  commandText: string;
  category: DeviceCommand['category'];
  severity: CommandSeverity;
  spokenAnnouncement: string;
}> = [
  {
    actionSummary: 'Isolate Network Interface',
    commandText: 'isolate_network_interface --adapter eth0 --immediate --log-route',
    category: 'NETWORK',
    severity: 'CRITICAL',
    spokenAnnouncement: 'Warning! Critical command dispatched to device: Isolate Network Interface.'
  },
  {
    actionSummary: 'Flush DNS Cache & Reload Firewall',
    commandText: 'flush_dns_cache && iptables-restore < /etc/sentinel/rules.v4',
    category: 'NETWORK',
    severity: 'ELEVATED',
    spokenAnnouncement: 'Elevated command sent to device: Flush DNS Cache and Reload Firewall.'
  },
  {
    actionSummary: 'Rotate Ephemeral Cryptographic Keys',
    commandText: 'rotate_session_keys --algorithm ed25519 --hsm-pin $HSM_TOKEN',
    category: 'ENCRYPTION',
    severity: 'STANDARD',
    spokenAnnouncement: 'Command received: Rotate Ephemeral Cryptographic Keys.'
  },
  {
    actionSummary: 'Quarantine Suspicious Process Memory',
    commandText: 'kill_and_quarantine --pid 8912 --dump-core /var/log/sentinel/dump',
    category: 'SYSTEM',
    severity: 'CRITICAL',
    spokenAnnouncement: 'Alert! Critical command received: Quarantine Suspicious Process Memory.'
  },
  {
    actionSummary: 'Deep System Integrity Verification',
    commandText: 'sys_integrity_verify --deep-scan --verify-signatures --report',
    category: 'TELEMETRY',
    severity: 'STANDARD',
    spokenAnnouncement: 'Command dispatched to device: Deep System Integrity Verification.'
  },
  {
    actionSummary: 'Enforce Zero-Trust Biometric Re-auth',
    commandText: 'enforce_reauth --timeout 30s --require-fido2-touch',
    category: 'ACCESS_CONTROL',
    severity: 'ELEVATED',
    spokenAnnouncement: 'Elevated command sent to device: Enforce Zero-Trust Biometric Re-authentication.'
  },
  {
    actionSummary: 'Deploy Critical Security Micro-Patch',
    commandText: 'apply_hotpatch --cve CVE-2026-4401 --target kernel_net_filter',
    category: 'PATCH',
    severity: 'CRITICAL',
    spokenAnnouncement: 'Priority command dispatched: Deploy Critical Security Micro-Patch.'
  },
  {
    actionSummary: 'Synchronize Inbound Packet Telemetry',
    commandText: 'sync_telemetry_beacon --rate 1000hz --channel secure_tls',
    category: 'TELEMETRY',
    severity: 'ROUTINE',
    spokenAnnouncement: 'Routine command sent to device: Synchronize Inbound Packet Telemetry.'
  }
];

interface CommandCatalogEntry {
  id: string;
  actionSummary: string;
  commandText: string;
  category: DeviceCommand['category'];
  severity: CommandSeverity;
  description: string;
  authorizationPolicy: string;
  spokenAnnouncement: string;
}

const AVAILABLE_COMMANDS_CATALOG: CommandCatalogEntry[] = [
  ...PRESET_COMMANDS.map((cmd, index) => ({
    id: `CAT-0${index + 1}`,
    ...cmd,
    description:
      cmd.category === 'NETWORK'
        ? 'Controls host network interface isolation, DNS cache flushing, and kernel firewall rule reloads.'
        : cmd.category === 'ENCRYPTION'
        ? 'Rotates ephemeral cryptographic session keys using Ed25519 and HSM-backed entropy.'
        : cmd.category === 'PATCH'
        ? 'Stages and applies signed kernel or Android Security Patch Level micro-updates.'
        : cmd.category === 'ACCESS_CONTROL'
        ? 'Enforces zero-trust FIDO2 / biometric re-authentication across active sessions.'
        : cmd.category === 'SYSTEM'
        ? 'Terminates and quarantines anomalous process memory segments for forensic review.'
        : 'Synchronizes endpoint integrity and packet inspection telemetry beacons.',
    authorizationPolicy:
      cmd.severity === 'CRITICAL'
        ? 'Requires Sentinel Core + Signed Policy'
        : 'Standard SecOps Auto-Approved',
  })),
  {
    id: 'CAT-09',
    actionSummary: 'Block All Foreign State Transit & Geo-Routes',
    commandText: 'sentinel_geoshield --block-foreign-asns --drop-transit --strict',
    category: 'NETWORK',
    severity: 'CRITICAL',
    description: 'Drops inbound and outbound routing through restricted foreign autonomous systems.',
    authorizationPolicy: 'Requires Sentinel Core + Signed Policy',
    spokenAnnouncement: 'Critical command dispatched: Block all foreign state transit routes.',
  },
  {
    id: 'CAT-10',
    actionSummary: 'Kill Bluetooth & Nearby RF Discovery Radios',
    commandText: 'rf_killswitch --bluetooth off --uwb off --prevent-pairing',
    category: 'ACCESS_CONTROL',
    severity: 'ELEVATED',
    description: 'Disables Bluetooth pairing advertisements, BLE beacons, and nearby device discovery.',
    authorizationPolicy: 'Standard SecOps Auto-Approved',
    spokenAnnouncement: 'Elevated command sent to device: Kill Bluetooth and RF discovery radios.',
  },
  {
    id: 'CAT-11',
    actionSummary: 'Sinkhole Analytics & Telemetry Domains',
    commandText: 'dns_sinkhole --profile zero-analytics --target 0.0.0.0 --flush',
    category: 'NETWORK',
    severity: 'STANDARD',
    description: 'Null-routes tracker endpoints, beacon APIs, and crash telemetry collectors.',
    authorizationPolicy: 'Standard SecOps Auto-Approved',
    spokenAnnouncement: 'Command dispatched: Sinkhole analytics and telemetry domains.',
  },
  {
    id: 'CAT-12',
    actionSummary: 'Scan Android System Patches & CVE Bulletins',
    commandText: 'patch_scanner --target android --channels aosp,oem,mainline,kernel',
    category: 'PATCH',
    severity: 'STANDARD',
    description: 'Triggers an immediate verification sweep across Pixel, Samsung, and AOSP patch feeds.',
    authorizationPolicy: 'Standard SecOps Auto-Approved',
    spokenAnnouncement: 'Command dispatched: Scan Android system patches and CVE bulletins.',
  },
];

const INITIAL_COMMANDS: DeviceCommand[] = [
  {
    id: 'CMD-8492',
    timestamp: new Date(Date.now() - 1000 * 45).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    targetDevice: 'My Device [SEC-WORKSTATION-X1]',
    sourceDispatcher: 'SOC Security Core (US-East)',
    commandText: 'sync_telemetry_beacon --rate 1000hz --channel secure_tls',
    actionSummary: 'Synchronize Inbound Packet Telemetry',
    category: 'TELEMETRY',
    severity: 'ROUTINE',
    status: 'SUCCESS',
    authorizedBy: 'Sentinel Autonomous Core',
    spokenAnnouncement: 'Routine command sent to device: Synchronize Inbound Packet Telemetry.'
  },
  {
    id: 'CMD-8491',
    timestamp: new Date(Date.now() - 1000 * 120).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    targetDevice: 'My Device [SEC-WORKSTATION-X1]',
    sourceDispatcher: 'Autonomous Threat Daemon #07',
    commandText: 'rotate_session_keys --algorithm ed25519 --hsm-pin $HSM_TOKEN',
    actionSummary: 'Rotate Ephemeral Cryptographic Keys',
    category: 'ENCRYPTION',
    severity: 'STANDARD',
    status: 'SUCCESS',
    authorizedBy: 'Sentinel Key Vault',
    spokenAnnouncement: 'Command received: Rotate Ephemeral Cryptographic Keys.'
  },
  {
    id: 'CMD-8490',
    timestamp: new Date(Date.now() - 1000 * 240).toLocaleTimeString(),
    isoTimestamp: new Date(Date.now() - 1000 * 240).toISOString(),
    targetDevice: 'My Device [SEC-WORKSTATION-X1]',
    sourceDispatcher: 'Incident Response Automation',
    commandText: 'flush_dns_cache && iptables-restore < /etc/sentinel/rules.v4',
    actionSummary: 'Flush DNS Cache & Reload Firewall',
    category: 'NETWORK',
    severity: 'ELEVATED',
    status: 'ENFORCED',
    authorizedBy: 'SecOps Rule #104',
    spokenAnnouncement: 'Elevated command sent to device: Flush DNS Cache and Reload Firewall.'
  }
];

export const DeviceCommandsMonitor: React.FC<DeviceCommandsMonitorProps> = ({
  stealthMode = false,
  theme = 'dark',
  onNavigateBack
}) => {
  const [commands, setCommands] = useState<DeviceCommand[]>(INITIAL_COMMANDS);
  const [isMuted, setIsMuted] = useState<boolean>(audioAnnouncer.getIsMuted());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpokenText, setCurrentSpokenText] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(audioAnnouncer.getIsUnlocked());
  const [autoSimulate, setAutoSimulate] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom command form
  const [customCommandInput, setCustomCommandInput] = useState<string>('');
  const [customActionSummary, setCustomActionSummary] = useState<string>('');
  const [customSeverity, setCustomSeverity] = useState<CommandSeverity>('ELEVATED');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'ALL' | DeviceCommand['category']>('ALL');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [showAllCommandsCatalog, setShowAllCommandsCatalog] = useState<boolean>(true);

  const isLight = theme === 'light';
  const audioUnlockedRef = useRef(audioUnlocked);
  audioUnlockedRef.current = audioUnlocked;

  // Listen to audio announcer updates
  useEffect(() => {
    const unsubscribe = audioAnnouncer.subscribe(state => {
      setIsSpeaking(state.isSpeaking);
      setCurrentSpokenText(state.currentText);
      setIsMuted(state.isMuted);
    });
    return () => unsubscribe();
  }, []);

  // Dispatch a command into the device stream and announce it
  const dispatchCommand = (cmdData: {
    commandText: string;
    actionSummary: string;
    category: DeviceCommand['category'];
    severity: CommandSeverity;
    sourceDispatcher?: string;
    spokenAnnouncement?: string;
  }) => {
    const now = new Date();
    const newCmd: DeviceCommand = {
      id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: now.toLocaleTimeString(),
      isoTimestamp: now.toISOString(),
      targetDevice: 'My Device [SEC-WORKSTATION-X1]',
      sourceDispatcher: cmdData.sourceDispatcher || SAMPLE_DISPATCHERS[Math.floor(Math.random() * SAMPLE_DISPATCHERS.length)],
      commandText: cmdData.commandText,
      actionSummary: cmdData.actionSummary,
      category: cmdData.category,
      severity: cmdData.severity,
      status: cmdData.severity === 'CRITICAL' ? 'ENFORCED' : 'SUCCESS',
      authorizedBy: 'Sentinel Autonomous Core',
      spokenAnnouncement: cmdData.spokenAnnouncement
    };

    setCommands(prev => [newCmd, ...prev].slice(0, 100));

    // Announce the command as it comes!
    audioAnnouncer.announceCommand(newCmd);
  };

  // Automated inbound command generator
  useEffect(() => {
    if (!autoSimulate) return;

    const intervalMs = streamSpeed === 'fast' ? 4500 : streamSpeed === 'slow' ? 14000 : 8000;
    const interval = setInterval(() => {
      const preset = PRESET_COMMANDS[Math.floor(Math.random() * PRESET_COMMANDS.length)];
      dispatchCommand(preset);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoSimulate, streamSpeed]);

  const handleManualDispatch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customCommandInput.trim()) return;

    setIsDispatching(true);
    const summary = customActionSummary.trim() || customCommandInput.split(' ')[0].replace(/_/g, ' ').toUpperCase();

    dispatchCommand({
      commandText: customCommandInput.trim(),
      actionSummary: summary,
      category: 'SYSTEM',
      severity: customSeverity,
      sourceDispatcher: 'Manual Console Operator (Local Session)',
      spokenAnnouncement: `Alert! Manual command sent to device: ${summary}`
    });

    setCustomCommandInput('');
    setCustomActionSummary('');
    setTimeout(() => setIsDispatching(false), 600);
  };

  const handleUnlockAudio = () => {
    audioAnnouncer.unlockAudio();
    setAudioUnlocked(true);
    audioAnnouncer.testAnnouncement();
  };

  const handleCopyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCommands = commands.filter(cmd => {
    if (severityFilter !== 'ALL' && cmd.severity !== severityFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cmd.commandText.toLowerCase().includes(q) ||
      cmd.actionSummary.toLowerCase().includes(q) ||
      cmd.sourceDispatcher.toLowerCase().includes(q) ||
      cmd.id.toLowerCase().includes(q)
    );
  });

  const getSeverityBadge = (severity: CommandSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/30 font-black';
      case 'ELEVATED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold';
      case 'STANDARD':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 font-semibold';
      case 'ROUTINE':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getCategoryBadge = (category: DeviceCommand['category']) => {
    switch (category) {
      case 'NETWORK': return 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5';
      case 'ACCESS_CONTROL': return 'text-purple-400 border-purple-500/20 bg-purple-500/5';
      case 'ENCRYPTION': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
      case 'SYSTEM': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'PATCH': return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in">
      {/* Target Device Status & Audio Announcer Top Bar */}
      <div className={`glass rounded-2xl p-6 border shadow-cyan relative overflow-hidden ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Device Profile */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-cyan-500">Target Endpoint</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Inbound Command Channel Online
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-0.5">
                {stealthMode ? 'REDACTED DEVICE' : 'My Device (Host Node 01)'}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1 mono">
                <span>IP: 192.168.1.140</span>
                <span>MAC: 00:1A:2B:3C:4D:5E</span>
                <span>Agent: Sentinel-EDR v4.8.2</span>
              </div>
            </div>
          </div>

          {/* Voice Announcer Controller */}
          <div className={`flex flex-wrap items-center gap-3 p-3 rounded-xl border ${
            isLight ? 'bg-slate-100/80 border-slate-300' : 'bg-slate-900/80 border-slate-800'
          }`}>
            {/* Audio Waveform / Announcer Status */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <div className="flex items-end gap-0.5 h-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isSpeaking && !isMuted
                        ? 'bg-cyan-400 animate-pulse'
                        : !isMuted
                        ? 'bg-slate-600'
                        : 'bg-red-500/50'
                    }`}
                    style={{
                      height: isSpeaking && !isMuted ? `${(i * 5) % 18 + 4}px` : '4px'
                    }}
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audio Announcer</p>
                <p className="text-xs font-bold mono">
                  {isMuted ? (
                    <span className="text-red-400">MUTED</span>
                  ) : isSpeaking ? (
                    <span className="text-cyan-400 animate-pulse">ANNOUNCING NOW</span>
                  ) : (
                    <span className="text-emerald-400">ACTIVE & READY</span>
                  )}
                </p>
              </div>
            </div>

            {/* Mute / Unmute Button */}
            <button
              id="toggle-voice-announcer-btn"
              onClick={() => {
                if (!audioUnlocked) handleUnlockAudio();
                const nextMute = audioAnnouncer.toggleMute();
                setIsMuted(nextMute);
              }}
              title={isMuted ? 'Enable Voice Announcements' : 'Mute Voice Announcements'}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                !isMuted 
                  ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/30 shadow-cyan' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {!isMuted ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <span>Voice ON</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Unmute Voice</span>
                </>
              )}
            </button>

            {/* Test Voice Button */}
            <button
              id="test-announcement-btn"
              onClick={handleUnlockAudio}
              title="Test audio announcement chime and speech"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Test Chime</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Audio Broadcast Announcement HUD Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
        isSpeaking
          ? 'bg-cyan-950/80 border-cyan-500 shadow-cyan text-cyan-200'
          : isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-slate-900/60 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSpeaking ? 'bg-cyan-500/20 text-cyan-400 animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 00-3 3v2a3 3 0 003 3h3.763l7.79 3.894A1 1 0 0018 17V3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                {isSpeaking ? '● LIVE VOICE ANNOUNCEMENT' : 'ANNOUNCER STANDBY'}
              </span>
              {isSpeaking && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold animate-pulse">
                  SPEAKING IN REAL-TIME
                </span>
              )}
            </div>
            <p className="text-sm font-semibold mt-0.5">
              {currentSpokenText ? (
                <span>&ldquo;{currentSpokenText}&rdquo;</span>
              ) : (
                <span className="text-slate-500 italic">Listening for inbound control commands... incoming commands will be announced aloud as they arrive.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] mono text-slate-400 hidden sm:inline">Stream:</span>
          <button
            onClick={() => setAutoSimulate(!autoSimulate)}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
              autoSimulate 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {autoSimulate ? '● Inbound Live' : '❚❚ Paused'}
          </button>
          <select
            value={streamSpeed}
            onChange={e => setStreamSpeed(e.target.value as any)}
            className={`text-xs rounded px-2 py-1 border focus:outline-none ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <option value="fast">Fast (4.5s)</option>
            <option value="normal">Normal (8s)</option>
            <option value="slow">Slow (14s)</option>
          </select>
        </div>
      </div>

      {/* Manual Command Dispatcher Console */}
      <div className={`glass rounded-2xl p-6 border ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="font-bold text-sm uppercase tracking-widest">Manual Command Dispatcher</h3>
          </div>
          <span className="text-xs text-slate-500">Send custom commands directly to your device and hear them announced</span>
        </div>

        {/* Quick Command Preset Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 self-center mr-1">Presets:</span>
          {PRESET_COMMANDS.slice(0, 5).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCustomCommandInput(preset.commandText);
                setCustomActionSummary(preset.actionSummary);
                setCustomSeverity(preset.severity);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              {preset.actionSummary}
            </button>
          ))}
        </div>

        <form onSubmit={handleManualDispatch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="e.g. isolate_network_interface --adapter eth0 or flush_dns_cache"
              value={customCommandInput}
              onChange={e => setCustomCommandInput(e.target.value)}
              className={`w-full text-xs mono rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' 
                  : 'bg-slate-900 border-slate-700 text-cyan-300 placeholder:text-slate-600'
              }`}
            />
          </div>

          <div className="w-full sm:w-48">
            <input
              type="text"
              placeholder="Action name (optional)"
              value={customActionSummary}
              onChange={e => setCustomActionSummary(e.target.value)}
              className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' 
                  : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600'
              }`}
            />
          </div>

          <select
            value={customSeverity}
            onChange={e => setCustomSeverity(e.target.value as CommandSeverity)}
            className={`text-xs rounded-xl px-3 py-3 border focus:outline-none font-bold ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <option value="CRITICAL">CRITICAL</option>
            <option value="ELEVATED">ELEVATED</option>
            <option value="STANDARD">STANDARD</option>
            <option value="ROUTINE">ROUTINE</option>
          </select>

          <button
            type="submit"
            disabled={!customCommandInput.trim() || isDispatching}
            id="dispatch-command-to-device-btn"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-all shadow-cyan shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{isDispatching ? 'Transmitting...' : 'Send to Device'}</span>
          </button>
        </form>
      </div>

      {/* All Available Commands Directory */}
      <div className={`glass rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className={`px-6 py-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-widest">All Available Commands</h3>
                <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  {AVAILABLE_COMMANDS_CATALOG.length} Commands
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete directory of authorized Sentinel device directives ready for instant execution or inspection
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllCommandsCatalog(prev => !prev)}
              className="lg:hidden px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300"
            >
              {showAllCommandsCatalog ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Filter available commands..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              className={`text-xs rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
              }`}
            />
            <div className={`flex flex-wrap rounded-lg p-0.5 border ${isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
              {(['ALL', 'NETWORK', 'ACCESS_CONTROL', 'ENCRYPTION', 'PATCH', 'SYSTEM', 'TELEMETRY'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                    catalogCategoryFilter === cat
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'ACCESS_CONTROL' ? 'ACCESS' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {showAllCommandsCatalog && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AVAILABLE_COMMANDS_CATALOG.filter(entry => {
              if (catalogCategoryFilter !== 'ALL' && entry.category !== catalogCategoryFilter) return false;
              if (!catalogSearch.trim()) return true;
              const q = catalogSearch.toLowerCase();
              return (
                entry.actionSummary.toLowerCase().includes(q) ||
                entry.commandText.toLowerCase().includes(q) ||
                entry.description.toLowerCase().includes(q)
              );
            }).map(entry => (
              <div
                key={entry.id}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryBadge(entry.category)}`}>
                      {entry.category}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(entry.severity)}`}>
                      {entry.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold leading-snug">{entry.actionSummary}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{entry.description}</p>
                  <div className={`p-2 rounded-lg font-mono text-[11px] overflow-x-auto border ${
                    isLight ? 'bg-slate-900 text-cyan-300 border-slate-700' : 'bg-black/60 text-cyan-300 border-slate-800'
                  }`}>
                    <code>{entry.commandText}</code>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500">{entry.authorizationPolicy}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(entry.commandText, entry.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      {copiedId === entry.id ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchCommand({
                          commandText: entry.commandText,
                          actionSummary: entry.actionSummary,
                          category: entry.category,
                          severity: entry.severity,
                          sourceDispatcher: 'Available Commands Catalog',
                          spokenAnnouncement: entry.spokenAnnouncement,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition-colors"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inbound Commands Stream Card */}
      <div className={`glass rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        {/* Stream Header & Filters */}
        <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm uppercase tracking-widest">Inbound Device Command Stream</h3>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  {filteredCommands.length} / {commands.length} Commands
                </span>
              </div>
              <p className="text-xs text-slate-500">Live feed of instructions dispatched to My Device, announced verbally via voice synthesizer</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search commands or dispatcher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`text-xs rounded-lg px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border transition-all ${
                  isLight 
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400' 
                    : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Severity filter pills */}
            <div className={`flex rounded-lg p-0.5 border ${isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
              {['ALL', 'CRITICAL', 'ELEVATED', 'STANDARD'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    severityFilter === sev
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Commands List */}
        <div className="divide-y divide-slate-800/60 max-h-[560px] overflow-y-auto">
          {filteredCommands.map((cmd, idx) => (
            <div
              key={cmd.id}
              className={`p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                idx === 0
                  ? isLight ? 'bg-cyan-50/50' : 'bg-cyan-950/20'
                  : isLight ? 'hover:bg-slate-100/60' : 'hover:bg-slate-900/40'
              }`}
            >
              <div className="flex-1 space-y-2">
                {/* Meta Row: ID, Time, Severity, Category */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono text-xs font-bold text-cyan-400">{cmd.id}</span>
                  <span className="text-[11px] mono text-slate-500">{cmd.timestamp}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(cmd.severity)}`}>
                    {cmd.severity}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryBadge(cmd.category)}`}>
                    {cmd.category}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    From: <strong className="text-slate-300">{cmd.sourceDispatcher}</strong>
                  </span>
                </div>

                {/* Action summary & command string */}
                <div>
                  <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                    {cmd.actionSummary}
                    {idx === 0 && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Latest Inbound
                      </span>
                    )}
                  </h4>
                  <div className={`mt-1.5 p-2 rounded-lg font-mono text-xs overflow-x-auto flex items-center justify-between border ${
                    isLight ? 'bg-slate-900 text-cyan-300 border-slate-700' : 'bg-slate-950 text-cyan-300 border-slate-800'
                  }`}>
                    <code>{cmd.commandText}</code>
                    <button
                      onClick={() => handleCopyCommand(cmd.commandText, cmd.id)}
                      className="ml-3 text-[10px] text-slate-400 hover:text-white uppercase font-bold shrink-0"
                    >
                      {copiedId === cmd.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Target: <strong className="text-slate-400">{cmd.targetDevice}</strong></span>
                  <span>•</span>
                  <span>Auth: <strong className="text-slate-400">{cmd.authorizedBy}</strong></span>
                </div>
              </div>

              {/* Action Buttons on Right */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <button
                  onClick={() => audioAnnouncer.announceCommand(cmd)}
                  title="Re-announce this command aloud"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <span>Announce</span>
                </button>

                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                  cmd.status === 'ENFORCED' || cmd.status === 'SUCCESS'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {cmd.status}
                </span>
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="p-16 text-center text-slate-500">
              <p className="text-xs uppercase tracking-widest font-bold">No inbound commands match current filter criteria</p>
              <p className="text-xs mt-1">Try clearing search filters or use the manual dispatcher to send a command</p>
            </div>
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className={`px-6 py-3 border-t flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'
        }`}>
          <div className="flex items-center gap-4">
            <span>Total Commands: <strong className="mono text-white">{commands.length}</strong></span>
            <span>Critical: <strong className="mono text-red-400">{commands.filter(c => c.severity === 'CRITICAL').length}</strong></span>
            <span>Elevated: <strong className="mono text-amber-400">{commands.filter(c => c.severity === 'ELEVATED').length}</strong></span>
            <span>Channel: <strong className="mono text-emerald-400">mTLS 1.3 / Authenticated</strong></span>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => setCommands([])}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Clear Buffer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCommandsMonitor;
