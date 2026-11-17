import React from 'react';

interface SettingsMenuProps {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  stealthMode: boolean;
  setStealthMode: (v: boolean) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  theme,
  setTheme,
  stealthMode,
  setStealthMode,
}) => {
  return (
    <div className="p-5 rounded-2xl glass space-y-5">
      <h2 className="text-base font-bold text-cyan-400 mono">
        SENTINEL-X SYSTEM & APPEARANCE SETTINGS
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-white">Console Theme</div>
            <div className="text-[11px] text-slate-400">
              Switch between Cyber Slate Dark & High-Contrast Light
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold uppercase mono"
          >
            {theme} Mode
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-white">Stealth Redaction Mode</div>
            <div className="text-[11px] text-slate-400">Monochrome high-contrast header redaction</div>
          </div>
          <button
            type="button"
            onClick={() => setStealthMode(!stealthMode)}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold uppercase mono"
          >
            {stealthMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
