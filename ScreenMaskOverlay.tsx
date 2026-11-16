import React, { useEffect, useState } from 'react';
import { ScreenMaskMode, ScreenMaskState } from '../types';
import { screenMaskService } from '../services/screenMaskService';

interface ScreenMaskOverlayProps {
  theme?: 'dark' | 'light';
}

export const ScreenMaskOverlay: React.FC<ScreenMaskOverlayProps> = ({ theme = 'dark' }) => {
  const [state, setState] = useState<ScreenMaskState>(() => screenMaskService.getSnapshot());
  const isLight = theme === 'light';

  useEffect(() => {
    const unsub = screenMaskService.subscribe(setState);
    return () => unsub();
  }, []);

  if (!state.isMaskEngaged) return null;

  if (state.maskMode === 'FULL_CURTAIN') {
    return (
      <div
        id="screen-mask-full-curtain"
        role="dialog"
        aria-modal="true"
        aria-label="Screen-Masking Privacy Curtain Active"
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in"
      >
        <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 sm:p-8 text-slate-100 shadow-2xl space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            </div>

            <div className="min-w-0 space-y-1">
              <p className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
                {state.activeCaptureSession
                  ? 'Screen Recording Session Detected'
                  : 'Screenshot Attempt Intercepted'}
              </p>
              <h2 className="text-xl font-bold text-white">
                Screen-Masking Curtain Engaged
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {state.maskReason ||
                  'Sensitive IP addresses, interception logs, and inbound telemetry are obscured.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums text-slate-400 border-t border-b border-slate-800 py-3">
            <span>Triggered: {state.lastTriggeredAt || 'Just now'}</span>
            <span aria-hidden="true">·</span>
            <span>
              {state.activeCaptureSession
                ? 'Locked while capture stream is active'
                : state.remainingUnmaskSeconds > 0
                ? `Auto-clears in ${state.remainingUnmaskSeconds}s`
                : 'Locked until dismissed'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => screenMaskService.setMaskMode('SELECTIVE_BLUR')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
            >
              Switch to Selective IP/Log Blur
            </button>
            <button
              type="button"
              onClick={() => screenMaskService.disengageMask()}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              {state.activeCaptureSession ? 'Stop Capture Lock & Unmask' : 'Disengage Screen Mask'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SELECTIVE_BLUR HUD: sensitive DOM regions (IPs, logs, caller IDs, hardware IDs) are blurred via CSS
  return (
    <div
      id="screen-mask-selective-hud"
      role="status"
      aria-live="assertive"
      className={`fixed top-20 right-4 sm:right-8 z-[90] w-[calc(100vw-2rem)] max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-md animate-in ${
        isLight
          ? 'bg-white/95 border-rose-300 text-slate-900'
          : 'bg-slate-900/95 border-rose-500/50 text-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <span>Screen Mask Active · IPs &amp; Logs Blurred</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
              {state.maskReason || 'Sensitive dashboard telemetry automatically obscured.'}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono tabular-nums text-slate-500">
              <span>{state.lastTriggeredAt || 'Active'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {state.activeCaptureSession
                  ? 'Locked during recording'
                  : state.remainingUnmaskSeconds > 0
                  ? `Unmasks in ${state.remainingUnmaskSeconds}s`
                  : 'Manual lock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => screenMaskService.setMaskMode('FULL_CURTAIN')}
          className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
            isLight
              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Full Curtain
        </button>
        <button
          type="button"
          onClick={() => screenMaskService.disengageMask()}
          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
        >
          {state.activeCaptureSession ? 'Stop Rec & Unmask' : 'Unmask Now'}
        </button>
      </div>
    </div>
  );
};

interface ScreenMaskGuardPanelProps {
  theme?: 'dark' | 'light';
}

export const ScreenMaskGuardPanel: React.FC<ScreenMaskGuardPanelProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  const [state, setState] = useState<ScreenMaskState>(() => screenMaskService.getSnapshot());
  const [probeSummary, setProbeSummary] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    const unsub = screenMaskService.subscribe(setState);
    return () => unsub();
  }, []);

  const handleProbeApis = async () => {
    setIsProbing(true);
    const result = await screenMaskService.probeCaptureEnvironment();
    setProbeSummary(result);
    setIsProbing(false);
  };

  const cardBase = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/50 border-slate-800 text-slate-100';

  const modeOptions: { id: ScreenMaskMode; label: string }[] = [
    { id: 'SELECTIVE_BLUR', label: 'Blur IPs & Logs' },
    { id: 'FULL_CURTAIN', label: 'Full-Screen Curtain' },
  ];

  return (
    <section
      id="screen-mask-guard-panel"
      className={`glass rounded-2xl border p-6 space-y-5 ${cardBase}`}
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span
              className={`font-semibold ${
                state.isMaskEngaged
                  ? 'text-rose-400'
                  : state.autoMaskEnabled
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}
            >
              {state.isMaskEngaged
                ? 'Screen Mask Engaged'
                : state.autoMaskEnabled
                ? 'Anti-Capture Guard Armed'
                : 'Guard Paused'}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-mono tabular-nums text-slate-400">
              {state.totalScreenshotsBlocked} screenshots masked
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-mono tabular-nums text-slate-400">
              {state.totalRecordingSessionsMasked} recording locks
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight">
            Screen-Masking Overlay &amp; Capture Guard
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automatically blurs source IPs, interception logs, and call/message records when PrintScreen, OS snipping shortcuts, print-to-PDF, or display recording streams are detected.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            id="simulate-screenshot-btn"
            onClick={() => screenMaskService.simulateScreenshotAttempt()}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            Test Screenshot Blur
          </button>

          <button
            type="button"
            id="simulate-recording-btn"
            onClick={() => screenMaskService.toggleSimulatedRecording()}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
              state.activeCaptureSession
                ? 'bg-rose-600 border-rose-500 text-white'
                : isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            {state.activeCaptureSession ? 'Stop Recording Lock' : 'Simulate Recording'}
          </button>

          {state.isMaskEngaged ? (
            <button
              type="button"
              id="disengage-screen-mask-btn"
              onClick={() => screenMaskService.disengageMask()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              Unmask Screen
            </button>
          ) : (
            <button
              type="button"
              id="engage-screen-mask-btn"
              onClick={() => screenMaskService.engageManualMask()}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              Mask Screen Now
            </button>
          )}
        </div>
      </div>

      {/* Mask Mode & Guard Switches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        {/* Mask Style & Timeout */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Masking Overlay Behavior
            </span>
            <div className={`inline-flex p-1 rounded-lg border w-full ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
              {modeOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => screenMaskService.setMaskMode(opt.id)}
                  className={`flex-1 min-h-[36px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    state.maskMode === opt.id
                      ? 'bg-cyan-600 text-white'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Auto-unmask after transient screenshot
            </span>
            <select
              aria-label="Auto-unmask timeout"
              value={state.autoUnmaskSeconds}
              onChange={e => screenMaskService.setAutoUnmaskSeconds(Number(e.target.value))}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-mono ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-slate-100'
              }`}
            >
              <option value={5}>5 sec</option>
              <option value={8}>8 sec</option>
              <option value={15}>15 sec</option>
              <option value={0}>Stay locked</option>
            </select>
          </div>
        </div>

        {/* Individual Detector Switches */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              {
                key: 'autoMaskEnabled',
                label: 'Auto-Mask Master Guard',
                hint: 'Arm real-time blur on capture events',
              },
              {
                key: 'detectScreenshotHotkeys',
                label: 'Screenshot Hotkey Trap',
                hint: 'PrintScreen, Cmd+Shift+3/4/5, Win+Shift+S, Ctrl+P',
              },
              {
                key: 'detectScreenRecording',
                label: 'Display Capture Stream Hook',
                hint: 'Locks mask when getDisplayMedia recording runs',
              },
              {
                key: 'strictWindowBlurMask',
                label: 'Strict Focus-Loss Blur',
                hint: 'Masks immediately when external window takes focus',
              },
            ] as const
          ).map(item => {
            const enabled = state[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => screenMaskService.toggleSetting(item.key)}
                className={`p-3.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 ${
                  enabled
                    ? isLight
                      ? 'border-cyan-300 bg-cyan-50/70'
                      : 'border-cyan-500/30 bg-cyan-950/20'
                    : isLight
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                    {item.hint}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold shrink-0 ${
                    enabled ? 'text-cyan-400' : 'text-slate-500'
                  }`}
                >
                  {enabled ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browser Capture Hook Diagnostic & Recent Events */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          {probeSummary ? (
            <span>{probeSummary}</span>
          ) : (
            <span>
              Browser capture monitor:{' '}
              <strong className="text-slate-200 dark:text-slate-200">
                {state.browserCaptureHookActive
                  ? 'getDisplayMedia hook active'
                  : 'Hotkey & visibility listeners active'}
              </strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleProbeApis}
            disabled={isProbing}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isProbing ? 'Probing...' : 'Probe Capture Devices'}
          </button>
          {state.events.length > 0 && (
            <button
              type="button"
              onClick={() => screenMaskService.clearEvents()}
              className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-400 transition-colors whitespace-nowrap"
            >
              Clear Log
            </button>
          )}
        </div>
      </div>

      {state.events.length > 0 && (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 pt-1">
          {state.events.slice(0, 4).map(ev => (
            <div
              key={ev.id}
              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <span className="font-mono font-semibold text-rose-400 mr-2">
                  {ev.triggerType.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{ev.detail}</span>
              </div>
              <span className="font-mono tabular-nums text-[11px] text-slate-500 shrink-0">
                {ev.timestamp} · {ev.maskApplied === 'FULL_CURTAIN' ? 'Curtain' : 'Blur'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ScreenMaskOverlay;
