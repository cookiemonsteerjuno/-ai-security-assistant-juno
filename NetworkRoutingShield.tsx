import React, { useState, useEffect, useMemo } from 'react';
import { VPNState, ProxyState, TunnelState, BlockedDomain, ContactedDomain, DomainCategory, LocationNode } from '../types';
import { audioAnnouncer } from '../services/audioAnnouncer';
import FirewallReloadEngine from './FirewallReloadEngine';
import LocationChangerEngine from './LocationChangerEngine';
import NearbyDevicesIntrusionShield from './NearbyDevicesIntrusionShield';
import { ForeignStatesGeoShield } from './ForeignStatesGeoShield';
import { BluetoothPairingShield } from './BluetoothPairingShield';
import { NetworkSharingShield } from './NetworkSharingShield';
import { PacketConcealmentShield } from './PacketConcealmentShield';
import { CloudflarePacketShield } from './CloudflarePacketShield';
import { AnalyticsLoggingShield } from './AnalyticsLoggingShield';
import { NodeAccessShield } from './NodeAccessShield';
import { HardwareIntegrityShield } from './HardwareIntegrityShield';

interface NetworkRoutingShieldProps {
  stealthMode?: boolean;
  theme?: 'dark' | 'light';
  onNavigateBack?: () => void;
  defaultSection?:
    | 'contacted_domains'
    | 'analytics_blocker'
    | 'node_access'
    | 'cloudflare_packets'
    | 'nearby_ips'
    | 'foreign_states'
    | 'bluetooth_shield'
    | 'hardware_integrity'
    | 'network_sharing'
    | 'packet_concealment'
    | 'firewall_reload'
    | 'location_changer'
    | 'block_domains'
    | 'vpn_proxy_tunnel';
}

const INITIAL_VPN_STATE: VPNState = {
  isConnected: true,
  status: 'CONNECTED',
  serverLocation: 'Zurich, Switzerland (Quantum-Safe Node)',
  serverCountryCode: 'CH',
  serverIp: '194.26.29.112',
  virtualIp: '10.84.2.19',
  protocol: 'Quantum-Mesh',
  cipher: 'ChaCha20-Poly1305 / 256-bit Curve25519',
  latencyMs: 18,
  killswitchEnabled: true,
  bytesUploaded: 14285000,
  bytesDownloaded: 89410000,
  connectedSince: '42m ago'
};

const INITIAL_PROXY_STATE: ProxyState = {
  isEnabled: true,
  protocol: 'SOCKS5',
  host: '127.0.0.1',
  port: 9050,
  authRequired: false,
  dnsLeakProtection: true,
  activeHops: ['Frankfurt [Relay 01]', 'Reykjavik [Relay 02]', 'Geneva [Exit]'],
  trafficRoutedKb: 54190
};

const INITIAL_TUNNEL_STATE: TunnelState = {
  isOpen: true,
  tunnelId: 'TUN-SEC-9941',
  tunnelType: 'mTLS Reverse Tunnel',
  remoteEndpoint: 'tunnel.sentinel-secops.internal:8443',
  localBind: '127.0.0.1:3000',
  handshakeStatus: 'ESTABLISHED',
  uptimeSeconds: 2540,
  rekeyIntervalSeconds: 60,
  encryptedBytes: 31890400
};

const INITIAL_BLOCKED_DOMAINS: BlockedDomain[] = [
  {
    id: 'blk-cf-1',
    domain: 'time.cloudflare.com',
    category: 'CUSTOM',
    blockedAt: '2026-09-16 20:30:00',
    reason: 'Cloudflare NTP time sync server - strictly sinkholed by policy',
    hitCount: 318,
    enabled: true
  },
  {
    id: 'blk-cf-2',
    domain: 'cloudflare-dns.com',
    category: 'CUSTOM',
    blockedAt: '2026-09-16 20:30:00',
    reason: 'Cloudflare DoH / 1.1.1.1 DNS over HTTPS probe - intercepted & dropped',
    hitCount: 540,
    enabled: true
  },
  {
    id: 'blk-cf-3',
    domain: '*.cloudflare.com',
    category: 'CUSTOM',
    blockedAt: '2026-09-16 20:30:00',
    reason: 'Cloudflare edge proxies, CDN mirrors and reverse proxy inspection',
    hitCount: 1420,
    enabled: true
  },
  {
    id: 'blk-cf-4',
    domain: 'cdnjs.cloudflare.com',
    category: 'CUSTOM',
    blockedAt: '2026-09-16 20:30:00',
    reason: 'Cloudflare CDN static library mirror - blocked by policy',
    hitCount: 290,
    enabled: true
  },
  {
    id: 'blk-cf-5',
    domain: 'warp.cloudflare.com',
    category: 'CUSTOM',
    blockedAt: '2026-09-16 20:30:00',
    reason: 'Cloudflare WARP client tunnel probe - dropped',
    hitCount: 115,
    enabled: true
  },
  {
    id: 'blk-cf-6',
    domain: '*.workers.dev',
    category: 'CUSTOM',
    blockedAt: '2026-09-16 20:30:00',
    reason: 'Cloudflare Serverless Workers execution domains - blocked',
    hitCount: 174,
    enabled: true
  },
  {
    id: 'blk-1',
    domain: 'telemetry.beacon-probe.net',
    category: 'TRACKER',
    blockedAt: '2026-09-14 14:22:00',
    reason: 'Aggressive device fingerprinting tracker',
    hitCount: 384,
    enabled: true
  },
  {
    id: 'blk-2',
    domain: 'c2.ghost-infiltrator.ru',
    category: 'C2_BOTNET',
    blockedAt: '2026-09-15 08:11:15',
    reason: 'Active Command & Control beacon attempt',
    hitCount: 142,
    enabled: true
  },
  {
    id: 'blk-3',
    domain: 'crypto-miner.coinpulse.io',
    category: 'MALWARE',
    blockedAt: '2026-09-15 19:40:02',
    reason: 'Unauthorized background WebAssembly miner',
    hitCount: 89,
    enabled: true
  },
  {
    id: 'blk-4',
    domain: 'adservice.click-tracker.cc',
    category: 'ADWARE',
    blockedAt: '2026-09-16 02:15:30',
    reason: 'Malicious pop-under ad injector domain',
    hitCount: 215,
    enabled: true
  },
  {
    id: 'blk-5',
    domain: 'login-verify-account.bank-auth-fraud.com',
    category: 'PHISHING',
    blockedAt: '2026-09-16 11:05:12',
    reason: 'Identified zero-day credential harvester',
    hitCount: 37,
    enabled: true
  },
  {
    id: 'blk-6',
    domain: 'metrics.behavioral-sdk.org',
    category: 'TELEMETRY',
    blockedAt: '2026-09-16 15:30:45',
    reason: 'Unauthorized background telemetry collector',
    hitCount: 168,
    enabled: true
  }
];

