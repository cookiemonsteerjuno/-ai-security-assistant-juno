     1	import React, { useState, useEffect, useMemo, useRef } from 'react';
     2	import { SecurityStatus, SecurityModule, SecurityLog, AuditExportPayload } from '../types';
     3	import { INITIAL_MODULES } from '../constants';
...
   197	      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
   198	      const protocols = ['TLS 1.3', 'HTTPS', 'TCP', 'DNS-over-HTTPS', 'SSH/v2', 'gRPC'];
   199	      const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
   200	      const randomIp = `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(M...
Tool Call
Function Name:
Read
Arguments:
file_path:
/home/user/downloads/SecurityDashboard.tsx
limit:
200
Response
     1	import React, { useState, useEffect, useMemo, useRef } from 'react';
     2	import { SecurityStatus, SecurityModule, SecurityLog, AuditExportPayload } from '../types';
     3	import { INITIAL_MODULES } from '../constants';
     4	import DeviceCommandsMonitor from './DeviceCommandsMonitor';
     5	import PacketTrafficChart from './PacketTrafficChart';
     6	import { ScreenMaskGuardPanel } from './ScreenMaskOverlay';
     7	import { audioAnnouncer } from '../services/audioAnnouncer';
     8	import { androidPatchScanner, AndroidPatchScannerSnapshot } from '../services/androidPatchScanner';
     9	import { inboundCommsService, InboundCommsSnapshot } from '../services/inboundCommsService';
    10	import { hardwareIntegrityService } from '../services/hardwareIntegrityService';
    11	import { screenMaskService } from '../services/screenMaskService';
    12	import { simSwitchLockService } from '../services/simSwitchLockService';
    13	import { HardwareIntegrityState, ScreenMaskState, SimSwitchLockState } from '../types';
    14	
    15	interface SecurityDashboardProps {
    16	  stealthMode: boolean;
    17	  theme?: 'dark' | 'light';
    18	  onNavigateToCommands?: () => void;
    19	  onNavigateToMobile?: (section?: 'patches' | 'comms' | 'sim_lock' | 'apk') => void;
    20	  onNavigateToNetwork?: (
    21	    section?:
    22	      | 'contacted_domains'
    23	      | 'analytics_blocker'
    24	      | 'node_access'
    25	      | 'cloudflare_packets'
    26	      | 'foreign_states'
    27	      | 'bluetooth_shield'
    28	      | 'hardware_integrity'
    29	      | 'network_sharing'
    30	      | 'packet_concealment'
    31	      | 'nearby_ips'
    32	      | 'firewall_reload'
    33	      | 'location_changer'
    34	      | 'block_domains'
    35	      | 'vpn_proxy_tunnel'
    36	  ) => void;
    37	}
    38	
    39	const INITIAL_LOGS: SecurityLog[] = [
    40	  {
    41	    id: 'log-sec-901',
    42	    timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
    43	    isoTimestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    44	    event: 'Anomalous traffic signature detected on ingress interface',
    45	    status: SecurityStatus.THREAT_DETECTED,
    46	    severity: 'HIGH',
    47	    protocol: 'HTTPS/TLS 1.3',
    48	    origin: 'Gateway-US-East',
    49	    sourceIp: '198.51.100.42',
    50	    destinationPort: 443
    51	  },
    52	  {
    53	    id: 'log-sec-902',
    54	    timestamp: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString(),
    55	    isoTimestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    56	    event: 'Unauthorized packet drop: SYN flood threshold exceeded',
    57	    status: SecurityStatus.BLOCKED,
    58	    severity: 'MEDIUM',
    59	    protocol: 'TCP',
    60	    origin: 'Edge-Proxy-04',
    61	    sourceIp: '203.0.113.195',
    62	    destinationPort: 8080
    63	  },
    64	  {
    65	    id: 'log-sec-903',
    66	    timestamp: new Date(Date.now() - 1000 * 60 * 6).toLocaleTimeString(),
    67	    isoTimestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    68	    event: 'Heartbeat signal synchronized across distributed nodes',
    69	    status: SecurityStatus.ACTIVE,
    70	    severity: 'INFO',
    71	    protocol: 'gRPC/mTLS',
    72	    origin: 'Node-14',
    73	    sourceIp: '10.0.1.24',
    74	    destinationPort: 50051
    75	  },
    76	  {
    77	    id: 'log-sec-904',
    78	    timestamp: new Date(Date.now() - 1000 * 60 * 9).toLocaleTimeString(),
    79	    isoTimestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    80	    event: 'Heuristic packet inspection passed zero-knowledge proof',
    81	    status: SecurityStatus.ACTIVE,
    82	    severity: 'LOW',
    83	    protocol: 'TLS 1.3',
    84	    origin: 'Node-88',
    85	    sourceIp: '172.16.4.11',
    86	    destinationPort: 443
    87	  },
    88	  {
    89	    id: 'log-sec-905',
    90	    timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
    91	    isoTimestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    92	    event: 'Malicious payload signature blocked in encrypted tunnel',
    93	    status: SecurityStatus.BLOCKED,
    94	    severity: 'HIGH',
    95	    protocol: 'SSH/v2',
    96	    origin: 'Node-201',
    97	    sourceIp: '192.0.2.77',
    98	    destinationPort: 22
    99	  },
   100	  {
   101	    id: 'log-sec-906',
   102	    timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
   103	    isoTimestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
   104	    event: 'Biometric authorization credentials validated with HSM',
   105	    status: SecurityStatus.ACTIVE,
   106	    severity: 'INFO',
   107	    protocol: 'FIDO2/WebAuthn',
   108	    origin: 'Auth-Cluster-02',
   109	    sourceIp: '10.0.0.5',
   110	    destinationPort: 8443
   111	  }
   112	];
   113	
   114	const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
   115	  stealthMode,
   116	  theme = 'dark',
   117	  onNavigateToCommands,
   118	  onNavigateToMobile,
   119	  onNavigateToNetwork
   120	}) => {
   121	  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'commands'>('overview');
   122	  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState<boolean>(false);
   123	  const [currentSpokenAction, setCurrentSpokenAction] = useState<string | null>(null);
   124	  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(audioAnnouncer.getIsMuted());
   125	  const [patchSnapshot, setPatchSnapshot] = useState<AndroidPatchScannerSnapshot>(() =>
   126	    androidPatchScanner.getSnapshot()
   127	  );
   128	  const [commsSnapshot, setCommsSnapshot] = useState<InboundCommsSnapshot>(() =>
   129	    inboundCommsService.getSnapshot()
   130	  );
   131	  const [hwSnapshot, setHwSnapshot] = useState<HardwareIntegrityState>(() =>
   132	    hardwareIntegrityService.getSnapshot()
   133	  );
   134	  const [maskSnapshot, setMaskSnapshot] = useState<ScreenMaskState>(() =>
   135	    screenMaskService.getSnapshot()
   136	  );
   137	  const [simSnapshot, setSimSnapshot] = useState<SimSwitchLockState>(() =>
   138	    simSwitchLockService.getSnapshot()
   139	  );
   140	  const [modules, setModules] = useState<SecurityModule[]>(INITIAL_MODULES as unknown as SecurityModule[]);
   141	  const [logs, setLogs] = useState<SecurityLog[]>(INITIAL_LOGS);
   142	  const [filter, setFilter] = useState<SecurityStatus | 'ALL'>('ALL');
   143	  const [searchQuery, setSearchQuery] = useState('');
   144	  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
   145	  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
   146	  const [copiedPreview, setCopiedPreview] = useState(false);
   147	  const [exportNotification, setExportNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
   148	
   149	  const dropdownRef = useRef<HTMLDivElement>(null);
   150	  const logsSectionRef = useRef<HTMLDivElement>(null);
   151	
   152	  useEffect(() => {
   153	    const unsub = audioAnnouncer.subscribe(s => {
   154	      setIsVoiceSpeaking(s.isSpeaking);
   155	      setCurrentSpokenAction(s.currentText);
   156	      setIsVoiceMuted(s.isMuted);
   157	    });
   158	    const unsubPatch = androidPatchScanner.subscribe(setPatchSnapshot);
   159	    const unsubComms = inboundCommsService.subscribe(setCommsSnapshot);
   160	    const unsubHw = hardwareIntegrityService.subscribe(setHwSnapshot);
   161	    const unsubMask = screenMaskService.subscribe(setMaskSnapshot);
   162	    const unsubSim = simSwitchLockService.subscribe(setSimSnapshot);
   163	    return () => {
   164	      unsub();
   165	      unsubPatch();
   166	      unsubComms();
   167	      unsubHw();
   168	      unsubMask();
   169	      unsubSim();
   170	    };
   171	  }, []);
   172	
   173	  // Close dropdown when clicking outside
   174	  useEffect(() => {
   175	    const handleClickOutside = (event: MouseEvent) => {
   176	      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
   177	        setIsExportMenuOpen(false);
   178	      }
   179	    };
   180	    document.addEventListener('mousedown', handleClickOutside);
   181	    return () => document.removeEventListener('mousedown', handleClickOutside);
   182	  }, []);
   183	
   184	  // Dynamic Score calculation
   185	  const securityScore = useMemo(() => {
   186	    const totalHealth = modules.reduce((acc, m) => acc + m.health, 0);
   187	    const avgHealth = totalHealth / modules.length;
   188	    // Penalize score if any module is in THREAT_DETECTED status
   189	    const penalty = modules.filter(m => m.status === SecurityStatus.THREAT_DETECTED).length * 15;
   190	    return Math.max(0, Math.min(100, Math.round(avgHealth - penalty)));
   191	  }, [modules]);
   192	
   193	  // Simulate incoming logs and occasional threats
   194	  useEffect(() => {
   195	    const interval = setInterval(() => {
   196	      const statuses = [SecurityStatus.ACTIVE, SecurityStatus.BLOCKED, SecurityStatus.THREAT_DETECTED];
   197	      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
   198	      const protocols = ['TLS 1.3', 'HTTPS', 'TCP', 'DNS-over-HTTPS', 'SSH/v2', 'gRPC'];
   199	      const randomProtocol = protocols[Math.floor(Math.random() * protocols.length)];
   200	      const randomIp = `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;