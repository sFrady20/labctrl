export type DeviceType = "ir" | "rf" | "switch";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  brand?: string;
  model?: string;
}

export interface DeviceAction {
  id: string;
  name: string;
  deviceId: string;
  code?: string; // IR/RF code
  icon?: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
  deviceIds: string[];
  icon?: string;
}