const INITIAL_CONTACTED_DOMAINS: ContactedDomain[] = [
  {
    id: 'cnt-cf-1',
    domain: 'time.cloudflare.com',
    contactCount: 318,
    firstContact: '1 day ago',
    lastContact: 'Just now',
    status: 'BLOCKED',
    resolvedIp: '162.159.200.1',
    country: 'US',
    protocol: 'DNS',
    port: 123,
    threatScore: 82,
    category: 'Cloudflare NTP / Sinkholed'
  },
  {
    id: 'cnt-cf-2',
    domain: 'cloudflare-dns.com',
    contactCount: 540,
    firstContact: '18 hours ago',
    lastContact: '1m ago',
    status: 'BLOCKED',
    resolvedIp: '1.1.1.1',
    country: 'US',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 78,
    category: 'Cloudflare DoH / Intercepted'
  },
  {
    id: 'cnt-cf-3',
    domain: 'cdnjs.cloudflare.com',
    contactCount: 290,
    firstContact: '1 day ago',
    lastContact: '4m ago',
    status: 'BLOCKED',
    resolvedIp: '104.16.18.94',
    country: 'US',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 70,
    category: 'Cloudflare CDN / Sinkholed'
  },
  {
    id: 'cnt-1',
    domain: 'telemetry.beacon-probe.net',
    contactCount: 384,
    firstContact: '14 hours ago',
    lastContact: 'Just now',
    status: 'BLOCKED',
    resolvedIp: '198.51.100.42',
    country: 'DE',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 88,
    category: 'Fingerprinting Tracker'
  },
  {
    id: 'cnt-2',
    domain: 'api.github.com',
    contactCount: 294,
    firstContact: '1 day ago',
    lastContact: '1m ago',
    status: 'ALLOWED',
    resolvedIp: '140.82.121.6',
    country: 'US',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 0,
    category: 'Developer API'
  },
  {
    id: 'cnt-3',
    domain: 'c2.ghost-infiltrator.ru',
    contactCount: 142,
    firstContact: '8 hours ago',
    lastContact: '4m ago',
    status: 'BLOCKED',
    resolvedIp: '185.220.101.5',
    country: 'RU',
    protocol: 'TCP',
    port: 8443,
    threatScore: 99,
    category: 'Command & Control'
  },
  {
    id: 'cnt-5',
    domain: 'adservice.click-tracker.cc',
    contactCount: 215,
    firstContact: '18 hours ago',
    lastContact: '6m ago',
    status: 'BLOCKED',
    resolvedIp: '104.21.32.18',
    country: 'US',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 78,
    category: 'Adware Pixel'
  },
  {
    id: 'cnt-6',
    domain: 'dns.google',
    contactCount: 420,
    firstContact: '2 days ago',
    lastContact: 'Just now',
    status: 'ALLOWED',
    resolvedIp: '8.8.8.8',
    country: 'US',
    protocol: 'DNS',
    port: 53,
    threatScore: 0,
    category: 'Secure DNS'
  },
  {
    id: 'cnt-7',
    domain: 'metrics.behavioral-sdk.org',
    contactCount: 168,
    firstContact: '5 hours ago',
    lastContact: '8m ago',
    status: 'BLOCKED',
    resolvedIp: '45.33.32.156',
    country: 'NL',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 65,
    category: 'Telemetry Harvest'
  },
  {
    id: 'cnt-8',
    domain: 'updates.security-definitions.org',
    contactCount: 112,
    firstContact: '1 day ago',
    lastContact: '12m ago',
    status: 'ALLOWED',
    resolvedIp: '151.101.1.140',
    country: 'US',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 0,
    category: 'SecOps Signatures'
  },
  {
    id: 'cnt-9',
    domain: 'crypto-miner.coinpulse.io',
    contactCount: 89,
    firstContact: '1 day ago',
    lastContact: '15m ago',
    status: 'BLOCKED',
    resolvedIp: '185.190.140.22',
    country: 'RO',
    protocol: 'WSS',
    port: 8080,
    threatScore: 94,
    category: 'Cryptojacker'
  },
  {
    id: 'cnt-10',
    domain: 'device-sync.sentinel-mesh.cloud',
    contactCount: 520,
    firstContact: '2 days ago',
    lastContact: 'Just now',
    status: 'ALLOWED',
    resolvedIp: '10.84.0.1',
    country: 'CH',
    protocol: 'QUIC',
    port: 443,
    threatScore: 0,
    category: 'Sentinel Mesh'
  },
  {
    id: 'cnt-11',
    domain: 'analytics.inbound-metrics.com',
    contactCount: 76,
    firstContact: '3 hours ago',
    lastContact: '18m ago',
    status: 'ALLOWED',
    resolvedIp: '54.239.28.85',
    country: 'US',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 42,
    category: 'User Analytics'
  },
  {
    id: 'cnt-12',
    domain: 'login-verify-account.bank-auth-fraud.com',
    contactCount: 37,
    firstContact: '9 hours ago',
    lastContact: '22m ago',
    status: 'BLOCKED',
    resolvedIp: '193.106.191.12',
    country: 'PA',
    protocol: 'HTTPS',
    port: 443,
    threatScore: 96,
    category: 'Credential Phishing'
  }
];

const VPN_SERVERS = [
  { id: 'ch-zurich', name: 'Zurich, Switzerland (Quantum-Safe Node)', country: 'CH', ip: '194.26.29.112', latency: 18, rating: 'Recommended' },
  { id: 'is-reyk', name: 'Reykjavik, Iceland (Privacy Fortress)', country: 'IS', ip: '185.112.82.4', latency: 34, rating: 'Zero-Logs' },
  { id: 'de-frank', name: 'Frankfurt, Germany (Compliance Core)', country: 'DE', ip: '195.201.88.19', latency: 22, rating: 'High-Bandwidth' },
  { id: 'jp-tokyo', name: 'Tokyo, Japan (Asia-Pacific Mesh)', country: 'JP', ip: '133.242.18.91', latency: 98, rating: 'Multi-Gigabit' },
  { id: 'sg-sing', name: 'Singapore (ASEAN Gateway)', country: 'SG', ip: '139.180.201.45', latency: 85, rating: 'Optimized' }
];

