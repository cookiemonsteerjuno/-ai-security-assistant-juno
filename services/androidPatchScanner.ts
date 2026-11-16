export interface AndroidPatchScannerSnapshot {
  patches: Array<{ id: string; ecosystem: string; status: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'; }>; 
  profile: {
    ecosystem: string;
    modelName: string;
    osVersion: string;
    currentSecurityPatchLevel: string;
  };
  scanHistory: string[];
}

const listeners = new Set<(snapshot: AndroidPatchScannerSnapshot) => void>();

const snapshot: AndroidPatchScannerSnapshot = {
  patches: [],
  profile: {
    ecosystem: 'ANDROID',
    modelName: 'Sentinel Device',
    osVersion: '14',
    currentSecurityPatchLevel: '2026-01-01',
  },
  scanHistory: ['Initial scan'],
};

const emit = () => {
  listeners.forEach(listener => listener(snapshot));
};

export const androidPatchScanner = {
  subscribe(listener: (snapshot: AndroidPatchScannerSnapshot) => void) {
    listeners.add(listener);
    listener(snapshot);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
  scanNow() {
    snapshot.scanHistory = [...snapshot.scanHistory, 'Scan completed'];
    emit();
  },
  testCriticalVoiceAlert() {
    emit();
  },
  toggleAutoPoll() {
    emit();
  },
  setPollInterval(_seconds: number) {
    emit();
  },
  toggleVoiceAlerts() {
    emit();
  },
  setEcosystem(ecosystem: string) {
    snapshot.profile = { ...snapshot.profile, ecosystem };
    emit();
  },
  redetectDeviceHints() {
    emit();
  },
  updateProfile(updates: Partial<typeof snapshot.profile>) {
    snapshot.profile = { ...snapshot.profile, ...updates };
    emit();
  },
  resetCatalog() {
    snapshot.patches = [];
    emit();
  },
  stageAndVerifyPatch(_id: string) {
    emit();
  },
  applyPatch(_id: string) {
    emit();
  },
};
