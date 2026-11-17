# SENTINEL-X | High-Security Operations Console

Combined Vite + React + TypeScript + Tailwind + PWA/Android project integrating all modules from your **Sentinel Ai Assistant** document into the complete multi-file build structure.

## Quick Build

```bash
npm install
npm run build
```

## Included Structure

- `index.html`, `index.css`, `vite.config.ts`, `tsconfig.json`, `package.json`
- `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`
- `src/types.ts`, `src/constants.ts`, `src/App.tsx`, `src/main.tsx`, `src/index.css`
- `src/components/`: `SecurityDashboard.tsx`, `DeviceCommandsMonitor.tsx`, `NetworkRoutingShield.tsx`, `MobileCenter.tsx`, `ChatInterface.tsx`, `SettingsMenu.tsx`, `PWAInstallButton.tsx` (exports both `PWAInstallButton` and `OfflineIndicator`), `ScreenMaskOverlay.tsx`
- `src/services/`: `audioEngine.ts`, `apkPackager.ts`, `screenMaskService.ts`, `securityModulesService.ts`
