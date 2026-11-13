
import React, { useState, useEffect } from 'react';
import SecurityDashboard from './components/SecurityDashboard';
import DeviceCommandsMonitor from './components/DeviceCommandsMonitor';
import NetworkRoutingShield from './components/NetworkRoutingShield';
import MobileCenter, { MobileCenterSection } from './components/MobileCenter';
import ChatInterface from './components/ChatInterface';
import SettingsMenu from './components/SettingsMenu';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { ScreenMaskOverlay } from './components/ScreenMaskOverlay';
import { screenMaskService } from './services/screenMaskService';
import { APP_NAME } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'commands' | 'network' | 'mobile' | 'chat' | 'settings'>('dashboard');
  const [mobileSection, setMobileSection] = useState<MobileCenterSection>('patches');
  const [networkSubSection, setNetworkSubSection] = useState<
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
    | undefined
  >(undefined);
  const [stealthMode, setStealthMode] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isScreenMasked, setIsScreenMasked] = useState<boolean>(
    () => screenMaskService.getSnapshot().isMaskEngaged
  );

  useEffect(() => {
    const unsub = screenMaskService.subscribe(s => setIsScreenMasked(s.isMaskEngaged));
    return () => unsub();
  }, []);

  const handleNavigateToNetwork = (
    section?:
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
  ) => {
    setNetworkSubSection(section || 'contacted_domains');
    setActiveTab('network');
  };

  const handleNavigateToMobile = (section?: MobileCenterSection) => {
    setMobileSection(section || 'patches');
    setActiveTab('mobile');
  };

  useEffect(() => {
    if (theme === 'light') {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.body.style.backgroundColor = '#020617';
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen transition-all duration-500 ${stealthMode ? 'grayscale contrast-125' : ''} ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-50'}`}>
      {/* Desktop Sidebar / Navigation */}
      <nav className={`hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-8 border-r z-50 transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
        <div className="mb-10 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-cyan">
            S
          </div>
        </div>
        
        <div className="flex flex-col gap-6 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
            className={`p-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>

          <button 
            onClick={() => setActiveTab('commands')}
            title="Device Inbound & Available Commands"
            className={`p-3 rounded-lg transition-colors relative ${activeTab === 'commands' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button 
            onClick={() => setActiveTab('network')}
            title="VPN, Proxy, Tunnel & Domain Shield"
            className={`p-3 rounded-lg transition-colors relative ${activeTab === 'network' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </button>

          <button 
            onClick={() => setActiveTab('mobile')}
            title="Mobile Center: System Patches, Calls/Messages & APK"
            className={`p-3 rounded-lg transition-colors relative ${activeTab === 'mobile' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button 
            onClick={() => setActiveTab('chat')}
            title="AI Assistant"
            className={`p-3 rounded-lg transition-colors ${activeTab === 'chat' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            title="Settings"
            className={`p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() =>
              isScreenMasked
                ? screenMaskService.disengageMask()
                : screenMaskService.engageManualMask()
            }
            title={isScreenMasked ? 'Disengage Screen Mask' : 'Engage Screen-Masking Overlay'}
            className={`p-3 rounded-lg transition-colors ${
              isScreenMasked
                ? 'text-rose-400 bg-rose-500/15'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>

          <button 
            onClick={() => setStealthMode(!stealthMode)}
            title="Toggle Stealth Mode"
            className={`p-3 rounded-lg transition-colors ${stealthMode ? 'text-purple-400 bg-purple-400/10' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-0 md:pl-20 pb-20 md:pb-0 min-h-screen">
        <header className={`px-4 sm:px-8 py-3.5 md:py-5 border-b flex justify-between items-center gap-4 glass sticky top-0 z-40 transition-colors duration-300 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold tracking-widest mono text-cyan-500 truncate">
              {stealthMode ? 'REDACTED' : APP_NAME}
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 uppercase tracking-tighter">
              Security Operations Center · Active Node 01
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton
              theme={theme}
              onOpenMobileCenter={() => handleNavigateToMobile('apk')}
            />
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {activeTab === 'dashboard' && (
            <SecurityDashboard
              stealthMode={stealthMode}
              theme={theme}
              onNavigateToCommands={() => setActiveTab('commands')}
              onNavigateToMobile={handleNavigateToMobile}
              onNavigateToNetwork={handleNavigateToNetwork}
            />
          )}
          {activeTab === 'commands' && (
            <DeviceCommandsMonitor
              stealthMode={stealthMode}
              theme={theme}
              onNavigateBack={() => setActiveTab('dashboard')}
            />
          )}
          {activeTab === 'network' && (
            <NetworkRoutingShield
              stealthMode={stealthMode}
              theme={theme}
              defaultSection={networkSubSection}
              onNavigateBack={() => setActiveTab('dashboard')}
            />
          )}
          {activeTab === 'mobile' && (
            <MobileCenter
              theme={theme}
              stealthMode={stealthMode}
              defaultSection={mobileSection}
            />
          )}
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'settings' && (
            <SettingsMenu
              theme={theme}
              setTheme={setTheme}
              onOpenMobileCenter={handleNavigateToMobile}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Thumb Zone, Compact <= 56px) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-14 z-40 border-t backdrop-blur-md grid grid-cols-5 items-center ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-950/95 border-slate-800'}`}>
        {(
          [
            { id: 'dashboard', label: 'Overview' },
            { id: 'commands', label: 'Commands' },
            { id: 'network', label: 'Shield' },
            { id: 'mobile', label: 'Mobile' },
            { id: 'settings', label: 'Settings' },
          ] as const
        ).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`h-full flex flex-col items-center justify-center text-[11px] font-semibold transition-colors ${
              activeTab === item.id ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <OfflineIndicator />
      <ScreenMaskOverlay theme={theme} />
    </div>
  );
};

export default App;
