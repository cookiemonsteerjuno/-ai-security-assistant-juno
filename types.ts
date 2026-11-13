
export enum SecurityStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  THREAT_DETECTED = 'THREAT_DETECTED',
  PENDING = 'PENDING',
}

export interface SecurityModule {
  id: string;
  name: string;
  status: SecurityStatus;
  health: number;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  isoTimestamp?: string;
  event: string;
  status: SecurityStatus;
  origin: string;
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  protocol?: string;
  sourceIp?: string;
  destinationPort?: number;
}

export interface AuditExportPayload {
  reportHeader: {
    auditTitle: string;
    exportTimestamp: string;
    generatedBy: string;
    environment: string;
    systemIntegrityScore: string;
    filterApplied: string;
    totalEntries: number;
    threatSummary: {
      active: number;
      blocked: number;
      threatDetected: number;
    };
    moduleHealthSnapshot: Array<{
      id: string;
      name: string;
      status: string;
      health: number;
    }>;
  };
  interceptionLogs: SecurityLog[];
}

export type CommandSeverity = 'CRITICAL' | 'ELEVATED' | 'STANDARD' | 'ROUTINE';
export type CommandExecutionStatus = 'EXECUTING' | 'SUCCESS' | 'BLOCKED' | 'PENDING_CONFIRMATION' | 'ENFORCED';

export interface DeviceCommand {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  targetDevice: string;
  sourceDispatcher: string;
  commandText: string;
  actionSummary: string;
  category: 'NETWORK' | 'ACCESS_CONTROL' | 'ENCRYPTION' | 'SYSTEM' | 'TELEMETRY' | 'PATCH';
  severity: CommandSeverity;
  status: CommandExecutionStatus;
  authorizedBy: string;
  spokenAnnouncement?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

// VPN, Proxy, and Encrypted Tunnel types
export interface VPNState {
  isConnected: boolean;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  serverLocation: string;
  serverCountryCode: string;
  serverIp: string;
  virtualIp: string;
  protocol: 'WireGuard' | 'OpenVPN-DCO' | 'Quantum-Mesh';
  cipher: string;
  latencyMs: number;
  killswitchEnabled: boolean;
  bytesUploaded: number;
  bytesDownloaded: number;
  connectedSince?: string;
}

export interface ProxyState {
  isEnabled: boolean;
  protocol: 'SOCKS5' | 'HTTP_CONNECT' | 'ShadowSocks' | 'Tor-MultiHop';
  host: string;
  port: number;
  authRequired: boolean;
  dnsLeakProtection: boolean;
  activeHops: string[];
  trafficRoutedKb: number;
}

export interface TunnelState {
  isOpen: boolean;
  tunnelId: string;
  tunnelType: 'mTLS Reverse Tunnel' | 'WireGuard Edge Tunnel' | 'SSH Encrypted Tunnel' | 'IPSec ESP';
  remoteEndpoint: string;
  localBind: string;
  handshakeStatus: 'ESTABLISHED' | 'RE-KEYING' | 'INACTIVE';
  uptimeSeconds: number;
  rekeyIntervalSeconds: number;
  encryptedBytes: number;
}

// Domain Blocker types
export type DomainCategory = 'MALWARE' | 'TRACKER' | 'PHISHING' | 'C2_BOTNET' | 'ADWARE' | 'TELEMETRY' | 'CUSTOM';

export interface BlockedDomain {
  id: string;
  domain: string;
  category: DomainCategory;
  blockedAt: string;
  reason?: string;
  hitCount: number;
  enabled: boolean;
}

// Contacted Domains Tracker types
export interface ContactedDomain {
  id: string;
  domain: string;
  contactCount: number;
  firstContact: string;
  lastContact: string;
  status: 'ALLOWED' | 'BLOCKED' | 'SUSPICIOUS';
  resolvedIp: string;
  country: string;
  protocol: 'HTTPS' | 'DNS' | 'WSS' | 'TCP' | 'QUIC';
  port: number;
  threatScore: number; // 0 - 100
  category: string;
  isCustomBlocked?: boolean;
}

// 1-Minute Firewall Auto-Reload types
export interface FirewallReloadLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'FLUSHED_AND_APPLIED';
  rulesCount: number;
  tablesReloaded: string[];
  executionTimeMs: number;
  trigger: 'AUTO_1MIN' | 'MANUAL';
}

export interface FirewallReloadState {
  autoReloadEnabled: boolean;
  intervalSeconds: number; // default 60
  timeUntilNextReload: number;
  lastReloadTime: string;
  totalReloadCount: number;
  tables: string[];
  activeRuleCount: number;
}

