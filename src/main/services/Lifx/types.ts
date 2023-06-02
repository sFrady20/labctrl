export type LightingTheme = {
  id: string;
  name: string;
  instructions: string[][];
  spotifySongId?: string;
};
export type LightingOptions = {
  relativeBrightness?: number;
  movieMode?: boolean;
};
