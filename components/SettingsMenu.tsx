
import React, { useEffect, useState } from 'react';
import { screenMaskService } from '../services/screenMaskService';
import { ScreenMaskState } from '../types';

interface SettingsMenuProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenMobileCenter?: (section?: 'patches' | 'comms' | 'sim_lock' | 'apk') => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ theme, setTheme, onOpenMobileCenter }) => {
  const [notifications, setNotifications] = useState({
    threatAlerts: true,
    systemStatus: true,
    chatSpeech: true,
  });

  const [dataSharing, setDataSharing] = useState({
    heuristics: true,
    anonymousTelemetry: false,
  });

  const [maskState, setMaskState] = useState<ScreenMaskState>(() =>
    screenMaskService.getSnapshot()
  );

  useEffect(() => {
    const unsub = screenMaskService.subscribe(setMaskState);
    return () => unsub();
  }, []);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDataSharing = (key: keyof typeof dataSharing) => {
    setDataSharing(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const Toggle = ({ enabled, onToggle, label, description }: { enabled: boolean; onToggle: () => void; label: string; description?: string }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium transition-colors">{label}</span>
        {description && <span className="text-xs text-slate-500">{description}</span>}
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          enabled ? 'bg-cyan-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Preferences</h2>
          <p className="text-slate-500 text-sm">Configure your Sentinel environment and interaction parameters.</p>
        </div>
      </div>

      <div className={`glass rounded-2xl border p-8 space-y-6 transition-colors duration-300 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
        {/* Appearance Section */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-4">Appearance</h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Interface Theme</span>
              <span className="text-xs text-slate-500">Switch between dark obsidian and light terminal modes.</span>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${theme === 'dark' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:text-slate-200'}`}
              >
                DARK
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${theme === 'light' ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
              >
                LIGHT
              </button>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-4">Security Notifications</h3>
          <div className="divide-y divide-slate-500/10">
            <Toggle 
              enabled={notifications.threatAlerts} 
              onToggle={() => toggleNotification('threatAlerts')} 
              label="Real-time Threat Alerts" 
              description="Critical notifications for intercepted packet signatures and brute-force attempts."
            />
            <Toggle 
              enabled={notifications.systemStatus} 
              onToggle={() => toggleNotification('systemStatus')} 
              label="Module Status Updates" 
              description="Periodic heartbeat reports for firewall and encryption modules."
            />
            <Toggle 
              enabled={notifications.chatSpeech} 
              onToggle={() => toggleNotification('chatSpeech')} 
              label="Assistant Voice Feedback" 
              description="Automatically play synthesized speech for AI assistant responses."
            />
          </div>
        </section>

        {/* Data Sharing Section */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-4">Privacy & Intelligence</h3>
          <div className="divide-y divide-slate-500/10">
            <Toggle 
              enabled={dataSharing.heuristics} 
              onToggle={() => toggleDataSharing('heuristics')} 
              label="Heuristic Intelligence Sharing" 
              description="Help improve neural detection by sharing non-identifying threat signatures."
            />
            <Toggle 
              enabled={dataSharing.anonymousTelemetry} 
              onToggle={() => toggleDataSharing('anonymousTelemetry')} 
              label="Anonymous Performance Telemetry" 
              description="Send latency and usage metrics to the Sentinel global network."
            />
            <Toggle
              enabled={maskState.autoMaskEnabled}
              onToggle={() => screenMaskService.toggleSetting('autoMaskEnabled')}
              label="Screen-Masking Overlay on Capture"
              description="Automatically blur sensitive IPs, logs, and call/SMS records on screenshot or recording attempts."
            />
          </div>
        </section>

        {/* Mobile Deployment & Android Patching */}
        {onOpenMobileCenter && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-4">Mobile & Android Deployment</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
              <div className="flex flex-col">
                <span className="text-sm font-medium">APK Export, Offline PWA & Phone Patch Scanner</span>
                <span className="text-xs text-slate-500">Install Sentinel on Android, download APK wrapper bundles, or manage phone security patches.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenMobileCenter('patches')}
                  className="px-3.5 py-2 rounded-lg border border-slate-500/30 hover:bg-slate-500/10 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Patch Scanner
                </button>
                <button
                  type="button"
                  onClick={() => onOpenMobileCenter('sim_lock')}
                  className="px-3.5 py-2 rounded-lg border border-slate-500/30 hover:bg-slate-500/10 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  SIM Switch Lock
                </button>
                <button
                  type="button"
                  onClick={() => onOpenMobileCenter('apk')}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                >
                  APK & Install
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Danger Zone */}
        <section className="pt-6 border-t border-red-500/10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-4">Maintenance</h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-red-400">Flush Security Logs</span>
              <span className="text-xs text-slate-500">Permanently delete all locally stored interception logs and audit trails.</span>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors">
              PURGE DATA
            </button>
          </div>
        </section>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">Sentinel Protocol v4.2.1 • Encryption: AES-GCM-256</p>
      </div>
    </div>
  );
};

export default SettingsMenu;
