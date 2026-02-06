import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LightState, LightGroup } from "@main/services/lifx/types";

type LightsStore = {
  lightStates: LightState[];
  groups: LightGroup[];
  hasManualEdits: boolean;
  isEditing: boolean;

  pollLights: () => Promise<void>;
  setSingleLight: (
    id: string,
    h: number,
    s: number,
    b: number,
    k: number,
    relativeBrightness?: number,
    groupBrightness?: number,
  ) => Promise<void>;
  setGroupLights: (
    lightIds: string[],
    h: number,
    s: number,
    b: number,
    k: number,
    relativeBrightness?: number,
    groupBrightness?: number,
  ) => Promise<void>;
  reapplyBrightness: (relativeBrightness: number) => Promise<void>;
  setEditing: (v: boolean) => void;

  addGroup: (group: LightGroup) => void;
  updateGroup: (id: string, updates: Partial<Omit<LightGroup, "id">>) => void;
  removeGroup: (id: string) => void;
  setGroupBrightness: (
    groupId: string,
    brightness: number,
    relativeBrightness: number,
  ) => Promise<void>;

  clearManualEdits: () => void;
};

export const useLights = create(
  persist<LightsStore>(
    (set, get) => ({
      lightStates: [],
      groups: [],
      hasManualEdits: false,
      isEditing: false,

      pollLights: async () => {
        try {
          const states = await window.main.invoke("getLightStates");
          set({ lightStates: states });
        } catch (error) {
          console.error("Failed to poll light states:", error);
        }
      },

      setSingleLight: async (
        id,
        h,
        s,
        b,
        k,
        relativeBrightness = 1,
        groupBrightness = 1,
      ) => {
        // Optimistic local update — store the *logical* (individual) brightness
        set((state) => ({
          lightStates: state.lightStates.map((l) =>
            l.id === id
              ? { ...l, hue: h, saturation: s, brightness: b, kelvin: k }
              : l,
          ),
          hasManualEdits: true,
        }));
        await window.main.invoke(
          "setSingleLight",
          id,
          h,
          s,
          b,
          k,
          relativeBrightness,
          groupBrightness,
        );
      },

      setGroupLights: async (
        lightIds,
        h,
        s,
        b,
        k,
        relativeBrightness = 1,
        groupBrightness = 1,
      ) => {
        // Optimistic local update
        set((state) => ({
          lightStates: state.lightStates.map((l) =>
            lightIds.includes(l.id)
              ? { ...l, hue: h, saturation: s, brightness: b, kelvin: k }
              : l,
          ),
          hasManualEdits: true,
        }));
        await window.main.invoke(
          "setGroupLights",
          lightIds,
          h,
          s,
          b,
          k,
          relativeBrightness,
          groupBrightness,
        );
      },

      /**
       * Re-apply brightness curves to all lights when master slider changes.
       * Sends each light's current individual brightness through the bezier curves.
       */
      reapplyBrightness: async (relativeBrightness: number) => {
        const { lightStates, groups } = get();

        // Build a map of lightId -> groupBrightness
        const groupBrightnessMap = new Map<string, number>();
        for (const group of groups) {
          for (const lightId of group.lightIds) {
            groupBrightnessMap.set(lightId, group.brightness);
          }
        }

        const entries = lightStates.map((l) => ({
          id: l.id,
          hue: l.hue,
          saturation: l.saturation,
          brightness: l.brightness,
          kelvin: l.kelvin,
          groupBrightness: groupBrightnessMap.get(l.id) ?? 1,
        }));

        await window.main.invoke(
          "reapplyBrightness",
          entries,
          relativeBrightness,
        );
      },

      setEditing: (v) => set({ isEditing: v }),

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      updateGroup: (id, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, ...updates } : g,
          ),
        })),

      removeGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        })),

      /**
       * Set the group-level brightness and re-apply each light's
       * individual brightness through the group + master bezier curves.
       */
      setGroupBrightness: async (
        groupId: string,
        brightness: number,
        relativeBrightness: number,
      ) => {
        const { lightStates, groups } = get();
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;

        // Update group brightness in store
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, brightness } : g,
          ),
          hasManualEdits: true,
        }));

        // Re-apply each light's individual brightness through the curves
        const entries = group.lightIds
          .map((id) => lightStates.find((l) => l.id === id))
          .filter((l): l is LightState => !!l)
          .map((l) => ({
            id: l.id,
            hue: l.hue,
            saturation: l.saturation,
            brightness: l.brightness,
            kelvin: l.kelvin,
            groupBrightness: brightness,
          }));

        await window.main.invoke(
          "reapplyBrightness",
          entries,
          relativeBrightness,
        );
      },

      clearManualEdits: () => set({ hasManualEdits: false }),
    }),
    {
      name: "lights-store",
      partialize: (state) =>
        ({
          groups: state.groups,
        }) as unknown as LightsStore,
    },
  ),
);
