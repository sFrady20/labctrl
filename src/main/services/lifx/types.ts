export type ThemeSource = "generated" | "imported" | "music" | "manual";

export type LightInstruction = [
  lightId: string,
  hue: string,
  saturation: string,
  brightness: string,
  kelvin: string,
  duration: string,
];

export type LightingTheme = {
  id: string;
  name: string;
  instructions: string[][];
  spotifySongId?: string;
  // New fields for palette management
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt?: number;
  source?: ThemeSource;
};

export type AnimationEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export type LightingKeyframe = {
  time: number; // 0-1 representing position in cycle
  instructions: string[][];
};

export type AnimatedPalette = LightingTheme & {
  type: "animated";
  keyframes: LightingKeyframe[];
  duration: number; // Total cycle duration in ms
  easing: AnimationEasing;
  loop: boolean;
};
export type LightingOptions = {
  relativeBrightness?: number;
  movieMode?: boolean;
};

export type Song = {
  id: string;
  title: string;
  album: string;
  artist: string;
  images: string[];
  isPlaying: boolean;
};

export type LightDefinition = {
  id: string;
  lifxId: string;
  label: string;
  description: string;
};

export type LightState = {
  id: string;
  lifxId: string;
  label: string;
  online: boolean;
  power: boolean;
  hue: number;
  saturation: number;
  brightness: number;
  kelvin: number;
};

export type LightGroup = {
  id: string;
  name: string;
  lightIds: string[];
  brightness: number; // 0-1, group-level dimmer (1 = full, 0 = off)
};
