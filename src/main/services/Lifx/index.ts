import z from "zod";
import lifx from "./client";

const lightParser = z.object({ label: z.string(), id: z.string() });

export const getLights = async () => {
  const lights: z.infer<typeof lightParser>[] = lifx
    .lights(undefined)
    .map(lightParser.parse);
  return lights;
};

export const turnLightsOn = async () => {
  lifx.lights(undefined).forEach((light) => light.on());
};

export const turnLightsOff = async () => {
  lifx.lights(undefined).forEach((light) => light.off());
};

export const randomizeLighting = async () => {
  lifx
    .lights(undefined)
    .forEach((light) => light.color(Math.random() * 360, 100, 50));
};

export { textToLights } from "./textToLights";