// Location Changer (Continuous Relay Hop) types
export interface LocationNode {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  ip: string;
  virtualIp: string;
  latencyMs: number;
  coordinates: string;
  tier: string;
}

export interface LocationHopRecord {
  id: string;
  location: string;
  countryCode: string;
  ip: string;
  timestamp: string;
  durationSeconds: number;
  bytesRouted: number;
}

export interface LocationChangerState {
  isRunning: boolean;
  hopIntervalSeconds: number; // e.g. 15, 30, 60
  timeUntilNextHop: number;
  currentHopIndex: number;
  totalHops: number;
  activeNode: LocationNode;
}

// Cloudflare Integration Blocker types
export interface CloudflareBlockState {
  isBlocked: boolean;
  blockedDomains: string[];
  blockedIpRanges: string[];
  interceptedRequestsCount: number;
  droppedPacketsCount: number;
  stripCloudflareHeaders: boolean;
  lastInterceptAt?: string;
}

// Nearby Devices & Local Subnet Intrusion Shield types
export interface NearbyDeviceProbe {
  id: string;
  ipAddress: string;
  macAddress?: string;
  hostname: string;
  proximity: string; // e.g. "Adjacent / < 3m", "Local Subnet 192.168.1.x", "Same Wi-Fi AP"
  targetedPorts: number[];
  targetedServices: string[];
  attemptCount: number;
  firstSeen: string;
  lastSeen: string;
  status: 'BLOCKED' | 'ALLOWED' | 'ISOLATED';
  threatSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  attackVector: string; // e.g. "ARP Spoof / Rogue Gateway", "Port Scan (SSH, SMB)", "mDNS Snoop"
}

// Foreign States Geo-Blocking Defense types
export interface ForeignStateEntity {
  id: string;
  countryName: string;
  countryCode: string;
  flag: string;
  asnList: string[];
  ipRanges: string[];
  blockedPacketsCount: number;
  lastAttempt: string;
  riskRating: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  status: 'BLOCKED' | 'ALLOWED';
  threatVector: string;
}

export interface ForeignStateGeoShieldState {
  blockAllForeignStates: boolean;
  strictDomesticOnly: boolean;
  foreignPacketsDropped: number;
  activeJurisdictionsBlocked: number;
  customBlockedAsns: string[];
}

// Bluetooth Hardware & Pairing Blocker types
export interface BluetoothProbeRecord {
  id: string;
  deviceName: string;
  macAddress: string;
  deviceType: 'Audio/Headset' | 'Smart Tracker/Beacon' | 'Adjacent Phone/Tablet' | 'Vehicle Infotainment' | 'Unknown RF Device';
  rssi: number;
  pairingMethod: 'PIN Code' | 'Just Works' | 'Numeric Comparison' | 'BLE Passkey' | 'SSP Handshake';
  timestamp: string;
  status: 'PAIRING_REJECTED' | 'RADIO_DROPPED' | 'BLOCKED';
  attempts: number;
}

export interface BluetoothShieldState {
  bluetoothAccessBlocked: boolean;
  pairingRequestsBlocked: boolean;
  radioHardwareKilled: boolean;
  bleAdvertisingSuppressed: boolean;
  rfcommBlocked: boolean;
  totalPairingAttemptsBlocked: number;
}

// Network Sharing Request Blocker types
export interface NetworkShareProbe {
  id: string;
  clientIp: string;
  clientHostname?: string;
  requestedShare: string;
  protocol: 'SMBv2/v3 (Port 445)' | 'NetBIOS (Port 139)' | 'NFS (Port 2049)' | 'AFP (Port 548)' | 'UPnP/SSDP (Port 1900)' | 'Printer Sharing (IPP 631)';
  timestamp: string;
  action: 'REJECTED_TCP_RST' | 'ICMP_PROHIBITED';
  attempts: number;
}

export interface NetworkSharingShieldState {
  blockAllSharing: boolean;
  smbBlocked: boolean;
  nfsBlocked: boolean;
  afpBlocked: boolean;
  upnpDlnaBlocked: boolean;
  mdnsDiscoveryBlocked: boolean;
  printerSharingBlocked: boolean;
  totalSharingRequestsBlocked: number;
}

// Deep Packet Inspection (DPI) & Anti-Sniffing Packet Concealment types
export interface PacketConcealmentState {
  antiPacketInspectionEnabled: boolean;
  antiSniffingEnabled: boolean;
  encryptedClientHelloECH: boolean;
  packetPaddingEnabled: boolean;
  tcpMssClamping: boolean;
  promiscuousModeBlocked: boolean;
  rawSocketCaptureBlocked: boolean;
  timingJitterActive: boolean;
  totalConcealedPackets: number;
  dpiProbesDefeated: number;
  sniffAttemptsDropped: number;
  cryptographicCipher: string;
}

