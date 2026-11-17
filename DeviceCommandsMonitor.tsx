import React, { useState } from 'react';
import { Play, Volume2 } from 'lucide-react';
import { DeviceCommand } from '../types';
import { audioEngine } from '../services/audioEngine';

interface DeviceCommandsMonitorProps {
  deviceCommands: DeviceCommand[];
  onDispatchCommand: (cmdText: string, summary: string, category?: DeviceCommand['category']) => void;
}

export const DeviceCommandsMonitor: React.FC<DeviceCommandsMonitorProps> = ({
  deviceCommands,
  onDispatchCommand,
}) => {
  const [customCommandInput, setCustomCommandInput] = useState('');

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl glass flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-cyan-400 mono">
            DEVICE INBOUND & HIGH-SECURITY COMMAND DISPATCHER
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute kernel, baseband, SELinux, and firewall enforcement commands with real-time voice telemetry.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            audioEngine.speak('Sentinel Voice Announcer online. High security command bus nominal.', false)
          }
          className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          <span>Test Voice Announcer Beacon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            cmd: 'sentinel_knox --enforce-rkp --lock-selinux-enforcing',
            summary: 'Lock Knox RKP & SELinux Enforcing Mode',
            cat: 'PATCH' as const,
          },
          {
            cmd: 'baseband_guard --block-2g-gsm --drop-silent-sms',
            summary: 'Enforce 5G SA Baseband Zero-Click & Stingray Lock',
            cat: 'NETWORK' as const,
          },
          {
            cmd: 'usb_lockdown --sever-dplus-dminus --block-badusb-hid',
            summary: 'Isolate USB-C Data Lines & Block BadUSB HID',
            cat: 'ACCESS_CONTROL' as const,
          },
          {
            cmd: 'conscrypt_ctl --enable-ml-kem-768 --strict-ct-pinning',
            summary: 'Activate Post-Quantum ML-KEM-768 TLS 1.3',
            cat: 'ENCRYPTION' as const,
          },
        ].map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onDispatchCommand(preset.cmd, preset.summary, preset.cat)}
            className="p-3.5 rounded-xl glass hover:border-cyan-500/50 text-left flex flex-col justify-between gap-2 transition-all"
          >
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 mono">
                {preset.cat}
              </span>
              <div className="text-xs font-bold text-slate-100 mt-2">{preset.summary}</div>
              <div className="text-[11px] text-slate-400 mono mt-1 truncate">{preset.cmd}</div>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mono flex items-center gap-1">
              <Play className="w-3 h-3" /> Dispatch Command
            </div>
          </button>
        ))}
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          if (!customCommandInput.trim()) return;
          onDispatchCommand(
            customCommandInput.trim(),
            `Custom Operator Command: ${customCommandInput.trim()}`,
            'SYSTEM'
          );
          setCustomCommandInput('');
        }}
        className="p-4 rounded-2xl glass flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={customCommandInput}
          onChange={e => setCustomCommandInput(e.target.value)}
          placeholder="Enter custom shell / security policy command (e.g., nft flush ruleset --strict)..."
          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 mono focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs mono shrink-0"
        >
          Execute & Announce
        </button>
      </form>

      <div className="p-5 rounded-2xl glass space-y-3">
        <h3 className="text-sm font-bold uppercase mono text-slate-300">
          Dispatched Command Audit Ledger ({deviceCommands.length})
        </h3>
        <div className="space-y-2.5">
          {deviceCommands.map(c => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 mono">
                    {c.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 mono">
                    {c.category}
                  </span>
                  <span className="text-xs font-bold text-white">{c.actionSummary}</span>
                </div>
                <div className="text-xs text-cyan-400 mono" data-sensitive-data="true">
                  $ {c.commandText}
                </div>
                <div className="text-[11px] text-slate-400 mono">
                  {c.timestamp} · Target: {c.targetDevice} · Auth: {c.authorizedBy}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold mono">
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceCommandsMonitor;
