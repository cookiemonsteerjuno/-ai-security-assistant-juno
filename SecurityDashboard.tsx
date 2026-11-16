import React, { useEffect, useMemo, useState } from 'react';
import { INITIAL_MODULES } from './constants';
import { SecurityStatus, type SecurityLog, type SecurityModule } from './types';
import DeviceCommandsMonitor from './DeviceCommandsMonitor';
import PacketTrafficChart from './components/PacketTrafficChart';
import { ScreenMaskGuardPanel } from './components/ScreenMaskOverlay';
import { audioAnnouncer } from './services/audioAnnouncer';
import { androidPatchScanner, type AndroidPatchScannerSnapshot } from './services/androidPatchScanner';
import { inboundCommsService, type InboundCommsSnapshot } from './services/inboundCommsService';
import { hardwareIntegrityService } from './services/hardwareIntegrityService';
import { screenMaskService } from './services/screenMaskService';
import { simSwitchLockService } from './services/simSwitchLockService';
import { type HardwareIntegrityState, type ScreenMaskState, type SimSwitchLockState } from './types';

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
    id: 'log-1',
    timestamp: 'now',
    event: 'Shield integrity nominal across all active nodes.',
    status: SecurityStatus.ACTIVE,
    severity: 'INFO',
    origin: 'Gateway',
    sourceIp: '10.0.0.3',
    destinationPort: 443,
  },
  {
    id: 'log-2',
    timestamp: '5m ago',
    event: 'Blocked anomalous outbound query to a suspicious host.',
    status: SecurityStatus.BLOCKED,
    severity: 'HIGH',
    origin: 'Edge-Proxy',
    sourceIp: '192.168.1.17',
    destinationPort: 53,
  },
  {
    id: 'log-3',
    timestamp: '10m ago',
    event: 'Threat signature detected in encrypted tunnel.',
    status: SecurityStatus.THREAT_DETECTED,
    severity: 'CRITICAL',
    origin: 'Node-14',
    sourceIp: '203.0.113.9',
    destinationPort: 443,
  },
];

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  stealthMode,
  theme = 'dark',
  onNavigateToCommands,
  onNavigateToMobile,
  onNavigateToNetwork,
}) => {
  const [modules] = useState<SecurityModule[]>(INITIAL_MODULES as SecurityModule[]);
  const [logs] = useState<SecurityLog[]>(INITIAL_LOGS);
  const [maskSnapshot, setMaskSnapshot] = useState<ScreenMaskState>(() => screenMaskService.getSnapshot());
  const [patchSnapshot] = useState<AndroidPatchScannerSnapshot>(() => androidPatchScanner.getSnapshot());
  const [commsSnapshot] = useState<InboundCommsSnapshot>(() => inboundCommsService.getSnapshot());
  const [hwSnapshot] = useState<HardwareIntegrityState>(() => hardwareIntegrityService.getSnapshot());
  const [simSnapshot] = useState<SimSwitchLockState>(() => simSwitchLockService.getSnapshot());

  useEffect(() => {
    const unsubMask = screenMaskService.subscribe(setMaskSnapshot);
    const unsubPatch = androidPatchScanner.subscribe(() => {});
    const unsubComms = inboundCommsService.subscribe(() => {});
    const unsubHw = hardwareIntegrityService.subscribe(() => {});
    const unsubSim = simSwitchLockService.subscribe(() => {});
    const unsubAudio = audioAnnouncer.subscribe(() => {});
    return () => {
      unsubMask();
      unsubPatch();
      unsubComms();
      unsubHw();
      unsubSim();
      unsubAudio();
    };
  }, []);

  const securityScore = useMemo(() => {
    const totalHealth = modules.reduce((acc, module) => acc + module.health, 0);
    const avgHealth = modules.length ? totalHealth / modules.length : 0;
    return Math.max(0, Math.min(100, Math.round(avgHealth)));
  }, [modules]);

  const isLight = theme === 'light';

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
        <div className={`rounded-2xl border p-6 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">security overview</p>
              <h2 className="mt-2 text-3xl font-bold">{stealthMode ? 'Redacted security posture' : 'Security posture: high integrity'}</h2>
            </div>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400">
              Score {securityScore}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <button type="button" onClick={onNavigateToCommands} className="rounded-xl border border-slate-700 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">commands</p>
              <p className="mt-2 text-xl font-bold">{patchSnapshot.patches.length || 3}</p>
            </button>
            <button type="button" onClick={() => onNavigateToMobile?.('patches')} className="rounded-xl border border-slate-700 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">patches</p>
              <p className="mt-2 text-xl font-bold">{commsSnapshot.blocked || 12}</p>
            </button>
            <button type="button" onClick={() => onNavigateToNetwork?.('node_access')} className="rounded-xl border border-slate-700 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">network</p>
              <p className="mt-2 text-xl font-bold">{maskSnapshot.totalScreenshotsBlocked || 0}</p>
            </button>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400">signal integrity</p>
          <div className="mt-4 space-y-4">
            {modules.map(module => (
              <div key={module.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{module.name}</span>
                  <span className="font-medium text-emerald-400">{module.health}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${module.health}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={`rounded-2xl border p-4 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live event stream</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{logs.length} entries</span>
          </div>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{log.event}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">{log.status}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400">{log.origin} · {log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <PacketTrafficChart />
          <ScreenMaskGuardPanel theme={theme} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-2xl border p-4 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">mask state</p>
          <p className="mt-2 text-lg font-semibold">{maskSnapshot.isMaskEngaged ? 'Engaged' : 'Standby'}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">hardware integrity</p>
          <p className="mt-2 text-lg font-semibold">{hwSnapshot.liveBusMonitoringActive ? 'Monitoring' : 'Dormant'}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">sim lock</p>
          <p className="mt-2 text-lg font-semibold">{simSnapshot.simSwitchLocked ? 'Locked' : 'Unlocked'}</p>
        </div>
      </div>

      <DeviceCommandsMonitor stealthMode={stealthMode} theme={theme} />
    </section>
  );
};

export default SecurityDashboard;
