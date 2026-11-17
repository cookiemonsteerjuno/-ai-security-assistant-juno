import React, { useState } from 'react';
import {
  AnalyticsInterceptEvent,
  NetworkSubSection,
  NodeAccessProbeRecord,
} from '../types';
import { MONITORED_NODE_PORTS, RELAY_LOCATIONS } from '../constants';

interface NetworkRoutingShieldProps {
  networkSubSection: NetworkSubSection;
  setNetworkSubSection: (s: NetworkSubSection) => void;
  vpnConnected: boolean;
  setVpnConnected: (v: boolean) => void;
  vpnProtocol: 'Quantum-Mesh' | 'WireGuard' | 'OpenVPN-DCO';
  setVpnProtocol: (p: 'Quantum-Mesh' | 'WireGuard' | 'OpenVPN-DCO') => void;
  proxyEnabled: boolean;
  setProxyEnabled: (v: boolean) => void;
  tunnelOpen: boolean;
  setTunnelOpen: (v: boolean) => void;
  firewallCountdown: number;
  setFirewallCountdown: (v: number) => void;
  firewallReloadCount: number;
  setFirewallReloadCount: React.Dispatch<React.SetStateAction<number>>;
  locationHopRunning: boolean;
  setLocationHopRunning: (v: boolean) => void;
  locationHopCountdown: number;
  setLocationHopCountdown: (v: number) => void;
  activeLocationIdx: number;
  setActiveLocationIdx: React.Dispatch<React.SetStateAction<number>>;
  setTotalLocationHops: React.Dispatch<React.SetStateAction<number>>;
  analyticsEvents: AnalyticsInterceptEvent[];
  setAnalyticsEvents: React.Dispatch<React.SetStateAction<AnalyticsInterceptEvent[]>>;
  nodeProbes: NodeAccessProbeRecord[];
  setNodeProbes: React.Dispatch<React.SetStateAction<NodeAccessProbeRecord[]>>;
  cloudflareBlocked: boolean;
  setCloudflareBlocked: (v: boolean) => void;
  cloudflareDroppedCount: number;
  foreignStatesBlocked: boolean;
  setForeignStatesBlocked: (v: boolean) => void;
  foreignPacketsDropped: number;
  bluetoothKilled: boolean;
  setBluetoothKilled: (v: boolean) => void;
  bleBlockedCount: number;
  networkSharingBlocked: boolean;
  setNetworkSharingBlocked: (v: boolean) => void;
  packetConcealmentOn: boolean;
  setPacketConcealmentOn: (v: boolean) => void;
  contactedDomains: Array<{ id: string; domain: string; ip: string; protocol: string; status: string; threatScore: number }>;
  setContactedDomains: React.Dispatch<
    React.SetStateAction<Array<{ id: string; domain: string; ip: string; protocol: string; status: string; threatScore: number }>>
  >;
  triggerToast: (title: string, detail: string, type?: 'info' | 'success' | 'critical') => void;
  onManageHardwareBus: () => void;
}

