import type { SimSwitchLockState } from '../types';

const listeners = new Set<(state: SimSwitchLockState) => void>();
let state: SimSwitchLockState = {
  simSwitchLocked: true,
  esimProvisioningLocked: true,
  portOutFreezeEnabled: true,
  autoQuarantine2FAOnSwap: true,
  lockdownTripped: false,
  lockdownReason: null,
  boundPrimaryIccid: 'SIM-PRIMARY',
  boundSecondaryEsimId: 'ESIM-SECONDARY',
  boundCarrier: 'Sentinel Carrier',
  activeSlot: 'PHYSICAL_SIM_1',
  guardPin: 'SENTINEL-LOCK',
  totalSwapAttemptsBlocked: 0,
  radioProbeSummary: 'No swap attempts detected',
  events: [],
};

const emit = () => { listeners.forEach(listener => listener(state)); };

export const simSwitchLockService = {
  subscribe(listener: (state: SimSwitchLockState) => void) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  setState(next: SimSwitchLockState) {
    state = next;
    emit();
  },
};
