import React from 'react';
import { Activity, Globe, ShieldCheck } from 'lucide-react';
import {
  AndroidDeviceProfile,
  AndroidSystemPatch,
  NetworkSubSection,
  SecurityLog,
  SecurityModule,
  SecurityStatus,
} from '../types';

interface SecurityDashboardProps {
  deviceProfile: AndroidDeviceProfile;
  highSecEcoCount: number;
  pendingEcoPatchesCount: number;
  ecoPatches: AndroidSystemPatch[];
  modules: SecurityModule[];
  firewallCountdown: number;
  firewallReloadCount: number;
  activeRelay: { flag: string; city: string; ip: string };
  locationHopCountdown: number;
  analyticsCount: number;
  foreignPacketsDropped: number;
  nodeProbesCount: number;
  cloudflareDroppedCount: number;
  securityLogs: SecurityLog[];
  logFilter: 'ALL' | 'CRITICAL' | 'BLOCKED' | 'ACTIVE';
  setLogFilter: (f: 'ALL' | 'CRITICAL' | 'BLOCKED' | 'ACTIVE') => void;
  applyAllHighSecurityPatches: () => void;
  onOpenPatchScanner: () => void;
  onOpenNetworkSection: (section: NetworkSubSection) => void;
  onOpenNetworkTab: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  deviceProfile,
  highSecEcoCount,
  pendingEcoPatchesCount,
  ecoPatches,
  modules,
  firewallCountdown,
  firewallReloadCount,
  activeRelay,
  locationHopCountdown,
  analyticsCount,
  foreignPacketsDropped,
  nodeProbesCount,
  cloudflareDroppedCount,
  securityLogs,
  logFilter,
  setLogFilter,
  applyAllHighSecurityPatches,
  onOpenPatchScanner,
  onOpenNetworkSection,
  onOpenNetworkTab,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-emerald-950/30 border border-cyan-500/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 mono">
              High-Security Kernel & Baseband Suite
            </span>
            <span className="text-xs text-emerald-400 mono font-semibold">
              • {highSecEcoCount} Hardening Modules Loaded
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Android 16 High-Security Patch Enforcement ({deviceProfile.modelName})
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Includes Samsung Knox Vault EL2 Real-Time Kernel Protection (RKP), 5G SA Baseband Zero-Click NAS & Silent SMS Firewall, USB-C Data-Line Lock, Google Pixel pKVM & Titan M2 StrongBox Isolation, Post-Quantum TLS 1.3 (ML-KEM-768), and ARMv9 MTE/kCFI.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={applyAllHighSecurityPatches}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-cyan"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {pendingEcoPatchesCount > 0
                ? `Verify & Apply All (${pendingEcoPatchesCount} Pending)`
                : 'Re-Verify High-Security Baseline'}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenPatchScanner}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs"
          >
            Open Patch Scanner →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl glass">
          <div className="text-[11px] text-slate-400 uppercase mono">Integrity Score</div>
          <div className="text-2xl font-bold text-emerald-400 mono mt-1">
            {pendingEcoPatchesCount === 0 ? '100%' : '96.4%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">5/5 Core Engines Nominal</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="text-[11px] text-slate-400 uppercase mono">High-Sec Patches</div>
          <div className="text-2xl font-bold text-cyan-400 mono mt-1">
            {ecoPatches.filter(p => p.status === 'INSTALLED').length}/{ecoPatches.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">SPL {deviceProfile.currentSecurityPatchLevel}</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="text-[11px] text-slate-400 uppercase mono">Firewall Reload</div>
          <div className="text-2xl font-bold text-amber-400 mono mt-1">{firewallCountdown}s</div>
          <div className="text-[11px] text-slate-400 mt-1">{firewallReloadCount} atomic flushes</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="text-[11px] text-slate-400 uppercase mono">Relay Location</div>
          <div className="text-lg font-bold text-purple-400 mono mt-1 truncate">
            {activeRelay.flag} {activeRelay.city}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Next hop in {locationHopCountdown}s</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="text-[11px] text-slate-400 uppercase mono">Analytics Dropped</div>
          <div className="text-2xl font-bold text-rose-400 mono mt-1">{248 + analyticsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Zero-logging enforced</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="text-[11px] text-slate-400 uppercase mono">Node & Foreign Drop</div>
          <div className="text-2xl font-bold text-cyan-300 mono mt-1">
            {foreignPacketsDropped + nodeProbesCount * 10}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">13 Node ports blackholed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {modules.map(mod => (
          <div key={mod.id} className="p-4 rounded-xl glass flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200">{mod.name}</span>
              <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 font-bold mono">
                {mod.status}
              </span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] mono text-slate-400 mb-1">
                <span>Health</span>
                <span className="text-cyan-400 font-bold">{mod.health}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${mod.health}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl glass space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider mono text-cyan-400 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>14-Layer Network & Hardware Shield Matrix</span>
            </h3>
            <button type="button" onClick={onOpenNetworkTab} className="text-xs text-cyan-400 hover:underline mono">
              Configure All →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                { id: 'vpn_proxy_tunnel', label: 'Quantum VPN & mTLS', state: 'CONNECTED' },
                { id: 'firewall_reload', label: '1-Min Firewall Reload', state: `${firewallCountdown}s` },
                { id: 'location_changer', label: 'Autonomous Location Hop', state: activeRelay.city },
                { id: 'cloudflare_packets', label: 'Cloudflare Packet Drop', state: `${cloudflareDroppedCount} dropped` },
                { id: 'foreign_states', label: 'Foreign States Geo-Block', state: 'STRICT' },
                { id: 'analytics_blocker', label: 'Zero Analytics Blocker', state: 'NULL-ROUTED' },
                { id: 'node_access', label: 'Zero Node Access (13 Ports)', state: 'BLACKHOLED' },
                { id: 'bluetooth_shield', label: 'Bluetooth RF Kill-Switch', state: 'KILLED' },
                { id: 'hardware_integrity', label: 'USB OTG / TRRS Kill-Switch', state: 'ARMED' },
                { id: 'network_sharing', label: 'SMB/NFS/UPnP Blocker', state: 'BLOCKED' },
                { id: 'packet_concealment', label: 'Anti-DPI & ECH Padding', state: 'ACTIVE' },
                { id: 'nearby_ips', label: 'Nearby LAN Subnet Shield', state: 'ISOLATED' },
              ] as const
            ).map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => onOpenNetworkSection(card.id)}
                className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-left transition-all"
              >
                <div className="text-xs font-semibold text-slate-200 truncate">{card.label}</div>
                <div className="text-[10px] font-bold text-emerald-400 mono mt-1">{card.state}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider mono text-cyan-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Real-Time Security & Patch Telemetry Log</span>
            </h3>
            <div className="flex items-center gap-1">
              {(['ALL', 'CRITICAL', 'BLOCKED', 'ACTIVE'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLogFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold mono ${
                    logFilter === f
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {securityLogs
              .filter(l => {
                if (logFilter === 'CRITICAL') return l.severity === 'CRITICAL';
                if (logFilter === 'BLOCKED') return l.status === SecurityStatus.BLOCKED;
                if (logFilter === 'ACTIVE') return l.status === SecurityStatus.ACTIVE;
                return true;
              })
              .map(log => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-200">{log.event}</div>
                    <div className="text-[11px] text-slate-400 mono" data-sensitive-data="true">
                      {log.timestamp} · Origin: {log.origin} · {log.protocol} ({log.sourceIp})
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold mono shrink-0 ${
                      log.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : log.status === SecurityStatus.BLOCKED
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {log.severity || log.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