export const NetworkRoutingShield: React.FC<NetworkRoutingShieldProps> = ({
  stealthMode = false,
  theme = 'dark',
  onNavigateBack,
  defaultSection
}) => {
  // Navigation subtabs inside Network section
  const [activeSection, setActiveSection] = useState<
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
  >(defaultSection || 'contacted_domains');

  // Cloudflare Integration Blocker state
  const [cloudflareBlocked, setCloudflareBlocked] = useState<boolean>(true);
  const [cfDnsBlocked, setCfDnsBlocked] = useState<boolean>(true);
  const [cfCdnBlocked, setCfCdnBlocked] = useState<boolean>(true);
  const [cfWorkersBlocked, setCfWorkersBlocked] = useState<boolean>(true);
  const [cfWarpBlocked, setCfWarpBlocked] = useState<boolean>(true);
  const [cfNtpBlocked, setCfNtpBlocked] = useState<boolean>(true);
  const [cfStripHeaders, setCfStripHeaders] = useState<boolean>(true);
  const [cfPacketsDropped, setCfPacketsDropped] = useState<number>(2184);
  const [cfDnsIntercepted, setCfDnsIntercepted] = useState<number>(719);
  const [cfCdnSinkholed, setCfCdnSinkholed] = useState<number>(392);

  // VPN, Proxy, and Tunnel states
  const [vpn, setVpn] = useState<VPNState>(INITIAL_VPN_STATE);
  const [proxy, setProxy] = useState<ProxyState>(INITIAL_PROXY_STATE);
  const [tunnel, setTunnel] = useState<TunnelState>(INITIAL_TUNNEL_STATE);
  const [rekeyCountdown, setRekeyCountdown] = useState<number>(60);

  // Sync location changer hops with VPN gateway state
  const handleLocationChangedFromHopper = (node: LocationNode) => {
    setVpn(prev => ({
      ...prev,
      serverLocation: `${node.city}, ${node.country} (${node.tier})`,
      serverCountryCode: node.countryCode,
      serverIp: node.ip,
      virtualIp: node.virtualIp,
      latencyMs: node.latencyMs
    }));
  };

  // Blocked domains state
  const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>(INITIAL_BLOCKED_DOMAINS);
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [newDomainCategory, setNewDomainCategory] = useState<DomainCategory>('CUSTOM');
  const [newDomainReason, setNewDomainReason] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [blockNotification, setBlockNotification] = useState<string | null>(null);

  // Contacted domains state
  const [contactedDomains, setContactedDomains] = useState<ContactedDomain[]>(INITIAL_CONTACTED_DOMAINS);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'ALL' | 'ALLOWED' | 'BLOCKED' | 'SUSPICIOUS'>('ALL');
  const [contactSortBy, setContactSortBy] = useState<'COUNT' | 'RECENT' | 'THREAT'>('COUNT');
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState<boolean>(true);

  const isLight = theme === 'light';

  // Live simulation of inbound domain contacts ticking and arriving
  useEffect(() => {
    if (!isSimulatingTraffic) return;

    const interval = setInterval(() => {
      setContactedDomains(prev => {
        // Pick a random domain to increment its contact count
        const randomIndex = Math.floor(Math.random() * prev.length);
        const updated = [...prev];
        const target = { ...updated[randomIndex] };

        target.contactCount += 1;
        target.lastContact = 'Just now';

        // If domain is blocked, increment blocked domain hits too
        if (target.status === 'BLOCKED') {
          setBlockedDomains(bList =>
            bList.map(b => (b.domain === target.domain ? { ...b, hitCount: b.hitCount + 1 } : b))
          );
        }

        updated[randomIndex] = target;
        return updated;
      });

      // Live VPN and Tunnel byte increments
      setVpn(v => {
        if (!v.isConnected) return v;
        const uploadDelta = Math.floor(Math.random() * 18000 + 4000);
        const downloadDelta = Math.floor(Math.random() * 95000 + 15000);
        return {
          ...v,
          bytesUploaded: v.bytesUploaded + uploadDelta,
          bytesDownloaded: v.bytesDownloaded + downloadDelta
        };
      });

      setTunnel(t => {
        if (!t.isOpen) return t;
        return {
          ...t,
          encryptedBytes: t.encryptedBytes + Math.floor(Math.random() * 45000 + 8000),
          uptimeSeconds: t.uptimeSeconds + 3
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulatingTraffic]);

  // Rekeying countdown timer for Tunnel
  useEffect(() => {
    const timer = setInterval(() => {
      setRekeyCountdown(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // One-click Block Domain Handler from Contacted Domains table
  const handleBlockDomain = (domainToBlock: ContactedDomain) => {
    // 1. Update contacted domain status to BLOCKED
    setContactedDomains(prev =>
      prev.map(item =>
        item.id === domainToBlock.id
          ? { ...item, status: 'BLOCKED', isCustomBlocked: true }
          : item
      )
    );

    // 2. Add to blocked domains list if not already present
    const exists = blockedDomains.some(b => b.domain.toLowerCase() === domainToBlock.domain.toLowerCase());
    if (!exists) {
      const newBlockRule: BlockedDomain = {
        id: `blk-${Date.now()}`,
        domain: domainToBlock.domain,
        category: domainToBlock.threatScore > 50 ? 'MALWARE' : 'CUSTOM',
        blockedAt: new Date().toLocaleString(),
        reason: `Manually blocked from Contacted Domains monitor (${domainToBlock.contactCount} prior attempts)`,
        hitCount: domainToBlock.contactCount,
        enabled: true
      };
      setBlockedDomains(prev => [newBlockRule, ...prev]);
    }

    // Trigger subtle notification and audio blip
    setBlockNotification(`Domain "${domainToBlock.domain}" is now blocked. All future inbound contact will be dropped.`);
    audioAnnouncer.playChime(true);
    setTimeout(() => setBlockNotification(null), 4000);
  };

  // One-click Unblock Domain Handler
  const handleUnblockDomain = (domainName: string) => {
    // Remove from blocked list
    setBlockedDomains(prev => prev.filter(b => b.domain.toLowerCase() !== domainName.toLowerCase()));

    // Update in contacted domains to ALLOWED
    setContactedDomains(prev =>
      prev.map(item =>
        item.domain.toLowerCase() === domainName.toLowerCase()
          ? { ...item, status: 'ALLOWED', isCustomBlocked: false }
          : item
      )
    );

    setBlockNotification(`Domain "${domainName}" unblocked and restored to whitelist.`);
    audioAnnouncer.playChime(false);
    setTimeout(() => setBlockNotification(null), 3000);
  };

  // Add custom domain form submit
  const handleAddBlockedDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = newDomainInput.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');
    if (!cleanDomain) return;

    if (blockedDomains.some(b => b.domain.toLowerCase() === cleanDomain)) {
      alert(`Domain "${cleanDomain}" is already in the blocklist.`);
      return;
    }

    const newRule: BlockedDomain = {
      id: `blk-${Date.now()}`,
      domain: cleanDomain,
      category: newDomainCategory,
      blockedAt: new Date().toLocaleString(),
      reason: newDomainReason.trim() || 'Custom administrator sinkhole rule',
      hitCount: 0,
      enabled: true
    };

    setBlockedDomains(prev => [newRule, ...prev]);

    // Also update any matching contacted domains to BLOCKED
    setContactedDomains(prev =>
      prev.map(c =>
        c.domain.toLowerCase() === cleanDomain
          ? { ...c, status: 'BLOCKED' }
          : c
      )
    );

    setNewDomainInput('');
    setNewDomainReason('');
    setBlockNotification(`Domain "${cleanDomain}" successfully added to blocklist.`);
    audioAnnouncer.playChime(false);
    setTimeout(() => setBlockNotification(null), 3500);
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  // Filter & Sort Contacted Domains
  const filteredContactedDomains = useMemo(() => {
    return contactedDomains
      .filter(item => {
        if (contactStatusFilter !== 'ALL' && item.status !== contactStatusFilter) {
          return false;
        }
        if (!contactSearch.trim()) return true;
        const q = contactSearch.toLowerCase();
        return (
          item.domain.toLowerCase().includes(q) ||
          item.resolvedIp.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (contactSortBy === 'COUNT') {
          return b.contactCount - a.contactCount;
        }
        if (contactSortBy === 'THREAT') {
          return b.threatScore - a.threatScore;
        }
        return 0; // Default or recent
      });
  }, [contactedDomains, contactSearch, contactStatusFilter, contactSortBy]);

  // Filter Blocked Domains
  const filteredBlockedDomains = useMemo(() => {
    return blockedDomains.filter(b => {
      if (!domainFilter.trim()) return true;
      const q = domainFilter.toLowerCase();
      return (
        b.domain.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.reason && b.reason.toLowerCase().includes(q))
      );
    });
  }, [blockedDomains, domainFilter]);

  // Aggregate Metrics
  const totalContactAttempts = contactedDomains.reduce((acc, curr) => acc + curr.contactCount, 0);
  const totalBlockedAttempts = contactedDomains
    .filter(c => c.status === 'BLOCKED')
    .reduce((acc, curr) => acc + curr.contactCount, 0);
  const totalAllowedAttempts = totalContactAttempts - totalBlockedAttempts;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in">
      {/* Top Banner / Notification Toast */}
      {blockNotification && (
        <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500 shadow-cyan flex items-center justify-between text-cyan-200 text-xs font-semibold animate-in">
          <div className="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{blockNotification}</span>
          </div>
          <button onClick={() => setBlockNotification(null)} className="text-cyan-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Network Operations Header */}
      <div className={`glass rounded-2xl p-6 border shadow-cyan relative overflow-hidden ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-cyan-500">Encrypted Transport & Filtering</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Shield Active • Killswitch Armed
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-0.5">
                {stealthMode ? 'ENCRYPTED NETWORK ROUTING' : 'VPN, Proxy, Tunnel & Domain Shield'}
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 mt-1 mono">
                <span>VPN: <strong className="text-cyan-400">{vpn.isConnected ? 'Connected' : 'Disconnected'}</strong></span>
                <span>Proxy: <strong className="text-cyan-400">{proxy.isEnabled ? 'SOCKS5 Active' : 'Off'}</strong></span>
                <span>mTLS Tunnel: <strong className="text-emerald-400">{tunnel.isOpen ? 'Established' : 'Closed'}</strong></span>
                <span>Blocked Rules: <strong className="text-rose-400">{blockedDomains.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Inbound Contacts</span>
              <span className="text-lg font-black mono text-cyan-400">{totalContactAttempts.toLocaleString()}</span>
            </div>
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Blocked Hits</span>
              <span className="text-lg font-black mono text-rose-400">{totalBlockedAttempts.toLocaleString()}</span>
            </div>
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Allowed Contacts</span>
              <span className="text-lg font-black mono text-emerald-400">{totalAllowedAttempts.toLocaleString()}</span>
            </div>
            <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Unique Domains</span>
              <span className="text-lg font-black mono text-white">{contactedDomains.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Contacted Domains Tab */}
          <button
            id="tab-contacted-domains-btn"
            onClick={() => setActiveSection('contacted_domains')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'contacted_domains'
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Domains Contacting Device ({contactedDomains.length})</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Nearby IPs Accessing Device Tab */}
          <button
            id="tab-nearby-ips-btn"
            onClick={() => setActiveSection('nearby_ips')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'nearby_ips'
                ? 'bg-rose-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>IPs Near Me (Intrusions)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              8 BLOCKED
            </span>
          </button>

          {/* 1-Min Firewall Reload Engine Tab */}
          <button
            id="tab-firewall-reload-btn"
            onClick={() => setActiveSection('firewall_reload')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'firewall_reload'
                ? 'bg-emerald-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>1-Min Firewall Reload</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              60s LOOP
            </span>
          </button>

          {/* Location Changer Tab */}
          <button
            id="tab-location-changer-btn"
            onClick={() => setActiveSection('location_changer')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'location_changer'
                ? 'bg-purple-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Location Changer</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
              RUNNING
            </span>
          </button>

          {/* Analytics Logging Blocker Tab */}
          <button
            id="tab-analytics-blocker-btn"
            onClick={() => setActiveSection('analytics_blocker')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'analytics_blocker'
                ? 'bg-rose-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>Analytics Logger Blocker</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              ZERO LOGGING
            </span>
          </button>

          {/* Node Access Shield Tab */}
          <button
            id="tab-node-access-btn"
            onClick={() => setActiveSection('node_access')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'node_access'
                ? 'bg-amber-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Node Access Shield</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
              BLOCKED 100%
            </span>
          </button>

          {/* Cloudflare Incoming Packets Drop Tab */}
          <button
            id="tab-cloudflare-packets-btn"
            onClick={() => setActiveSection('cloudflare_packets')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'cloudflare_packets'
                ? 'bg-rose-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>Cloudflare Ingress Dropper</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              DROP 100%
            </span>
          </button>

          {/* Block Domains Section Tab */}
          <button
            id="tab-block-domains-btn"
            onClick={() => setActiveSection('block_domains')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'block_domains'
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>Block Domains & Cloudflare ({blockedDomains.length})</span>
          </button>

          {/* Foreign States Geo-Shield Tab */}
          <button
            id="tab-foreign-states-btn"
            onClick={() => setActiveSection('foreign_states')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'foreign_states'
                ? 'bg-rose-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Foreign States Shield</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              ALL BLOCKED
            </span>
          </button>

          {/* Bluetooth Hardware & Pairing Blocker Tab */}
          <button
            id="tab-bluetooth-shield-btn"
            onClick={() => setActiveSection('bluetooth_shield')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'bluetooth_shield'
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>Bluetooth & Pairing</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              RADIO KILLED
            </span>
          </button>

          {/* Hardware Integrity & Peripheral Kill-Switch Tab */}
          <button
            id="tab-hardware-integrity-btn"
            onClick={() => setActiveSection('hardware_integrity')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'hardware_integrity'
                ? 'bg-rose-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>Hardware Integrity</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
              OTG GUARD
            </span>
          </button>

          {/* Network Sharing Shield Tab */}
          <button
            id="tab-network-sharing-btn"
            onClick={() => setActiveSection('network_sharing')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'network_sharing'
                ? 'bg-amber-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span>Network Sharing</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
              BLOCKED
            </span>
          </button>

          {/* Packet Concealment & Anti-DPI Tab */}
          <button
            id="tab-packet-concealment-btn"
            onClick={() => setActiveSection('packet_concealment')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'packet_concealment'
                ? 'bg-emerald-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Packet Concealment</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ANTI-DPI
            </span>
          </button>

          {/* VPN, Proxy & Tunnel Controls Tab */}
          <button
            id="tab-vpn-proxy-tunnel-btn"
            onClick={() => setActiveSection('vpn_proxy_tunnel')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'vpn_proxy_tunnel'
                ? 'bg-cyan-600 text-white shadow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>VPN, Proxy & Tunnel</span>
          </button>
        </div>

        {/* Live Traffic simulation toggle */}
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="text-[11px] text-slate-400 mono">Traffic Probe:</span>
          <button
            onClick={() => setIsSimulatingTraffic(!isSimulatingTraffic)}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
              isSimulatingTraffic
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isSimulatingTraffic ? '● Inbound Live' : '❚❚ Paused'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CONTACTED DOMAINS & HIT FREQUENCY MONITOR     */}
      {/* ======================================================== */}
      {activeSection === 'contacted_domains' && (
        <div className="space-y-6 animate-in">
          {/* Explanatory Banner & Quick Stats */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white">Inbound & Outbound Domain Contact Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed inspection of every remote domain that has contacted your workstation, complete with exact hit count, security assessment, and one-click instant blocking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={() => setActiveSection('block_domains')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Custom Block Rule</span>
              </button>
            </div>
          </div>

          {/* Table Controls: Search, Filters, Sorting */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search domain, IP address, or category..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                className={`w-full text-xs rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-cyan-500 border transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className={`flex rounded-lg p-0.5 border ${isLight ? 'bg-slate-200/60 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
                {(['ALL', 'ALLOWED', 'BLOCKED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setContactStatusFilter(st)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                      contactStatusFilter === st
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-[10px] uppercase font-bold">Sort:</span>
                <select
                  value={contactSortBy}
                  onChange={e => setContactSortBy(e.target.value as any)}
                  className={`text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none font-medium ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="COUNT">Most Contacted (Highest Hits)</option>
                  <option value="THREAT">Threat Score (Highest)</option>
                  <option value="RECENT">Recent Activity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contacted Domains Feed & Hit Frequency Table */}
          <div className={`glass rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                  isLight ? 'bg-slate-100/80 border-slate-200 text-slate-600' : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}>
                  <tr>
                    <th className="py-3 px-4">Remote Domain</th>
                    <th className="py-3 px-4 text-center">Contact Frequency</th>
                    <th className="py-3 px-4">Enforcement Status</th>
                    <th className="py-3 px-4">Resolved IP & Origin</th>
                    <th className="py-3 px-4">Protocol & Port</th>
                    <th className="py-3 px-4">Last Contacted</th>
                    <th className="py-3 px-4 text-right">Shield Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono" data-sensitive-data="true">
                  {filteredContactedDomains.map((item, idx) => {
                    const maxHits = Math.max(...contactedDomains.map(d => d.contactCount), 1);
                    const percentage = Math.round((item.contactCount / maxHits) * 100);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          idx % 2 === 0
                            ? isLight ? 'bg-white' : 'bg-slate-900/20'
                            : isLight ? 'bg-slate-50/50' : 'bg-slate-900/40'
                        } ${
                          item.status === 'BLOCKED'
                            ? isLight ? 'hover:bg-rose-50/50' : 'hover:bg-rose-950/20'
                            : isLight ? 'hover:bg-cyan-50/50' : 'hover:bg-cyan-950/20'
                        }`}
                      >
                        {/* Domain & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              item.status === 'BLOCKED'
                                ? 'bg-rose-500'
                                : item.threatScore > 50
                                ? 'bg-amber-400 animate-ping'
                                : 'bg-emerald-400'
                            }`} />
                            <div>
                              <span className="font-bold text-sm tracking-tight text-white font-sans block">
                                {item.domain}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-sans">{item.category}</span>
                                {item.threatScore > 50 && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                    Threat {item.threatScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Frequency / Times Contacted */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-black mono text-cyan-300">
                              {item.contactCount.toLocaleString()}{' '}
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">times</span>
                            </span>
                            {/* Visual hit bar */}
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-cyan-400'
                                }`}
                                style={{ width: `${Math.max(percentage, 8)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Enforcement Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                            item.status === 'BLOCKED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'BLOCKED' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                            {item.status === 'BLOCKED' ? 'SINKHOLED / BLOCKED' : 'ALLOWED'}
                          </span>
                        </td>

                        {/* Resolved IP & Origin */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs text-slate-300">{item.resolvedIp}</div>
                          <div className="text-[10px] text-slate-500 font-sans">Origin: {item.country} Node</div>
                        </td>

                        {/* Protocol & Port */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                            {item.protocol} :{item.port}
                          </span>
                        </td>

                        {/* Last Contacted */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-400">{item.lastContact}</span>
                          <div className="text-[10px] text-slate-600 font-sans">First: {item.firstContact}</div>
                        </td>

                        {/* Quick Action Button */}
                        <td className="py-3.5 px-4 text-right">
                          {item.status === 'ALLOWED' ? (
                            <button
                              onClick={() => handleBlockDomain(item)}
                              title={`Block domain ${item.domain} and drop all future traffic`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/50 hover:bg-rose-900 border border-rose-800 transition-all shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              <span>Block Domain</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblockDomain(item.domain)}
                              title={`Unblock domain ${item.domain}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Unblock</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredContactedDomains.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <p className="text-xs uppercase font-bold tracking-widest">No contacted domains match current filter</p>
                        <p className="text-xs mt-1">Try broadening your search query or reset status filter</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center gap-4">
                <span>Showing <strong className="text-white">{filteredContactedDomains.length}</strong> of <strong className="text-white">{contactedDomains.length}</strong> domains</span>
                <span>•</span>
                <span>Total Accumulated Contacts: <strong className="mono text-cyan-400">{totalContactAttempts.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setContactedDomains(INITIAL_CONTACTED_DOMAINS);
                    setBlockNotification('Contact metrics reset to baseline telemetry snapshot.');
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Reset Telemetry Counters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: DOMAIN BLOCKER & DNS SINKHOLE ENGINE         */}
      {/* ======================================================== */}
      {activeSection === 'block_domains' && (
        <div className="space-y-6 animate-in">
          {/* Add New Domain to Blocklist Form */}
          <div className={`glass rounded-2xl p-6 border ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="font-bold text-sm uppercase tracking-widest">Add Domain to Blocklist (DNS Sinkhole)</h3>
              </div>
              <span className="text-xs text-slate-500">All outbound and inbound connections to this domain will be immediately intercepted</span>
            </div>

            <form onSubmit={handleAddBlockedDomain} className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="e.g. tracker.malicious-payload.cc or *.untrusted-domain.com"
                  value={newDomainInput}
                  onChange={e => setNewDomainInput(e.target.value)}
                  className={`w-full text-xs mono rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-900 border-slate-700 text-rose-300 placeholder:text-slate-600'
                  }`}
                />
              </div>

              <div className="w-full lg:w-48">
                <select
                  value={newDomainCategory}
                  onChange={e => setNewDomainCategory(e.target.value as DomainCategory)}
                  className={`w-full text-xs rounded-xl px-3 py-3 border focus:outline-none font-bold ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="MALWARE">MALWARE</option>
                  <option value="TRACKER">TRACKER</option>
                  <option value="C2_BOTNET">C2_BOTNET</option>
                  <option value="PHISHING">PHISHING</option>
                  <option value="ADWARE">ADWARE</option>
                  <option value="TELEMETRY">TELEMETRY</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Reason / Threat description (optional)"
                  value={newDomainReason}
                  onChange={e => setNewDomainReason(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!newDomainInput.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-all shadow-lg shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Add to Blocklist</span>
              </button>
            </form>

            {/* Quick Threat Feeds Toggle Chips */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 self-center mr-2">Quick Shield Filters:</span>
              {[
                { label: 'Block Known C2 Botnets', active: true },
                { label: 'Block Aggressive Trackers', active: true },
                { label: 'Sinkhole Cryptojackers', active: true },
                { label: 'Enforce Strict DNS Sinkhole (0.0.0.0)', active: true }
              ].map((pill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {pill.label}
                </span>
              ))}
            </div>
          </div>

          {/* Dedicated Cloudflare Integration Blocker */}
          <div className={`glass rounded-2xl p-6 border shadow-cyan relative overflow-hidden ${
            isLight ? 'border-amber-200 bg-amber-50/20' : 'border-amber-500/30 bg-slate-900/60'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Infrastructure Isolation</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                      cloudflareBlocked
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cloudflareBlocked ? 'bg-rose-400' : 'bg-amber-400'}`} />
                      {cloudflareBlocked ? 'CLOUDFLARE INTEGRATION: BLOCKED & SINKHOLED' : 'CLOUDFLARE: PARTIAL ALLOW'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white mt-1">Cloudflare Subsystem & CDN Blocker</h4>
                  <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                    Blocks all Cloudflare Anycast IP ranges (104.16.0.0/12, 172.64.0.0/13, 162.159.0.0/16, 1.1.1.1), Cloudflare CDN proxies, DNS over HTTPS resolvers, Workers, Pages, and NTP synchronization. All Cloudflare traffic is sinkholed at the kernel level.
                  </p>
                </div>
              </div>

              {/* Cloudflare Master Switch & Ingress Link */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="jump-to-cf-ingress-dropper-btn"
                  onClick={() => setActiveSection('cloudflare_packets')}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Line-Rate Ingress Dropper</span>
                </button>

                <button
                  id="toggle-cloudflare-master-block-btn"
                  onClick={() => {
                    const next = !cloudflareBlocked;
                    setCloudflareBlocked(next);
                    setCfDnsBlocked(next);
                    setCfCdnBlocked(next);
                    setCfWorkersBlocked(next);
                    setCfWarpBlocked(next);
                    setCfNtpBlocked(next);
                    setCfStripHeaders(next);
                    setBlockNotification(
                      next
                        ? 'CLOUDFLARE ISOLATION ENFORCED: All Cloudflare Anycast IPs, CDN mirrors, and DNS resolvers dropped.'
                        : 'Cloudflare isolation relaxed.'
                    );
                    audioAnnouncer.playChime(next);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-cyan ${
                    cloudflareBlocked
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {cloudflareBlocked ? '✓ Cloudflare Blocked (Active)' : 'Block Cloudflare Integration'}
                </button>
              </div>
            </div>

            {/* Cloudflare Subsystem Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'cf-dns',
                  label: 'Cloudflare DNS (1.1.1.1 & DoH)',
                  desc: 'Drops 1.1.1.1, 1.0.0.1, and cloudflare-dns.com queries',
                  active: cfDnsBlocked,
                  toggle: () => setCfDnsBlocked(!cfDnsBlocked)
                },
                {
                  id: 'cf-cdn',
                  label: 'Cloudflare Edge CDN & Proxies',
                  desc: 'Blocks *.cloudflare.com, cdnjs.cloudflare.com',
                  active: cfCdnBlocked,
                  toggle: () => setCfCdnBlocked(!cfCdnBlocked)
                },
                {
                  id: 'cf-workers',
                  label: 'Workers & Pages (*.workers.dev)',
                  desc: 'Blocks Cloudflare serverless edge execution nodes',
                  active: cfWorkersBlocked,
                  toggle: () => setCfWorkersBlocked(!cfWorkersBlocked)
                },
                {
                  id: 'cf-warp',
                  label: 'Cloudflare WARP Ingress',
                  desc: 'Intersects warp.cloudflare.com client tunnels',
                  active: cfWarpBlocked,
                  toggle: () => setCfWarpBlocked(!cfWarpBlocked)
                },
                {
                  id: 'cf-ntp',
                  label: 'Cloudflare NTP Clock Sync',
                  desc: 'Sinkholes time.cloudflare.com on UDP port 123',
                  active: cfNtpBlocked,
                  toggle: () => setCfNtpBlocked(!cfNtpBlocked)
                },
                {
                  id: 'cf-headers',
                  label: 'Strip Cloudflare Headers',
                  desc: 'Removes CF-Ray, CF-Connecting-IP, CF-Visitor',
                  active: cfStripHeaders,
                  toggle: () => setCfStripHeaders(!cfStripHeaders)
                }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={item.toggle}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    item.active
                      ? 'border-amber-500/40 bg-amber-500/10 shadow-cyan'
                      : isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{item.label}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                      item.active
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {item.active ? 'BLOCKED' : 'PASS'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Cloudflare Telemetry Dropped Counters */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-slate-400 mono text-[11px]">
                <span>Cloudflare Packets Dropped: <strong className="text-rose-400">{cfPacketsDropped.toLocaleString()}</strong></span>
                <span>DNS Queries Intercepted: <strong className="text-amber-400">{cfDnsIntercepted.toLocaleString()}</strong></span>
                <span>CDN Assets Sinkholed: <strong className="text-cyan-400">{cfCdnSinkholed.toLocaleString()}</strong></span>
              </div>
              <span className="text-[10px] text-slate-500">
                IP Ranges In Scope: 104.16.0.0/12, 172.64.0.0/13, 162.159.0.0/16, 1.1.1.1/32
              </span>
            </div>
          </div>

          {/* Blocked Domains List */}
          <div className={`glass rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">Active Blocked Domains & DNS Sinkhole Rules</h3>
                  <p className="text-xs text-slate-500">
                    {filteredBlockedDomains.length} rules loaded • Total {filteredBlockedDomains.reduce((a, c) => a + c.hitCount, 0)} access attempts intercepted
                  </p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter blocked domains..."
                  value={domainFilter}
                  onChange={e => setDomainFilter(e.target.value)}
                  className={`text-xs rounded-lg px-3 py-1.5 pl-8 border focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredBlockedDomains.map(b => (
                <div
                  key={b.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">{b.domain}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {b.category}
                        </span>
                        <span className="text-[10px] text-slate-500">Blocked: {b.blockedAt}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{b.reason || 'No description provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Intercepted Hits</span>
                      <span className="text-sm font-black mono text-rose-400">{b.hitCount.toLocaleString()} attempts</span>
                    </div>

                    <button
                      onClick={() => handleUnblockDomain(b.domain)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              ))}

              {filteredBlockedDomains.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <p className="text-xs uppercase tracking-widest font-bold">No blocked domains match current search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: VPN, PROXY & ENCRYPTED TUNNEL MANAGER         */}
      {/* ======================================================== */}
      {activeSection === 'vpn_proxy_tunnel' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. VPN GATEWAY CONTROLLER */}
            <div className={`glass rounded-2xl p-6 border flex flex-col justify-between ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${vpn.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <h3 className="font-bold text-base tracking-tight text-white">Quantum VPN Gateway</h3>
                  </div>
                  <button
                    onClick={() => {
                      setVpn(v => ({
                        ...v,
                        isConnected: !v.isConnected,
                        status: !v.isConnected ? 'CONNECTED' : 'DISCONNECTED'
                      }));
                      audioAnnouncer.playChime(vpn.isConnected);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      vpn.isConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {vpn.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Encrypted WireGuard / Quantum-Mesh VPN tunnel routing all workstation TCP/UDP traffic through zero-knowledge privacy nodes.
                </p>

                <div className="space-y-3 text-xs mono">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Server Gateway Node</span>
                    <select
                      value={vpn.serverLocation}
                      onChange={e => {
                        const s = VPN_SERVERS.find(srv => srv.name === e.target.value);
                        setVpn(prev => ({
                          ...prev,
                          serverLocation: e.target.value,
                          serverIp: s ? s.ip : prev.serverIp,
                          latencyMs: s ? s.latency : prev.latencyMs
                        }));
                      }}
                      className={`w-full text-xs rounded-lg p-2 border font-mono focus:outline-none ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-cyan-300'
                      }`}
                    >
                      {VPN_SERVERS.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.latency}ms)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs" data-sensitive-data="true">
                    <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Assigned Virtual IP</span>
                      <span className="text-cyan-400 font-bold">{vpn.virtualIp}</span>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Public Gateway IP</span>
                      <span className="text-slate-300 font-bold">{vpn.serverIp}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Latency</span>
                      <span className="text-emerald-400 font-bold">{vpn.latencyMs} ms</span>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Protocol</span>
                      <span className="text-purple-400 font-bold">{vpn.protocol}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">Emergency Killswitch</span>
                    <span className="text-[10px] text-slate-400">Block all non-VPN traffic on disconnect</span>
                  </div>
                  <button
                    onClick={() => setVpn(v => ({ ...v, killswitchEnabled: !v.killswitchEnabled }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      vpn.killswitchEnabled ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      vpn.killswitchEnabled ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-3 mono">
                  <span>▲ Up: {formatBytes(vpn.bytesUploaded)}</span>
                  <span>▼ Down: {formatBytes(vpn.bytesDownloaded)}</span>
                </div>
              </div>
            </div>

            {/* 2. ANONYMIZING MULTI-HOP PROXY */}
            <div className={`glass rounded-2xl p-6 border flex flex-col justify-between ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${proxy.isEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <h3 className="font-bold text-base tracking-tight text-white">Anonymizing Proxy Engine</h3>
                  </div>
                  <button
                    onClick={() => {
                      setProxy(p => ({ ...p, isEnabled: !p.isEnabled }));
                      audioAnnouncer.playChime(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      proxy.isEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {proxy.isEnabled ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Multi-hop SOCKS5 & ShadowSocks proxy masking application layer protocol headers and user-agent metadata.
                </p>

                <div className="space-y-3 text-xs mono" data-sensitive-data="true">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Local Proxy Binding</span>
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">{proxy.host}:{proxy.port}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-purple-400 font-bold border border-slate-700">
                        {proxy.protocol}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-2">Multi-Hop Relay Chain</span>
                    <div className="space-y-1.5">
                      {proxy.activeHops.map((hop, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-cyan-500 font-bold">Node 0{idx + 1} ➔</span>
                          <span className="text-slate-300">{hop}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">DNS Leak Protection</span>
                    <span className="text-[10px] text-slate-400">Force DNS queries through encrypted proxy socket</span>
                  </div>
                  <button
                    onClick={() => setProxy(p => ({ ...p, dnsLeakProtection: !p.dnsLeakProtection }))}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      proxy.dnsLeakProtection ? 'bg-cyan-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      proxy.dnsLeakProtection ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-3 mono">
                  <span>Routed: {formatBytes(proxy.trafficRoutedKb * 1024)}</span>
                  <span className="text-emerald-400">Zero DNS Leaks</span>
                </div>
              </div>
            </div>

            {/* 3. ENCRYPTED SECURE TUNNEL (mTLS / WIRE GUARD EDGE) */}
            <div className={`glass rounded-2xl p-6 border flex flex-col justify-between ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${tunnel.isOpen ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
                    <h3 className="font-bold text-base tracking-tight text-white">mTLS Encrypted Tunnel</h3>
                  </div>
                  <button
                    onClick={() => {
                      setTunnel(t => ({
                        ...t,
                        isOpen: !t.isOpen,
                        handshakeStatus: !t.isOpen ? 'ESTABLISHED' : 'INACTIVE'
                      }));
                      audioAnnouncer.playChime(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      tunnel.isOpen
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    {tunnel.isOpen ? 'OPEN' : 'CLOSED'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Hardware-backed mutual TLS (mTLS) reverse tunnel connecting this endpoint directly to the sovereign SecOps control plane.
                </p>

                <div className="space-y-3 text-xs mono" data-sensitive-data="true">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Tunnel Remote Endpoint</span>
                    <span className="text-purple-300 font-bold block truncate">{tunnel.remoteEndpoint}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Local Ingress</span>
                      <span className="text-slate-300 font-bold">{tunnel.localBind}</span>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
                      <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block">Handshake</span>
                      <span className="text-emerald-400 font-bold">{tunnel.handshakeStatus}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Ephemeral Re-key Timer</span>
                      <span className="text-cyan-400 font-bold">{rekeyCountdown}s</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-purple-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(rekeyCountdown / 60) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">Tunnel ID</span>
                    <span className="text-[10px] text-slate-400 mono">{tunnel.tunnelId}</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                    Curve25519 Ephemeral
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-3 mono">
                  <span>Encrypted Payload: {formatBytes(tunnel.encryptedBytes)}</span>
                  <span>Uptime: {Math.floor(tunnel.uptimeSeconds / 60)}m {tunnel.uptimeSeconds % 60}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION: ZERO ANALYTICS LOGGING SHIELD                   */}
      {/* ======================================================== */}
      {activeSection === 'analytics_blocker' && (
        <AnalyticsLoggingShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION: ZERO NODE ACCESS SHIELD                         */}
      {/* ======================================================== */}
      {activeSection === 'node_access' && (
        <NodeAccessShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION: CLOUDFLARE INCOMING PACKET DROP SHIELD          */}
      {/* ======================================================== */}
      {activeSection === 'cloudflare_packets' && (
        <CloudflarePacketShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 4: NEARBY IPS ACCESSING DEVICE (INTRUSIONS)     */}
      {/* ======================================================== */}
      {activeSection === 'nearby_ips' && (
        <NearbyDevicesIntrusionShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 5: FOREIGN STATES GEO-BLOCKING DEFENSE          */}
      {/* ======================================================== */}
      {activeSection === 'foreign_states' && (
        <ForeignStatesGeoShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 6: BLUETOOTH ACCESS & DEVICE PAIRING BLOCKER    */}
      {/* ======================================================== */}
      {activeSection === 'bluetooth_shield' && (
        <BluetoothPairingShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 6B: HARDWARE INTEGRITY & PERIPHERAL KILL-SWITCH  */}
      {/* ======================================================== */}
      {activeSection === 'hardware_integrity' && (
        <HardwareIntegrityShield theme={theme} stealthMode={stealthMode} />
      )}

      {/* ======================================================== */}
      {/* SECTION 7: NETWORK SHARING & REMOTE RESOURCE BLOCKER    */}
      {/* ======================================================== */}
      {activeSection === 'network_sharing' && (
        <NetworkSharingShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 8: ANTI-PACKET INSPECTION & TRAFFIC CONCEALMENT */}
      {/* ======================================================== */}
      {activeSection === 'packet_concealment' && (
        <PacketConcealmentShield theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 9: 1-MINUTE AUTOMATIC FIREWALL RELOAD ENGINE    */}
      {/* ======================================================== */}
      {activeSection === 'firewall_reload' && (
        <FirewallReloadEngine theme={theme} />
      )}

      {/* ======================================================== */}
      {/* SECTION 10: AUTONOMOUS LOCATION CHANGER (NODE HOPPER)   */}
      {/* ======================================================== */}
      {activeSection === 'location_changer' && (
        <LocationChangerEngine
          theme={theme}
          onLocationChanged={handleLocationChangedFromHopper}
        />
      )}
    </div>
  );
};

export default NetworkRoutingShield;