// Zero Analytics Logging Shield types
export interface AnalyticsBlockState {
  blockAnalyticsLogging: boolean;
  blockBeaconApi: boolean;
  blockThirdPartyTrackers: boolean;
  blockSessionReplays: boolean;
  blockTelemetryBeacons: boolean;
  blockCrashReports: boolean;
  stripTrackingParams: boolean;
  totalAnalyticsBlocked: number;
  lastBlockedAt?: string;
  blockedVendorsCount: number;
}

export interface AnalyticsInterceptEvent {
  id: string;
  timestamp: string;
  vendor: string;
  endpoint: string;
  method: 'sendBeacon' | 'POST /collect' | 'fetch/xhr' | 'WebSocket' | 'navigator.sendBeacon';
  payloadType: 'telemetry_beacon' | 'user_interaction' | 'session_heartbeat' | 'crash_stack' | 'device_fingerprint';
  actionTaken: 'SUPPRESSED_NULL_ROUTED' | 'PAYLOAD_PURGED' | 'DROPPED_0_BYTES';
  sizeBytes: number;
}

// Node Access Shield types
export interface NodeAccessShieldState {
  blockAllNodeAccess: boolean;
  blockP2PPeering: boolean;
  blockNodeInspector: boolean; // Node.js debug ports 9229, 9222, 5858
  blockClusterDaemons: boolean; // 2375, 2376, 10250, 8300
  blockCryptoRpcNodes: boolean; // 8545, 8333, 30303
  blockRelayTransit: boolean;
  totalNodeProbesBlocked: number;
  activeBlockedNodesCount: number;
  lastInterceptAt?: string;
}

export interface NodeAccessProbeRecord {
  id: string;
  timestamp: string;
  nodeIp: string;
  nodeHostname?: string;
  nodeType: 'P2P Relay Node' | 'Node.js Inspector / V8 Debugger' | 'Cluster Daemon Node' | 'Blockchain / RPC Node' | 'Tor Directory Node' | 'Mesh Transit Node';
  port: number;
  protocol: 'TCP' | 'UDP' | 'WSS' | 'gRPC';
  actionTaken: 'TCP_RST' | 'HARD_DROP' | 'ACCESS_DENIED_BLACKHOLE';
  threatSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  signature: string;
}

// Android System Patches & Updates Scanner types
export type AndroidEcosystem = 'pixel' | 'samsung' | 'aosp';
export type PatchChannel = 'AOSP_BULLETIN' | 'OEM_FIRMWARE' | 'PLAY_SYSTEM' | 'KERNEL_BASEBAND';
export type PatchSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE';
export type PatchStatus = 'AVAILABLE' | 'DOWNLOADING' | 'VERIFIED' | 'INSTALLED';

export interface AndroidDeviceProfile {
  ecosystem: AndroidEcosystem;
  modelName: string;
  osVersion: string;
  currentSecurityPatchLevel: string;
  detectedBrowserOs: string;
  detectedWebViewVersion: string;
  isLiveAndroidClient: boolean;
}

export interface AndroidSystemPatch {
  id: string;
  title: string;
  ecosystem: AndroidEcosystem;
  channel: PatchChannel;
  severity: PatchSeverity;
  cveIds: string[];
  cvssScore: number;
  patchLevelDate: string;
  versionTag: string;
  sizeMb: number;
  sha256: string;
  status: PatchStatus;
  downloadProgress?: number;
  discoveredAt: string;
  summary: string;
  affectedComponents: string[];
  voiceAlerted?: boolean;
}

export interface PatchScanEvent {
  id: string;
  timestamp: string;
  ecosystem: AndroidEcosystem;
  channelsChecked: number;
  newFindings: number;
  criticalFindings: number;
  message: string;
}

// Incoming Messages & Phone Calls types
export type InboundCommChannel = 'CALL' | 'VOIP' | 'SMS' | 'RCS';
export type CommTrustStatus = 'VERIFIED' | 'SCREENED' | 'SUSPICIOUS' | 'BLOCKED';

export interface InboundCommunicationEvent {
  id: string;
  channel: InboundCommChannel;
  senderName: string;
  phoneNumber: string;
  carrierOrOrigin: string;
  timestamp: string;
  isoTimestamp: string;
  previewText: string;
  durationSec?: number;
  callState?: 'RINGING' | 'MISSED' | 'ANSWERED' | 'REJECTED_BY_SHIELD';
  stirShakenAttestation?: 'A (Verified)' | 'B (Partial)' | 'C (Gateway)' | 'None';
  phishingScore: number; // 0 to 100
  status: CommTrustStatus;
  threatReason?: string;
}

