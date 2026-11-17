import { ScreenCaptureEvent, ScreenMaskMode } from '../types';

export function applyScreenMaskAttribute(isMasked: boolean): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-screen-masked', isMasked ? 'true' : 'false');
  }
}

export function createScreenCaptureEvent(
  triggerType: string,
  detail: string,
  maskApplied: ScreenMaskMode
): ScreenCaptureEvent {
  return {
    id: `scr-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    triggerType,
    detail,
    maskApplied,
  };
}
