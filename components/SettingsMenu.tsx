import React from 'react';

interface SettingsMenuProps {
  theme?: 'dark' | 'light';
  setTheme?: (value: 'dark' | 'light') => void;
  onOpenMobileCenter?: (section?: string) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ theme = 'dark', setTheme, onOpenMobileCenter }) => {
  const isLight = theme === 'light';
  return (
    <section className={`rounded-2xl border p-6 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => setTheme?.('dark')} className="rounded-xl border border-slate-600 px-4 py-2 text-sm">Dark theme</button>
        <button type="button" onClick={() => setTheme?.('light')} className="rounded-xl border border-slate-600 px-4 py-2 text-sm">Light theme</button>
        <button type="button" onClick={() => onOpenMobileCenter?.('apk')} className="rounded-xl border border-cyan-500/60 px-4 py-2 text-sm text-cyan-400">Open Mobile Center</button>
      </div>
    </section>
  );
};

export default SettingsMenu;
