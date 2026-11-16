import React from 'react';

interface NetworkRoutingShieldProps {
  stealthMode?: boolean;
  theme?: 'dark' | 'light';
  defaultSection?: string;
  onNavigateBack?: () => void;
}

export const NetworkRoutingShield: React.FC<NetworkRoutingShieldProps> = ({
  stealthMode = false,
  theme = 'dark',
  defaultSection,
  onNavigateBack,
}) => {
  const isLight = theme === 'light';
  return (
    <section className={`rounded-2xl border p-6 ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/60 border-slate-800 text-slate-100'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">network shield</p>
          <h2 className="text-2xl font-bold">Secure routing overview</h2>
        </div>
        {onNavigateBack && (
          <button type="button" onClick={onNavigateBack} className="rounded-lg border border-slate-600 px-3 py-2 text-sm">
            Back
          </button>
        )}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        {stealthMode ? 'Stealth mode active.' : 'Network security protections are active.'}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">default section</p>
          <p className="mt-2 font-medium">{defaultSection ?? 'contacted_domains'}</p>
        </div>
        <div className="rounded-xl border border-slate-700 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">status</p>
          <p className="mt-2 font-medium text-emerald-400">Active</p>
        </div>
      </div>
    </section>
  );
};

export default NetworkRoutingShield;
