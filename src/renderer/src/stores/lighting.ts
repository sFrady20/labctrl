import { create } from "zustand";
import { persist } from "zustand/middleware";
import debounce from "lodash/debounce";
import type { LightingTheme, ThemeSource, AnimatedPalette } from "@main/services/lifx/types";

const debouncedSetLightingTheme = debounce(
  (theme: LightingTheme, relativeBrightness?: number) => {
    window.main.invoke("setLightingTheme", theme, {
      relativeBrightness,
    });
  },
  300,
  { trailing: true }
);

type LightingStore = {
  // Active theme
  activeTheme?: LightingTheme;
  previousTheme?: LightingTheme;
  activateTheme: (theme: LightingTheme, savePrevious?: boolean) => void;
  restorePreviousTheme: () => void;

  // Animation
  isAnimating: boolean;
  startAnimation: (palette: AnimatedPalette) => void;
  stopAnimation: () => void;

  // Themes library
  themes: LightingTheme[];
  addTheme: (theme: LightingTheme, source?: ThemeSource) => void;
  updateTheme: (id: string, updates: Partial<LightingTheme>) => void;
  removeTheme: (id: string) => void;
  setThemes: (themes: LightingTheme[]) => void;
  toggleFavorite: (id: string) => void;
  setCategory: (id: string, category: string) => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;

  // Brightness
  relativeBrightness: number;
  setRelativeBrightness: (value: number) => void;

  // Computed helpers
  getCategories: () => string[];
};

export const useLighting = create(
  persist<LightingStore>(
    (set, get) => ({
      // Active theme
      activeTheme: undefined,
      previousTheme: undefined,
      activateTheme: (theme, savePrevious = false) => {
        // Stop any running animation first
        if (get().isAnimating) {
          window.main.invoke("stopAnimation");
          set({ isAnimating: false });
        }

        const current = get().activeTheme;

        // Check if this is an animated palette
        if ("type" in theme && (theme as AnimatedPalette).type === "animated") {
          const animated = theme as AnimatedPalette;
          window.main.invoke("startAnimation", animated, get().relativeBrightness);
          set((state) => ({
            ...state,
            activeTheme: theme,
            previousTheme: savePrevious ? current : state.previousTheme,
            isAnimating: true,
          }));
        } else {
          window.main.invoke("setLightingTheme", theme, {
            relativeBrightness: get().relativeBrightness,
          });
          set((state) => ({
            ...state,
            activeTheme: theme,
            previousTheme: savePrevious ? current : state.previousTheme,
          }));
        }
      },
      restorePreviousTheme: () => {
        const prev = get().previousTheme;
        if (prev) {
          // Stop any running animation first
          if (get().isAnimating) {
            window.main.invoke("stopAnimation");
            set({ isAnimating: false });
          }

          window.main.invoke("setLightingTheme", prev, {
            relativeBrightness: get().relativeBrightness,
          });
          set((state) => ({
            ...state,
            activeTheme: prev,
            previousTheme: undefined,
          }));
        }
      },

      // Animation
      isAnimating: false,
      startAnimation: (palette) => {
        window.main.invoke("startAnimation", palette, get().relativeBrightness);
        set((state) => ({
          ...state,
          activeTheme: palette,
          isAnimating: true,
        }));
      },
      stopAnimation: () => {
        window.main.invoke("stopAnimation");
        set({ isAnimating: false });
      },

      // Themes library
      themes: [],
      addTheme: (theme, source = "generated") =>
        set((state) => ({
          ...state,
          themes: [
            ...state.themes,
            {
              ...theme,
              createdAt: theme.createdAt || Date.now(),
              source: theme.source || source,
            },
          ],
        })),
      updateTheme: (id, updates) =>
        set((state) => ({
          ...state,
          themes: state.themes.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      removeTheme: (id) =>
        set((state) => ({
          ...state,
          themes: state.themes.filter((t) => t.id !== id),
        })),
      setThemes: (themes) => set((state) => ({ ...state, themes })),
      toggleFavorite: (id) =>
        set((state) => ({
          ...state,
          themes: state.themes.map((t) =>
            t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
          ),
        })),
      setCategory: (id, category) =>
        set((state) => ({
          ...state,
          themes: state.themes.map((t) =>
            t.id === id ? { ...t, category } : t
          ),
        })),

      // Filters
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedCategory: null,
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      showFavoritesOnly: false,
      setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),

      // Brightness
      relativeBrightness: 0.5,
      setRelativeBrightness: (value) => {
        set((state) => ({ ...state, relativeBrightness: value }));
        const activeTheme = get().activeTheme;
        if (!activeTheme) return;

        // Update animation brightness if animating
        if (get().isAnimating) {
          window.main.invoke("setAnimationBrightness", value);
        } else {
          debouncedSetLightingTheme(activeTheme, value);
        }
      },

      // Computed helpers
      getCategories: () => {
        const themes = get().themes;
        const categories = new Set<string>();
        themes.forEach((t) => {
          if (t.category) categories.add(t.category);
        });
        return Array.from(categories).sort();
      },
    }),
    {
      name: "lighting-store",
      version: 2,
      partialize: (state) => ({
        // Persist themes, active theme, brightness, but not filters
        themes: state.themes,
        activeTheme: state.activeTheme,
        relativeBrightness: state.relativeBrightness,
      }),
    }
  )
);
