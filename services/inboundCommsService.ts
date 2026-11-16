export interface InboundCommsSnapshot {
  blocked: number;
  activeCalls: number;
  trustedMessages: number;
}

const listeners = new Set<(snapshot: InboundCommsSnapshot) => void>();
let snapshot: InboundCommsSnapshot = { blocked: 0, activeCalls: 0, trustedMessages: 0 };

const emit = () => {
  listeners.forEach(listener => listener(snapshot));
};

export const inboundCommsService = {
  subscribe(listener: (snapshot: InboundCommsSnapshot) => void) {
    listeners.add(listener);
    listener(snapshot);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
  setSnapshot(next: InboundCommsSnapshot) {
    snapshot = next;
    emit();
  },
};
