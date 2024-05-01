import lifx from "./client";
import { findBezierCurveY } from "./bezier";
import { LightingOptions, LightingTheme } from "./types";

export const turnLightsOn = async () => {
  lifx.lights(undefined).forEach((light) => light.on());
};

export const turnLightsOff = async () => {
  lifx.lights(undefined).forEach((light) => light.off());
};

export const getAllLights = async () => {
  const lights = await lifx.lights(undefined);
  console.log(lights);
  return {};
};

export const setLightingTheme = async (
  theme: LightingTheme,
  options?: LightingOptions
) => {
  const { instructions } = theme;
  const { relativeBrightness } = options || {};

  console.log(
    `Activating theme \"${theme.name}\"${
      relativeBrightness === undefined
        ? ""
        : ` at ${relativeBrightness} brightness`
    }`
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
        values[2] / 100
      );
      values[2] = curvedBrightness
        ? Math.round(curvedBrightness * 100)
        : values[2];
    }

    values[4] = Math.min(5000, values[4]);

    light.color(...values);
  }
};

export { textToLightingTheme } from "./textToLightingTheme";
export { songToLightingTheme } from "./songToLightingTheme";
export { alterLightingTheme } from "./alterLightingTheme";
