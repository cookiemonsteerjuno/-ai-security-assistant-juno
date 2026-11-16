import type { HardwareIntegrityState } from '../types';

const listeners = new Set<(state: HardwareIntegrityState) => void>();
let state: HardwareIntegrityState = {
  killSwitchTripped: false,
  lastTripReason: null,
  lastTripTimestamp: null,
  usbOtgDataLock: true,
  audioJackSniffGuard: true,
  hidInjectionGuard: true,
  thunderboltDmaLock: true,
  autoKillSwitchOnThreat: true,
  liveBusMonitoringActive: true,
  totalKillSwitchTrips: 0,
  totalUnauthorizedProbesBlocked: 0,
  detectedBrowserDevicesCount: 0,
  lastBusProbeSummary: 'No suspicious activity',
  events: [],
};

const emit = () => { listeners.forEach(listener => listener(state)); };

export const hardwareIntegrityService = {
  subscribe(listener: (state: HardwareIntegrityState) => void) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  setState(next: HardwareIntegrityState) {
    state = next;
    emit();
  },
};
