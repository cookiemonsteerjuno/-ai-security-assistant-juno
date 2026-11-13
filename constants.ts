
export const APP_NAME = "SENTINEL-X";
export const SYSTEM_BRIGHTNESS = 100;
export const GEMINI_MODEL = "gemini-3-flash-preview";
export const TTS_MODEL = "gemini-2.5-flash-preview-tts";

export const INITIAL_MODULES = [
  { id: 'firewall', name: 'Quantum Firewall', status: 'ACTIVE', health: 98 },
  { id: 'intrusion', name: 'Intrusion Detection', status: 'ACTIVE', health: 100 },
  { id: 'encryption', name: 'End-to-End Encryption', status: 'ACTIVE', health: 100 },
  { id: 'auth', name: 'Biometric Auth', status: 'ACTIVE', health: 95 },
  { id: 'network', name: 'Neural Network Monitor', status: 'ACTIVE', health: 99 },
];
