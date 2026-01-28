import { create } from "zustand";
import { useLighting } from "./lighting";
import { useMusicMode } from "./music-mode";

interface Scene {
  id: string;
  name: string;
  icon: string;
  paletteId: string | null;
  brightness: number | null;
  musicModeEnabled: boolean | null;
}

interface ScenesState {
  scenes: Scene[];
  isLoading: boolean;
  loadScenes: () => Promise<void>;
  activateScene: (sceneId: string) => void;
}

export const useScenes = create<ScenesState>((set, get) => ({
  scenes: [],
  isLoading: true,

  loadScenes: async () => {
    set({ isLoading: true });
    try {
      const scenes = await window.main.invoke("getAllScenes");
      set({ scenes, isLoading: false });
    } catch (error) {
      console.error("Failed to load scenes:", error);
      set({ isLoading: false });
    }
  },

  activateScene: (sceneId: string) => {
    const scene = get().scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    // Apply brightness if specified
    if (scene.brightness !== null) {
      useLighting.getState().setRelativeBrightness(scene.brightness);
    }

    // Apply palette if specified
    if (scene.paletteId !== null) {
      const theme = useLighting
        .getState()
        .themes.find((t) => t.id === scene.paletteId);
      if (theme) {
        useLighting.getState().activateTheme(theme);
      }
    }

    // Apply music mode if specified
    if (scene.musicModeEnabled !== null) {
      if (scene.musicModeEnabled) {
        useMusicMode.getState().activate();
      } else {
        useMusicMode.getState().deactivate(false);
      }
    }
  },
}));
