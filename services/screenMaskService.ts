import type { ScreenMaskMode, ScreenMaskState } from '../types';

const baseState: ScreenMaskState = {
  autoMaskEnabled: true,
  isMaskEngaged: false,
  activeCaptureSession: false,
  maskMode: 'SELECTIVE_BLUR',
  detectScreenshotHotkeys: true,
  detectScreenRecording: true,
  blurOnVisibilityHidden: true,
  strictWindowBlurMask: true,
  autoUnmaskSeconds: 30,
  remainingUnmaskSeconds: 30,
  maskReason: null,
  lastTriggerType: null,
  lastTriggeredAt: null,
  totalScreenshotsBlocked: 0,
  totalRecordingSessionsMasked: 0,
  browserCaptureHookActive: true,
  detectedCaptureDevicesCount: 0,
  events: [],
};

const listeners = new Set<(state: ScreenMaskState) => void>();
let state: ScreenMaskState = { ...baseState };

const emit = () => { listeners.forEach(listener => listener(state)); };

export const screenMaskService = {
  subscribe(listener: (state: ScreenMaskState) => void) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  engageManualMask() {
    state = { ...state, isMaskEngaged: true, maskReason: 'Manual privacy lock engaged', totalScreenshotsBlocked: state.totalScreenshotsBlocked + 1 };
    emit();
  },
  disengageMask() {
    state = { ...state, isMaskEngaged: false, maskReason: null };
    emit();
  },
  setMaskMode(mode: ScreenMaskMode) {
    state = { ...state, maskMode: mode };
    emit();
  },
  setAutoUnmaskSeconds(value: number) {
    state = { ...state, autoUnmaskSeconds: value, remainingUnmaskSeconds: value };
    emit();
  },
  toggleSetting(key: string) {
    if (key === 'autoMaskEnabled') {
      state = { ...state, autoMaskEnabled: !state.autoMaskEnabled };
      emit();
    }
  },
  simulateScreenshotAttempt() {
    state = { ...state, isMaskEngaged: true, lastTriggeredAt: new Date().toLocaleTimeString(), totalScreenshotsBlocked: state.totalScreenshotsBlocked + 1 };
    emit();
  },
  toggleSimulatedRecording() {
    state = { ...state, activeCaptureSession: !state.activeCaptureSession };
    emit();
  },
  probeCaptureEnvironment() {
    return 'No active capture environment detected.';
  },
  clearEvents() {
    state = { ...state, events: [] };
    emit();
  },
};
