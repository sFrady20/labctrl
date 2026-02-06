import lifx from "./client";
import lights from "./lights";
import { findBezierCurveY } from "./bezier";
import {
  LightingOptions,
  LightingTheme,
  LightDefinition,
  LightState,
} from "./types";

// In-memory cache for light states since lifx-lan-client may not expose
// synchronous state access on the light objects.
const lightStateCache = new Map<
  string,
  {
    hue: number;
    saturation: number;
    brightness: number;
    kelvin: number;
    power: boolean;
  }
>();

export const turnLightsOn = async () => {
  lifx.lights(undefined).forEach((light) => light.on());
};

export const turnLightsOff = async () => {
  lifx.lights(undefined).forEach((light) => light.off());
};

export const setLightsPower = async (lightIds: string[], power: boolean) => {
  for (const lightId of lightIds) {
    const def = lights.find((l) => l.id === lightId);
    if (!def) continue;
    const light = lifx.light(def.lifxId);
    if (!light) continue;
    if (power) {
      light.on();
    } else {
      light.off();
    }
    // Update cache
    const cached = lightStateCache.get(lightId);
    if (cached) {
      lightStateCache.set(lightId, { ...cached, power });
    }
  }
};

export const getAllLights = async () => {
  const allLights = await lifx.lights(undefined);
  console.log(allLights);
  return {};
};

export const setLightingTheme = async (
  theme: LightingTheme,
  options?: LightingOptions,
) => {
  const { instructions } = theme;
  const { relativeBrightness } = options || {};

  console.log(
    `Activating theme \"${theme.name}\"${
      relativeBrightness === undefined
        ? ""
        : ` at ${relativeBrightness} brightness`
    }`,
  );

  for (let i = 0; i < instructions.length; ++i) {
    const [lifxId, ...args] = instructions[i];
    const light = lifx.light(lifxId);
    if (!light) continue;

    const values = args.map((x) => parseInt(x));

    //map brightess to relative curve
    if (relativeBrightness === 0) {
      values[2] = 0;
    } else {
      const curvedBrightness = findBezierCurveY(
        !relativeBrightness ? 0.5 : relativeBrightness,
        values[2] / 100,
      );
      values[2] = curvedBrightness
        ? Math.round(curvedBrightness * 100)
        : values[2];
    }

    values[4] = Math.min(5000, values[4]);

    light.color(...values);

    // Update cache for this light
    const def = lights.find((l) => l.lifxId === lifxId);
    if (def) {
      lightStateCache.set(def.id, {
        hue: values[0],
        saturation: values[1],
        brightness: values[2],
        kelvin: values[3],
        power: values[2] > 0,
      });
    }
  }
};

export const getLightDefinitions = async (): Promise<LightDefinition[]> => {
  return lights.map((l) => ({
    id: l.id,
    lifxId: l.lifxId,
    label: l.label,
    description: l.description,
  }));
};

export const getLightStates = async (): Promise<LightState[]> => {
  const allLights = lifx.lights(undefined);
  return lights.map((def) => {
    const light = allLights.find((l: any) => l.id === def.lifxId);
    const cached = lightStateCache.get(def.id);

    if (!light) {
      return {
        id: def.id,
        lifxId: def.lifxId,
        label: def.label,
        online: false,
        power: cached?.power || false,
        hue: cached?.hue || 0,
        saturation: cached?.saturation || 0,
        brightness: cached?.brightness || 0,
        kelvin: cached?.kelvin || 3500,
      };
    }

    // Try to read state from the light object; fall back to cache
    const status = (light as any).status || {};
    const color = status.color || {};
    const hasColor = color.hue !== undefined;

    return {
      id: def.id,
      lifxId: def.lifxId,
      label: def.label,
      online: true,
      power: hasColor
        ? status.power === 1 || status.power === true || status.power === 65535
        : cached?.power || false,
      hue: hasColor ? color.hue : cached?.hue || 0,
      saturation: hasColor ? color.saturation : cached?.saturation || 0,
      brightness: hasColor ? color.brightness : cached?.brightness || 0,
      kelvin: hasColor ? color.kelvin : cached?.kelvin || 3500,
    };
  });
};