export const NetworkRoutingShield: React.FC<NetworkRoutingShieldProps> = props => {
  const {
    networkSubSection,
    setNetworkSubSection,
    vpnConnected,
    setVpnConnected,
    vpnProtocol,
    setVpnProtocol,
    proxyEnabled,
    setProxyEnabled,
    tunnelOpen,
    setTunnelOpen,
    firewallCountdown,
    setFirewallCountdown,
    firewallReloadCount,
    setFirewallReloadCount,
    locationHopRunning,
    setLocationHopRunning,
    locationHopCountdown,
    setLocationHopCountdown,
    activeLocationIdx,
    setActiveLocationIdx,
    setTotalLocationHops,
    analyticsEvents,
    setAnalyticsEvents,
    setNodeProbes,
    cloudflareBlocked,
    setCloudflareBlocked,
    cloudflareDroppedCount,
    foreignStatesBlocked,
    setForeignStatesBlocked,
    foreignPacketsDropped,
    bluetoothKilled,
    setBluetoothKilled,
    bleBlockedCount,
    networkSharingBlocked,
    setNetworkSharingBlocked,
    packetConcealmentOn,
    setPacketConcealmentOn,
    contactedDomains,
    setContactedDomains,
    triggerToast,
    onManageHardwareBus,
  } = props;

  const [newBlockedDomain, setNewBlockedDomain] = useState('');
  const activeRelay = RELAY_LOCATIONS[activeLocationIdx];

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-2xl glass flex flex-wrap gap-1.5">
        {(
          [
            { id: 'vpn_proxy_tunnel', label: 'VPN / Proxy / Tunnel' },
            { id: 'firewall_reload', label: '1-Min Firewall Reload' },
            { id: 'location_changer', label: 'Location Hop' },
            { id: 'analytics_blocker', label: 'Zero Analytics' },
            { id: 'node_access', label: 'Zero Node Access' },
            { id: 'cloudflare_packets', label: 'Cloudflare Shield' },
            { id: 'foreign_states', label: 'Foreign Geo-Block' },
            { id: 'bluetooth_shield', label: 'Bluetooth Kill-Switch' },
            { id: 'hardware_integrity', label: 'USB / TRRS Kill-Switch' },
            { id: 'network_sharing', label: 'Network Share Block' },
            { id: 'packet_concealment', label: 'Anti-DPI Concealment' },
            { id: 'contacted_domains', label: 'Contacted Domains' },
            { id: 'block_domains', label: 'Domain Blocker' },
            { id: 'nearby_ips', label: 'Nearby Subnet IPs' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setNetworkSubSection(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              networkSubSection === tab.id
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'bg-slate-900/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 rounded-2xl glass space-y-4">
        {networkSubSection === 'vpn_proxy_tunnel' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-cyan-400 mono">
              POST-QUANTUM VPN, MULTI-HOP PROXY & ENCRYPTED mTLS TUNNEL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Quantum-Mesh VPN</span>
                  <button
                    type="button"
                    onClick={() => setVpnConnected(!vpnConnected)}
                    className={`px-2.5 py-1 rounded text-xs font-bold mono ${
                      vpnConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {vpnConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </button>
                </div>
                <div className="text-xs text-slate-400 mono space-y-1" data-sensitive-data="true">
                  <div>Protocol: {vpnProtocol} (ChaCha20-Poly1305 + ML-KEM-768)</div>
                  <div>Virtual IP: {activeRelay.virtualIp}</div>
                  <div>Exit Node: {activeRelay.flag} {activeRelay.city} ({activeRelay.ip})</div>
                </div>
                <div className="flex gap-1.5">
                  {(['Quantum-Mesh', 'WireGuard', 'OpenVPN-DCO'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setVpnProtocol(p)}
                      className={`px-2 py-1 rounded text-[10px] mono ${
                        vpnProtocol === p ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">SOCKS5 / Tor-MultiHop Proxy</span>
                  <button
                    type="button"
                    onClick={() => setProxyEnabled(!proxyEnabled)}
                    className={`px-2.5 py-1 rounded text-xs font-bold mono ${
                      proxyEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {proxyEnabled ? 'ENABLED' : 'BYPASSED'}
                  </button>
                </div>
                <div className="text-xs text-slate-400 mono space-y-1">
                  <div>Bind: 127.0.0.1:9050 (DNS Leak Guard Active)</div>
                  <div>Hops: Zurich → Reykjavik → Tokyo</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">mTLS Reverse Edge Tunnel</span>
                  <button
                    type="button"
                    onClick={() => setTunnelOpen(!tunnelOpen)}
                    className={`px-2.5 py-1 rounded text-xs font-bold mono ${
                      tunnelOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {tunnelOpen ? 'ESTABLISHED' : 'CLOSED'}
                  </button>
                </div>
                <div className="text-xs text-slate-400 mono space-y-1">
                  <div>Handshake: Ephemeral Re-Keying every 60s</div>
                  <div>Cipher: TLS_AES_256_GCM_SHA384</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {networkSubSection === 'firewall_reload' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-cyan-400 mono">
                  1-MINUTE AUTONOMOUS FIREWALL AUTO-RELOAD ENGINE
                </h3>
                <p className="text-xs text-slate-400">
                  Flushes state tables and reloads clean nftables/ebtables rules every 60 seconds to evict persistent socket hooks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFirewallCountdown(60);
                  setFirewallReloadCount(c => c + 1);
                  triggerToast('Firewall Flushed & Reloaded', 'All 4,820 nftables rules re-applied cleanly in 12ms.', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold mono"
              >
                Flush & Reload Now (Next in {firewallCountdown}s)
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mono">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Next Atomic Flush</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{firewallCountdown}s</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Total Reload Cycles</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{firewallReloadCount}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Active Ruleset</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">4,820 Strict Rules</div>
              </div>
            </div>
          </div>
        )}

        {networkSubSection === 'location_changer' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-cyan-400 mono">AUTONOMOUS MULTI-HOP LOCATION CHANGER</h3>
                <p className="text-xs text-slate-400">
                  Continuously rotates your exit node IP and virtual geolocation across hardened sovereign jurisdictions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveLocationIdx(idx => (idx + 1) % RELAY_LOCATIONS.length);
                    setTotalLocationHops(h => h + 1);
                    setLocationHopCountdown(30);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold mono"
                >
                  Hop Location Now
                </button>
                <button
                  type="button"
                  onClick={() => setLocationHopRunning(!locationHopRunning)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold mono"
                >
                  {locationHopRunning ? `Auto-Hop ON (${locationHopCountdown}s)` : 'Auto-Hop PAUSED'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {RELAY_LOCATIONS.map((loc, idx) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setActiveLocationIdx(idx);
                    setTotalLocationHops(h => h + 1);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    idx === activeLocationIdx
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-cyan'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-base font-bold">
                    {loc.flag} {loc.city}
                  </div>
                  <div className="text-[11px] mono mt-1" data-sensitive-data="true">
                    {loc.ip} ({loc.latencyMs}ms)
                  </div>
                  <div className="text-[10px] text-cyan-400 mt-1">{loc.tier}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {networkSubSection === 'analytics_blocker' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-cyan-400 mono">
                  ZERO ANALYTICS LOGGING & BEACON INTERCEPTOR
                </h3>
                <p className="text-xs text-slate-400">
                  Overrides navigator.sendBeacon, strips UTM/gclid/fbclid tracking parameters, and null-routes 9+ telemetry SDKs.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ev: AnalyticsInterceptEvent = {
                      id: `anl-${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      vendor: 'Mixpanel / Segment Telemetry Probe',
                      endpoint: 'https://api.segment.io/v1/t',
                      method: 'navigator.sendBeacon',
                      payloadType: 'device_fingerprint',
                      actionTaken: 'SUPPRESSED_NULL_ROUTED',
                      sizeBytes: 768,
                    };
                    setAnalyticsEvents(prev => [ev, ...prev]);
                    triggerToast('Telemetry Beacon Null-Routed', 'Blocked outbound device fingerprint payload (0 bytes sent).', 'info');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold"
                >
                  Simulate Beacon Intercept
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsEvents([]);
                    triggerToast('Analytics Logs Purged', 'Cleared intercepted telemetry buffer.', 'success');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-bold"
                >
                  Purge Telemetry Buffer
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {analyticsEvents.map(ev => (
                <div key={ev.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{ev.vendor}</div>
                    <div className="text-[11px] text-slate-400 mono">
                      {ev.timestamp} · {ev.method} · {ev.endpoint} ({ev.sizeBytes}B)
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold mono text-[10px]">
                    {ev.actionTaken}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {networkSubSection === 'node_access' && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-cyan-400 mono">
                  ZERO NODE ACCESS DEFENSE (13 P2P, INSPECTOR & DAEMON PORTS)
                </h3>
                <p className="text-xs text-slate-400">
                  Blocks V8 Inspector (9229), Chrome CDP (9222), Docker (2375), Kubelet (10250), Ethereum RPC (8545), and Tor/IPFS peering.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const p: NodeAccessProbeRecord = {
                    id: `np-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString(),
                    nodeIp: '198.51.100.82',
                    nodeHostname: 'rogue-inspector.scanner.net',
                    nodeType: 'Node.js Inspector / V8 Debugger',
                    port: 9229,
                    protocol: 'TCP',
                    actionTaken: 'TCP_RST',
                    threatSeverity: 'CRITICAL',
                    signature: 'Blocked remote V8 debugger attach attempt',
                  };
                  setNodeProbes(prev => [p, ...prev]);
                  triggerToast('Node Probe Blocked', 'Dropped inbound TCP port 9229 V8 Inspector probe.', 'critical');
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
              >
                Simulate Port 9229 Attack Probe
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MONITORED_NODE_PORTS.slice(0, 8).map(port => (
                <div key={port.port} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="font-bold text-cyan-400 mono">
                    Port {port.port}/{port.protocol}
                  </div>
                  <div className="text-slate-200 font-medium truncate">{port.name}</div>
                  <div className="text-[10px] text-emerald-400 mono mt-0.5">HARD_DROP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(networkSubSection === 'cloudflare_packets' ||
          networkSubSection === 'foreign_states' ||
          networkSubSection === 'bluetooth_shield' ||
          networkSubSection === 'hardware_integrity' ||
          networkSubSection === 'network_sharing' ||
          networkSubSection === 'packet_concealment' ||
          networkSubSection === 'contacted_domains' ||
          networkSubSection === 'block_domains' ||
          networkSubSection === 'nearby_ips') && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-cyan-400 mono uppercase">
              {networkSubSection.replace(/_/g, ' ')} SHIELD CONTROLLER
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Cloudflare Packet Drop</div>
                  <div className="text-[11px] text-slate-400">{cloudflareDroppedCount} packets dropped</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCloudflareBlocked(!cloudflareBlocked)}
                  className={`px-3 py-1 rounded text-xs font-bold mono ${
                    cloudflareBlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {cloudflareBlocked ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Foreign States Geo-Block</div>
                  <div className="text-[11px] text-slate-400">{foreignPacketsDropped} foreign ASNs dropped</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForeignStatesBlocked(!foreignStatesBlocked)}
                  className={`px-3 py-1 rounded text-xs font-bold mono ${
                    foreignStatesBlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {foreignStatesBlocked ? 'STRICT' : 'OFF'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Bluetooth RF Kill-Switch</div>
                  <div className="text-[11px] text-slate-400">{bleBlockedCount} BLE pairing probes rejected</div>
                </div>
                <button
                  type="button"
                  onClick={() => setBluetoothKilled(!bluetoothKilled)}
                  className={`px-3 py-1 rounded text-xs font-bold mono ${
                    bluetoothKilled ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {bluetoothKilled ? 'RADIO KILLED' : 'ARMED'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">SMB/NFS/AFP/UPnP Blocker</div>
                  <div className="text-[11px] text-slate-400">Ports 445, 139, 2049, 1900 closed</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNetworkSharingBlocked(!networkSharingBlocked)}
                  className={`px-3 py-1 rounded text-xs font-bold mono ${
                    networkSharingBlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {networkSharingBlocked ? 'BLOCKED' : 'OPEN'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Anti-DPI & ECH Concealment</div>
                  <div className="text-[11px] text-slate-400">Encrypted Client Hello + Jitter</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPacketConcealmentOn(!packetConcealmentOn)}
                  className={`px-3 py-1 rounded text-xs font-bold mono ${
                    packetConcealmentOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {packetConcealmentOn ? 'CONCEALED' : 'STANDARD'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Hardware USB/TRRS Lock</div>
                  <div className="text-[11px] text-slate-400">Power-only pin isolation</div>
                </div>
                <button
                  type="button"
                  onClick={onManageHardwareBus}
                  className="px-3 py-1 rounded bg-cyan-600/20 text-cyan-300 text-xs font-bold mono"
                >
                  Manage Bus →
                </button>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newBlockedDomain.trim()) return;
                setContactedDomains(prev => [
                  {
                    id: `cd-${Date.now()}`,
                    domain: newBlockedDomain.trim(),
                    ip: '0.0.0.0 (Sinkhole)',
                    protocol: 'DNS',
                    status: 'BLOCKED',
                    threatScore: 99,
                  },
                  ...prev,
                ]);
                setNewBlockedDomain('');
                triggerToast('Domain Sinkholed', 'Added custom domain to DNS blackhole.', 'success');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newBlockedDomain}
                onChange={e => setNewBlockedDomain(e.target.value)}
                placeholder="Add domain or ASN to sinkhole (e.g., tracker.example.com)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold mono"
              >
                Block Domain
              </button>
            </form>

            <div className="space-y-2">
              {contactedDomains.map(d => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200 mono">{d.domain}</div>
                    <div className="text-[11px] text-slate-400 mono" data-sensitive-data="true">
                      IP: {d.ip} · {d.protocol} · Threat Score: {d.threatScore}/100
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setContactedDomains(prev =>
                        prev.map(item =>
                          item.id === d.id
                            ? { ...item, status: item.status === 'BLOCKED' ? 'ALLOWED' : 'BLOCKED' }
                            : item
                        )
                      )
                    }
                    className={`px-2.5 py-1 rounded text-[10px] font-bold mono ${
                      d.status === 'BLOCKED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {d.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkRoutingShield;
