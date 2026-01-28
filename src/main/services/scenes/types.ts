export interface Scene {
  id: string;
  name: string;
  icon: string;
  paletteId: string | null; // null means don't change palette
  brightness: number | null; // null means don't change brightness
  musicModeEnabled: boolean | null; // null means don't change
}

export interface Schedule {
  id: string;
  name: string;
  sceneId: string;
  cronExpression: string; // e.g., "0 9 * * 1-5" = 9am weekdays
  enabled: boolean;
}

export const DEFAULT_SCENES: Scene[] = [
  {
    id: "work",
    name: "Work",
    icon: "i-bx-briefcase",
    paletteId: null,
    brightness: 1.0,
    musicModeEnabled: false,
  },
  {
    id: "movie",
    name: "Movie",
    icon: "i-bx-movie",
    paletteId: null,
    brightness: 0.3,
    musicModeEnabled: false,
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: "i-bx-joystick",
    paletteId: null,
    brightness: 0.6,
    musicModeEnabled: true,
  },
  {
    id: "relax",
    name: "Relax",
    icon: "i-bx-happy",
    paletteId: null,
    brightness: 0.4,
    musicModeEnabled: false,
  },
];
