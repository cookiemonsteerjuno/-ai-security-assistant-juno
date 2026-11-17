import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  EyeOff,
  HardDrive,
  Key,
  PhoneIncoming,
  Plus,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AndroidDeviceProfile,
  AndroidEcosystem,
  AndroidSystemPatch,
  HardwarePeripheralEvent,
  InboundCommunicationEvent,
  MobileCenterSection,
  PatchChannel,
  ScreenMaskMode,
  SimLockEvent,
  SimSlotType,
} from '../types';

interface MobileCenterProps {
  mobileSection: MobileCenterSection;
  setMobileSection: (s: MobileCenterSection) => void;
  deviceProfile: AndroidDeviceProfile;
  nextScanCountdown: number;
  switchEcosystem: (eco: AndroidEcosystem) => void;
  applyAllHighSecurityPatches: () => void;
  pendingEcoPatchesCount: number;
  ecoPatches: AndroidSystemPatch[];
  highSecEcoCount: number;
  patchFilter: 'ALL' | 'HIGH_SECURITY' | 'CRITICAL' | 'HIGH' | 'INSTALLED';
  setPatchFilter: (f: 'ALL' | 'HIGH_SECURITY' | 'CRITICAL' | 'HIGH' | 'INSTALLED') => void;
  filteredPatches: AndroidSystemPatch[];
  stageAndApplySinglePatch: (id: string) => void;
  voiceAlertsEnabled: boolean;
  setVoiceAlertsEnabled: (v: boolean) => void;
  onAddCustomPatch: (title: string, cve: string, channel: PatchChannel) => void;
  commsEvents: InboundCommunicationEvent[];
  setCommsEvents: React.Dispatch<React.SetStateAction<InboundCommunicationEvent[]>>;
  simLocked: boolean;
  esimLocked: boolean;
  setEsimLocked: (v: boolean) => void;
  portOutFrozen: boolean;
  setPortOutFrozen: (v: boolean) => void;
  activeSimSlot: SimSlotType;
  simEvents: SimLockEvent[];
  setSimEvents: React.Dispatch<React.SetStateAction<SimLockEvent[]>>;
  hwKillSwitchTripped: boolean;
  setHwKillSwitchTripped: (v: boolean) => void;
  hwEvents: HardwarePeripheralEvent[];
  isScreenMasked: boolean;
  setIsScreenMasked: (v: boolean) => void;
  screenMaskMode: ScreenMaskMode;
  setScreenMaskMode: (m: ScreenMaskMode) => void;
  pkgAppName: string;
  setPkgAppName: (v: string) => void;
  pkgShortName: string;
  setPkgShortName: (v: string) => void;
  pkgId: string;
  setPkgId: (v: string) => void;
  pkgVersion: string;
  setPkgVersion: (v: string) => void;
  pkgGenerating: boolean;
  handleBuildMobilePackage: (fmt: 'apk_package' | 'twa_bundle' | 'capacitor_bundle' | 'icon_pack') => void;
  generatedPackages: Array<{ id: string; filename: string; format: string; sizeKb: string; sha256: string; timestamp: string; blob: Blob }>;
  triggerToast: (title: string, detail: string, type?: 'info' | 'success' | 'critical') => void;
}

