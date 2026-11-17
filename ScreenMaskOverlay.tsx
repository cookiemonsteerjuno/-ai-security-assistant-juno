import React from 'react';
import { Lock } from 'lucide-react';
import { ScreenMaskMode } from '../types';

interface ScreenMaskOverlayProps {
  isScreenMasked: boolean;
  screenMaskMode: ScreenMaskMode;
  onDisengage: () => void;
}

export const ScreenMaskOverlay: React.FC<ScreenMaskOverlayProps> = ({
  isScreenMasked,
  screenMaskMode,
  onDisengage,
}) => {
  if (!isScreenMasked || screenMaskMode !== 'FULL_CURTAIN') return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-rose-400" />
      </div>
      <h2 className="text-xl font-bold tracking-wider uppercase mono text-rose-400">
        SENTINEL-X PRIVACY CURTAIN ENGAGED
      </h2>
      <p className="text-sm text-slate-400 max-w-md mt-2">
        All dashboard telemetry, IP routes, and security logs are hidden from screen capture and shoulder-surfing.
      </p>
      <button
        type="button"
        onClick={onDisengage}
        className="mt-6 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-cyan"
      >
        Disengage Privacy Curtain
      </button>
    </div>
  );
};

export default ScreenMaskOverlay;
