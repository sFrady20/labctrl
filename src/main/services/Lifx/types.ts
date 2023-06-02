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

export type Song = {
  id: string;
  title: string;
  album: string;
  artist: string;
  images: string[];
};
