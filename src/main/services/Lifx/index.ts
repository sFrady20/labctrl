import lifx from "./client";
import { findBezierCurveY } from "./bezier";

export const turnLightsOn = async () => {
  lifx.lights(undefined).forEach((light) => light.on());
};

export const turnLightsOff = async () => {
  lifx.lights(undefined).forEach((light) => light.off());
};

export type LightingOptions = {
  relativeBrightness?: number;
  movieMode?: boolean;
};
export const setLightingTheme = async (
  theme: {
    name: string;
    instructions: string[][];
  },
  options?: LightingOptions
) => {
  const { instructions } = theme;
  const { relativeBrightness, movieMode } = options || {};

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

    light.color(...values);
  }
};

export { textToLightingTheme } from "./textToLightingTheme";
export { songToLightingTheme } from "./songToLightingTheme";