export const MobileCenter: React.FC<MobileCenterProps> = props => {
  const {
    mobileSection,
    setMobileSection,
    deviceProfile,
    nextScanCountdown,
    switchEcosystem,
    applyAllHighSecurityPatches,
    pendingEcoPatchesCount,
    ecoPatches,
    highSecEcoCount,
    patchFilter,
    setPatchFilter,
    filteredPatches,
    stageAndApplySinglePatch,
    voiceAlertsEnabled,
    setVoiceAlertsEnabled,
    onAddCustomPatch,
    commsEvents,
    setCommsEvents,
    simLocked,
    esimLocked,
    setEsimLocked,
    portOutFrozen,
    setPortOutFrozen,
    activeSimSlot,
    simEvents,
    setSimEvents,
    hwKillSwitchTripped,
    setHwKillSwitchTripped,
    hwEvents,
    isScreenMasked,
    setIsScreenMasked,
    screenMaskMode,
    setScreenMaskMode,
    pkgAppName,
    setPkgAppName,
    pkgShortName,
    setPkgShortName,
    pkgId,
    setPkgId,
    pkgVersion,
    setPkgVersion,
    pkgGenerating,
    handleBuildMobilePackage,
    generatedPackages,
    triggerToast,
  } = props;

  const [customPatchTitle, setCustomPatchTitle] = useState('');
  const [customPatchCve, setCustomPatchCve] = useState('');
  const [customPatchChannel, setCustomPatchChannel] = useState<PatchChannel>('KERNEL_BASEBAND');

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-2xl glass flex flex-wrap gap-2">
        {(
          [
            { id: 'patches', label: 'System & High-Security Patches', icon: ShieldCheck },
            { id: 'comms', label: 'Calls & SMS/RCS Shield', icon: PhoneIncoming },
            { id: 'sim_lock', label: 'SIM & eSIM Switch Lock', icon: Key },
            { id: 'hardware', label: 'USB OTG / TRRS Kill-Switch', icon: HardDrive },
            { id: 'screen_mask', label: 'Anti-Capture Screen Mask', icon: EyeOff },
            { id: 'apk', label: 'Android APK & TWA Packager', icon: Download },
          ] as const
        ).map(sec => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setMobileSection(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                mobileSection === sec.id
                  ? 'bg-cyan-600 text-white shadow-cyan'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {mobileSection === 'patches' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl glass space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-cyan-400 mono">
                    ANDROID HIGH-SECURITY PATCHES & BULLETIN SCANNER
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold mono">
                    Next Poll: {nextScanCountdown}s
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active Profile: <span className="text-white font-semibold">{deviceProfile.modelName}</span> (
                  {deviceProfile.osVersion}) · Current SPL:{' '}
                  <span className="text-emerald-400 font-bold mono">{deviceProfile.currentSecurityPatchLevel}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['samsung', 'pixel', 'aosp'] as const).map(eco => (
                  <button
                    key={eco}
                    type="button"
                    onClick={() => switchEcosystem(eco)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase mono ${
                      deviceProfile.ecosystem === eco
                        ? 'bg-cyan-600 text-white shadow-cyan'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {eco === 'samsung' ? 'Samsung (Knox)' : eco === 'pixel' ? 'Google Pixel' : 'AOSP / Graphene'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={applyAllHighSecurityPatches}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Install All High-Security Patches ({pendingEcoPatchesCount})</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'ALL', label: `All Ecosystem Patches (${ecoPatches.length})` },
                    { id: 'HIGH_SECURITY', label: `High-Security Hardening (${highSecEcoCount})` },
                    { id: 'CRITICAL', label: 'Critical (CVSS ≥ 9.0)' },
                    { id: 'HIGH', label: 'High Severity' },
                    { id: 'INSTALLED', label: 'Installed' },
                  ] as const
                ).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPatchFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold mono ${
                      patchFilter === f.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setVoiceAlertsEnabled(!voiceAlertsEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold mono ${
                  voiceAlertsEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Voice Alerts: {voiceAlertsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (!customPatchTitle.trim()) return;
              onAddCustomPatch(customPatchTitle.trim(), customPatchCve.trim(), customPatchChannel);
              setCustomPatchTitle('');
              setCustomPatchCve('');
            }}
            className="p-4 rounded-2xl glass grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <input
              type="text"
              value={customPatchTitle}
              onChange={e => setCustomPatchTitle(e.target.value)}
              placeholder="Inject custom high-security patch (e.g., Magisk Zygisk DenyList Guard)..."
              className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={customPatchCve}
                onChange={e => setCustomPatchCve(e.target.value)}
                placeholder="CVE / SVE ID (optional)"
                className="w-1/2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mono"
              />
              <select
                value={customPatchChannel}
                onChange={e => setCustomPatchChannel(e.target.value as PatchChannel)}
                className="w-1/2 px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mono"
              >
                <option value="KERNEL_BASEBAND">KERNEL_BASEBAND</option>
                <option value="OEM_FIRMWARE">OEM_FIRMWARE</option>
                <option value="AOSP_BULLETIN">AOSP_BULLETIN</option>
                <option value="PLAY_SYSTEM">PLAY_SYSTEM</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add & Enforce High-Sec Patch</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatches.map(patch => (
              <div
                key={patch.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                  patch.isHighSecurityHardening
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-cyan'
                    : 'glass border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {patch.isHighSecurityHardening && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold mono uppercase">
                          ★ HIGH-SECURITY HARDENING
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold mono ${
                          patch.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {patch.severity} · CVSS {patch.cvssScore}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] mono">
                        {patch.channel}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold mono ${
                        patch.status === 'INSTALLED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {patch.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{patch.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{patch.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {patch.cveIds.map(cve => (
                      <span key={cve} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-cyan-400 mono">
                        {cve}
                      </span>
                    ))}
                    {patch.affectedComponents.map(comp => (
                      <span key={comp} className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] mono">
                  <div className="text-slate-400 truncate max-w-xs" data-sensitive-data="true">
                    Tag: {patch.versionTag} · {patch.sizeMb} MB · SHA256: {patch.sha256.slice(0, 12)}...
                  </div>
                  {patch.status !== 'INSTALLED' ? (
                    <button
                      type="button"
                      onClick={() => stageAndApplySinglePatch(patch.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      {patch.status === 'DOWNLOADING' ? `Verifying (${patch.downloadProgress}%)...` : 'Verify & Apply Patch'}
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enforced in Kernel
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mobileSection === 'comms' && (
        <div className="p-5 rounded-2xl glass space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-cyan-400 mono">
                INBOUND CALLS (STIR/SHAKEN) & SMS/RCS SMISHING FIREWALL
              </h3>
              <p className="text-xs text-slate-400">
                Automatically drops unattested SIP robocalls and quarantines SMS/RCS phishing links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const ev: InboundCommunicationEvent = {
                  id: `comm-${Date.now()}`,
                  channel: 'SMS',
                  senderName: 'Spoofed Carrier Gateway',
                  phoneNumber: '+1 (888) 555-0199',
                  carrierOrOrigin: 'Unverified International SMS Relay',
                  timestamp: new Date().toLocaleTimeString(),
                  previewText: 'ALERT: Your SIM PIN was reset. Click http://verify-sim-auth.invalid to cancel.',
                  phishingScore: 98,
                  status: 'BLOCKED',
                  threatReason: 'High-risk smishing URL intercepted and quarantined.',
                };
                setCommsEvents(prev => [ev, ...prev]);
                triggerToast('Smishing SMS Quarantined', 'Blocked phishing payload from +1 (888) 555-0199.', 'critical');
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
            >
              Simulate Phishing SMS Attack
            </button>
          </div>
          <div className="space-y-2.5">
            {commsEvents.map(c => (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold mono text-[10px]">
                      {c.channel}
                    </span>
                    <span className="font-bold text-white">{c.senderName}</span>
                    <span className="text-slate-400 mono" data-sensitive-data="true">
                      ({c.phoneNumber})
                    </span>
                  </div>
                  <div className="text-slate-300">{c.previewText}</div>
                  {c.threatReason && <div className="text-[11px] text-rose-400 mono">Reason: {c.threatReason}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded font-bold mono text-[10px] ${
                      c.status === 'BLOCKED' || c.status === 'SUSPICIOUS'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {c.status} (Risk {c.phishingScore}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mobileSection === 'sim_lock' && (
        <div className="p-5 rounded-2xl glass space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-cyan-400 mono">
                SIM SWITCH LOCK, eSIM PROVISIONING GUARD & CARRIER PORT-OUT FREEZE
              </h3>
              <p className="text-xs text-slate-400">
                Bound Primary ICCID:{' '}
                <span className="mono text-slate-200" data-sensitive-data="true">
                  8901-2604-8120-9941-007A
                </span>{' '}
                · Default Guard PIN: <span className="mono text-cyan-400">4829</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const ev: SimLockEvent = {
                  id: `sim-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  eventType: 'IMSI_CATCHER_DOWNGRADE',
                  slot: activeSimSlot,
                  detectedIccid: '8901-2604-8120-9941-007A',
                  carrierLabel: 'Rogue 2G/GSM Base Station',
                  actionTaken: 'SWITCH_BLOCKED',
                  severity: 'CRITICAL',
                  detail: 'Blocked forced 5G -> 2G cipher downgrade & IMSI catcher interrogation.',
                };
                setSimEvents(prev => [ev, ...prev]);
                triggerToast('IMSI Catcher Blocked', 'Prevented forced 2G downgrade on primary SIM.', 'critical');
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              Simulate Rogue eSIM / Stingray Probe
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold">Hardware SIM Tray Lock</span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold mono">
                {simLocked ? 'LOCKED' : 'UNLOCKED'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold">Remote eSIM Push Lock</span>
              <button
                type="button"
                onClick={() => setEsimLocked(!esimLocked)}
                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold mono"
              >
                {esimLocked ? 'LOCKED' : 'OPEN'}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold">Carrier Port-Out Freeze</span>
              <button
                type="button"
                onClick={() => setPortOutFrozen(!portOutFrozen)}
                className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold mono"
              >
                {portOutFrozen ? 'FROZEN' : 'OPEN'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {simEvents.map(ev => (
              <div key={ev.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white">
                    {ev.eventType} · {ev.carrierLabel}
                  </div>
                  <div className="text-slate-400">{ev.detail}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold mono text-[10px]">
                  {ev.actionTaken}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mobileSection === 'hardware' && (
        <div className="p-5 rounded-2xl glass space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-cyan-400 mono">
                HARDWARE INTEGRITY & USB OTG / 3.5MM TRRS / BADUSB KILL-SWITCH
              </h3>
              <p className="text-xs text-slate-400">
                Severs USB D+/D- data pins and blocks BadUSB HID keystroke injection while keeping power delivery isolated.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHwKillSwitchTripped(!hwKillSwitchTripped);
                triggerToast(
                  !hwKillSwitchTripped ? 'Hardware Kill-Switch Tripped' : 'Hardware Bus Reset',
                  !hwKillSwitchTripped
                    ? 'All external USB OTG, HID, and TRRS data buses electrically isolated.'
                    : 'Peripheral bus guards re-armed.',
                  !hwKillSwitchTripped ? 'critical' : 'info'
                );
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold mono ${
                hwKillSwitchTripped ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {hwKillSwitchTripped ? 'Reset Hardware Kill-Switch' : 'Trip Emergency Hardware Kill-Switch'}
            </button>
          </div>
          <div className="space-y-2">
            {hwEvents.map(ev => (
              <div key={ev.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-white">
                    {ev.deviceName} ({ev.portType})
                  </div>
                  <div className="text-slate-400">{ev.anomalySignature}</div>
                  <div className="text-[11px] text-cyan-400 mono">
                    {ev.busPath} · {ev.vendorProductId}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold mono text-[10px]">
                  {ev.actionTaken}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mobileSection === 'screen_mask' && (
        <div className="p-5 rounded-2xl glass space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-cyan-400 mono">
                SCREEN-MASKING OVERLAY & ANTI-CAPTURE PRIVACY GUARD
              </h3>
              <p className="text-xs text-slate-400">
                Automatically blurs sensitive IPs, ICCIDs, and logs when screenshots or display recording streams are detected.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsScreenMasked(!isScreenMasked)}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
              >
                {isScreenMasked ? 'Disengage Screen Mask' : 'Engage Screen Mask Now'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setScreenMaskMode(screenMaskMode === 'SELECTIVE_BLUR' ? 'FULL_CURTAIN' : 'SELECTIVE_BLUR')
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold mono"
              >
                Mode: {screenMaskMode}
              </button>
            </div>
          </div>
        </div>
      )}

      {mobileSection === 'apk' && (
        <div className="p-5 rounded-2xl glass space-y-4">
          <div>
            <h3 className="text-base font-bold text-cyan-400 mono">
              ANDROID APK WRAPPER, BUBBLEWRAP TWA & CAPACITOR BUILD GENERATOR
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generates a downloadable Android package pre-configured with your High-Security Patch Manifest (SPL{' '}
              {deviceProfile.currentSecurityPatchLevel}).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mono">App Name</label>
              <input
                type="text"
                value={pkgAppName}
                onChange={e => setPkgAppName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mono">Launcher Short Name</label>
              <input
                type="text"
                value={pkgShortName}
                onChange={e => setPkgShortName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mono">Android Package ID</label>
              <input
                type="text"
                value={pkgId}
                onChange={e => setPkgId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mono">Version Tag</label>
              <input
                type="text"
                value={pkgVersion}
                onChange={e => setPkgVersion(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mono"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pkgGenerating}
              onClick={() => handleBuildMobilePackage('apk_package')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-cyan"
            >
              <Download className="w-4 h-4" />
              <span>Build & Download Android Wrapper (.APK)</span>
            </button>
            <button
              type="button"
              disabled={pkgGenerating}
              onClick={() => handleBuildMobilePackage('twa_bundle')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs"
            >
              Download Bubblewrap TWA Project (.ZIP)
            </button>
            <button
              type="button"
              disabled={pkgGenerating}
              onClick={() => handleBuildMobilePackage('capacitor_bundle')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs"
            >
              Download Capacitor Android Bundle (.ZIP)
            </button>
          </div>
          {generatedPackages.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="text-xs font-bold uppercase mono text-slate-400">Generated Artifacts</div>
              {generatedPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-cyan-400 mono">{pkg.filename}</div>
                    <div className="text-[11px] text-slate-400 mono">
                      {pkg.sizeKb} · Generated {pkg.timestamp} · SHA-256: {pkg.sha256.slice(0, 20)}...
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = URL.createObjectURL(pkg.blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = pkg.filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(url), 1500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                  >
                    Download Again
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileCenter;
