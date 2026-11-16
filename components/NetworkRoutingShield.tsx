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

  //