import React from 'react';

interface PWAInstallButtonProps {
  theme?: 'dark' | 'light';
  onOpenMobileCenter?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ theme = 'dark', onOpenMobileCenter }) => (
  <button
    type="button"
    onClick={onOpenMobileCenter}
    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${theme === 'light' ? 'border-slate-300 text-slate-700' : 'border-slate-700 text-slate-200'}`}
  >
    Install app
  </button>
);

export const OfflineIndicator: React.FC = () => (
  <div className="fixed bottom-20 right-4 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
    Offline ready
  </div>
);

export default PWAInstallButton;
