import type { DeviceCommand } from '../types';

export interface AudioAnnouncerState {
  isMuted: boolean;
  isSpeaking: boolean;
  currentText: string | null;
  isUnlocked: boolean;
}

const listeners = new Set<(state: AudioAnnouncerState) => void>();

let state: AudioAnnouncerState = {
  isMuted: false,
  isSpeaking: false,
  currentText: null,
  isUnlocked: false,
};

const emit = () => {
  listeners.forEach(listener => listener(state));
};

export const audioAnnouncer = {
  subscribe(listener: (state: AudioAnnouncerState) => void) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
  getIsMuted() {
    return state.isMuted;
  },
  getIsUnlocked() {
    return state.isUnlocked;
  },
  toggleMute() {
    state = { ...state, isMuted: !state.isMuted };
    emit();
    return state.isMuted;
  },
  unlockAudio() {
    state = { ...state, isUnlocked: true };
    emit();
  },
  announceCommand(command: DeviceCommand) {
    const text = command.spokenAnnouncement || command.commandText;
    state = { ...state, isSpeaking: true, currentText: text };
    emit();
    setTimeout(() => {
      state = { ...state, isSpeaking: false, currentText: text };
      emit();
    }, 250);
  },
  testAnnouncement() {
    state = { ...state, isSpeaking: true, currentText: 'System audio channel ready.' };
    emit();
    setTimeout(() => {
      state = { ...state, isSpeaking: false };
      emit();
    }, 250);
  },
};