// Hardware Integrity & Peripheral Kill-Switch types
export type HardwarePortType =
  | 'USB_OTG'
  | 'AUDIO_JACK_TRRS'
  | 'USB_C_HID'
  | 'THUNDERBOLT_DMA'
  | 'SD_CARD_BUS';

export type PeripheralRiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'TRUSTED';

export type HardwareKillSwitchAction =
  | 'KILL_SWITCH_TRIPPED'
  | 'DATA_LINES_SEVERED'
  | 'BUS_QUARANTINED'
  | 'AUTHORIZED_PASS';

export interface HardwarePeripheralEvent {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  deviceName: string;
  portType: HardwarePortType;
  vendorProductId: string;
  busPath: string;
  anomalySignature: string;
  riskLevel: PeripheralRiskLevel;
  actionTaken: HardwareKillSwitchAction;
  powerOnlyIsolated: boolean;
}

export interface HardwareIntegrityState {
  killSwitchTripped: boolean;
  lastTripReason: string | null;
  lastTripTimestamp: string | null;
  usbOtgDataLock: boolean;
  audioJackSniffGuard: boolean;
  hidInjectionGuard: boolean;
  thunderboltDmaLock: boolean;
  autoKillSwitchOnThreat: boolean;
  liveBusMonitoringActive: boolean;
  totalKillSwitchTrips: number;
  totalUnauthorizedProbesBlocked: number;
  detectedBrowserDevicesCount: number;
  lastBusProbeSummary: string;
  events: HardwarePeripheralEvent[];
}

// Screen-Masking Overlay & Anti-Capture Privacy Guard types
export type ScreenMaskMode = 'SELECTIVE_BLUR' | 'FULL_CURTAIN';

export type ScreenCaptureTriggerType =
  | 'SCREENSHOT_HOTKEY'
  | 'SCREEN_RECORDING_STREAM'
  | 'PRINT_CAPTURE'
  | 'VISIBILITY_SWITCH'
  | 'WINDOW_FOCUS_LOSS'
  | 'VIRTUAL_CAPTURE_DEVICE'
  | 'MANUAL_PRIVACY_LOCK';

export interface ScreenCaptureEvent {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  triggerType: ScreenCaptureTriggerType;
  detail: string;
  maskApplied: ScreenMaskMode;
  autoCleared: boolean;
}

export interface ScreenMaskState {
  autoMaskEnabled: boolean;
  isMaskEngaged: boolean;
  activeCaptureSession: boolean;
  maskMode: ScreenMaskMode;
  detectScreenshotHotkeys: boolean;
  detectScreenRecording: boolean;
  blurOnVisibilityHidden: boolean;
  strictWindowBlurMask: boolean;
  autoUnmaskSeconds: number;
  remainingUnmaskSeconds: number;
  maskReason: string | null;
  lastTriggerType: ScreenCaptureTriggerType | null;
  lastTriggeredAt: string | null;
  totalScreenshotsBlocked: number;
  totalRecordingSessionsMasked: number;
  browserCaptureHookActive: boolean;
  detectedCaptureDevicesCount: number;
  events: ScreenCaptureEvent[];
}

// SIM Switch Lock & Carrier Port-Out Guard types
export type SimSlotType = 'PHYSICAL_SIM_1' | 'ESIM_PROFILE_2';

export type SimLockEventType =
  | 'PHYSICAL_SIM_SWAP'
  | 'ESIM_PROFILE_PUSH'
  | 'CARRIER_PORT_OUT'
  | 'IMSI_CATCHER_DOWNGRADE'
  | 'SIM_POLICY_VERIFIED';

export interface SimLockEvent {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  eventType: SimLockEventType;
  slot: SimSlotType;
  detectedIccid: string;
  carrierLabel: string;
  actionTaken: 'SWITCH_BLOCKED' | 'ESIM_REJECTED' | 'PORT_OUT_FROZEN' | 'AUTHORIZED_SLOT';
  severity: 'CRITICAL' | 'HIGH' | 'TRUSTED';
  detail: string;
}

export interface SimSwitchLockState {
  simSwitchLocked: boolean;
  esimProvisioningLocked: boolean;
  portOutFreezeEnabled: boolean;
  autoQuarantine2FAOnSwap: boolean;
  lockdownTripped: boolean;
  lockdownReason: string | null;
  boundPrimaryIccid: string;
  boundSecondaryEsimId: string;
  boundCarrier: string;
  activeSlot: SimSlotType;
  guardPin: string;
  totalSwapAttemptsBlocked: number;
  radioProbeSummary: string;
  events: SimLockEvent[];
}