/**
 * Apply layered bezier brightness curve.
 * hardware = bezier(master, bezier(group, individual/100)) * 100
 *
 * @param individual  Raw per-light brightness (0-100)
 * @param groupBrightness  Group-level dimmer (0-1, default 1 = no dimming)
 * @param relativeBrightness  Master dimmer (0-1, default 1 = full)
 */
const applyBrightnessCurve = (
  individual: number,
  groupBrightness: number = 1,
  relativeBrightness: number = 1,
): number => {
  if (relativeBrightness === 0) return 0;

  const normalised = individual / 100; // 0-1

  // Layer 1: group brightness curve
  let curved: number | null;
  if (groupBrightness >= 1) {
    curved = normalised;
  } else if (groupBrightness <= 0) {
    curved = 0;
  } else {
    curved = findBezierCurveY(groupBrightness, normalised);
    if (curved === null) curved = normalised;
  }

  // Layer 2: master relative brightness curve
  if (relativeBrightness >= 1) {
    // no master dimming
  } else {
    const masterCurved = findBezierCurveY(relativeBrightness, curved);
    if (masterCurved !== null) curved = masterCurved;
  }

  return Math.round(curved * 100);
};

export const setSingleLight = async (
  lightId: string,
  hue: number,
  saturation: number,
  brightness: number,
  kelvin: number,
  relativeBrightness: number = 1,
  groupBrightness: number = 1,
  duration: number = 300,
) => {
  const def = lights.find((l) => l.id === lightId);
  if (!def) return;
  const light = lifx.light(def.lifxId);
  if (!light) return;

  const hwBrightness = applyBrightnessCurve(
    brightness,
    groupBrightness,
    relativeBrightness,
  );
  light.color(hue, saturation, hwBrightness, kelvin, duration);

  // Update cache with the hardware brightness
  lightStateCache.set(lightId, {
    hue,
    saturation,
    brightness: hwBrightness,
    kelvin,
    power: hwBrightness > 0,
  });
};

export const setGroupLights = async (
  lightIds: string[],
  hue: number,
  saturation: number,
  brightness: number,
  kelvin: number,
  relativeBrightness: number = 1,
  groupBrightness: number = 1,
  duration: number = 300,
) => {
  for (const lightId of lightIds) {
    const def = lights.find((l) => l.id === lightId);
    if (!def) continue;
    const light = lifx.light(def.lifxId);
    if (!light) continue;

    const hwBrightness = applyBrightnessCurve(
      brightness,
      groupBrightness,
      relativeBrightness,
    );
    light.color(hue, saturation, hwBrightness, kelvin, duration);

    // Update cache with the hardware brightness
    lightStateCache.set(lightId, {
      hue,
      saturation,
      brightness: hwBrightness,
      kelvin,
      power: hwBrightness > 0,
    });
  }
};

/**
 * Re-apply brightness curves to a list of lights.
 * Used when the master relative brightness slider changes.
 * Accepts each light's individual brightness and re-sends to hardware through the curve.
 */
export const reapplyBrightness = async (
  lightEntries: Array<{
    id: string;
    hue: number;
    saturation: number;
    brightness: number;
    kelvin: number;
    groupBrightness?: number;
  }>,
  relativeBrightness: number,
  duration: number = 300,
) => {
  for (const entry of lightEntries) {
    const def = lights.find((l) => l.id === entry.id);
    if (!def) continue;
    const light = lifx.light(def.lifxId);
    if (!light) continue;

    const hwBrightness = applyBrightnessCurve(
      entry.brightness,
      entry.groupBrightness ?? 1,
      relativeBrightness,
    );
    light.color(
      entry.hue,
      entry.saturation,
      hwBrightness,
      entry.kelvin,
      duration,
    );

    lightStateCache.set(entry.id, {
      hue: entry.hue,
      saturation: entry.saturation,
      brightness: hwBrightness,
      kelvin: entry.kelvin,
      power: hwBrightness > 0,
    });
  }
};

export { textToLightingTheme } from "./textToLightingTheme";
export { songToLightingTheme } from "./songToLightingTheme";
export { alterLightingTheme } from "./alterLightingTheme";

// Animation engine exports
export {
  startAnimation,
  stopAnimation,
  isAnimationRunning,
  getCurrentAnimation,
  setAnimationBrightness,
} from "./animation-engine";
