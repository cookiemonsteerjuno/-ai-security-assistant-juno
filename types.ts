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
  timestamp: string;
  actionTag?: string;
}

export type MobileCenterSection = 'patches' | 'comms' | 'sim_lock' | 'hardware' | 'screen_mask' | 'apk';

export type NetworkSubSection =
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
  | 'vpn_proxy_tunnel';

export type AndroidEcosystem = 'samsung' | 'pixel' | 'aosp';
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
  isHighSecurityHardening?: boolean;
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

export interface NodeAccessProbeRecord {
  id: string;
  timestamp: string;
  nodeIp: string;
  nodeHostname?: string;
  nodeType: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'WSS' | 'gRPC';
  actionTaken: 'TCP_RST' | 'HARD_DROP' | 'ACCESS_DENIED_BLACKHOLE';
  threatSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  signature: string;
}

export type HardwarePortType = 'USB_OTG' | 'AUDIO_JACK_TRRS' | 'USB_C_HID' | 'THUNDERBOLT_DMA' | 'SD_CARD_BUS';
export type PeripheralRiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'TRUSTED';
export type HardwareKillSwitchAction = 'KILL_SWITCH_TRIPPED' | 'DATA_LINES_SEVERED' | 'BUS_QUARANTINED' | 'AUTHORIZED_PASS';

export interface HardwarePeripheralEvent {
  id: string;
  timestamp: string;
  deviceName: string;
  portType: HardwarePortType;
  vendorProductId: string;
  busPath: string;
  anomalySignature: string;
  riskLevel: PeripheralRiskLevel;
  actionTaken: HardwareKillSwitchAction;
  powerOnlyIsolated: boolean;
}

export type InboundCommChannel = 'CALL' | 'VOIP' | 'SMS' | 'RCS';
export type CommTrustStatus = 'VERIFIED' | 'SCREENED' | 'SUSPICIOUS' | 'BLOCKED';

export interface InboundCommunicationEvent {
  id: string;
  channel: InboundCommChannel;
  senderName: string;
  phoneNumber: string;
  carrierOrOrigin: string;
  timestamp: string;
  previewText: string;
  callState?: 'RINGING' | 'MISSED' | 'ANSWERED' | 'REJECTED_BY_SHIELD';
  stirShakenAttestation?: 'A (Verified)' | 'B (Partial)' | 'C (Gateway)' | 'None';
  phishingScore: number;
  status: CommTrustStatus;
  threatReason?: string;
}

export type ScreenMaskMode = 'SELECTIVE_BLUR' | 'FULL_CURTAIN';

export interface ScreenCaptureEvent {
  id: string;
  timestamp: string;
  triggerType: string;
  detail: string;
  maskApplied: ScreenMaskMode;
}

export type SimSlotType = 'PHYSICAL_SIM_1' | 'ESIM_PROFILE_2';

export interface SimLockEvent {
  id: string;
  timestamp: string;
  eventType: string;
  slot: SimSlotType;
  detectedIccid: string;
  carrierLabel: string;
  actionTaken: string;
  severity: 'CRITICAL' | 'HIGH' | 'TRUSTED';
  detail: string;
}
