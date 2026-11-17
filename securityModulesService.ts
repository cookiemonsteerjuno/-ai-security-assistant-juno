export interface ShieldModuleRegistry {
  analyticsNullRouter: boolean;
  nodePortBlackhole: boolean;
  cloudflareLineDrop: boolean;
  foreignStatesGeoBlock: boolean;
  bluetoothKillSwitch: boolean;
  usbHardwareIsolation: boolean;
  networkSharingBlocker: boolean;
  packetConcealmentEch: boolean;
  firewallAutoReload: boolean;
  autonomousLocationHop: boolean;
}

export const DEFAULT_SHIELD_REGISTRY: ShieldModuleRegistry = {
  analyticsNullRouter: true,
  nodePortBlackhole: true,
  cloudflareLineDrop: true,
  foreignStatesGeoBlock: true,
  bluetoothKillSwitch: true,
  usbHardwareIsolation: true,
  networkSharingBlocker: true,
  packetConcealmentEch: true,
  firewallAutoReload: true,
  autonomousLocationHop: true,
};
