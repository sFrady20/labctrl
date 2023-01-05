import { Client } from "lifx-lan-client";
import z from "zod";
import { provide } from "./util/provide";

const lifx = new Client();
lifx.init({}, () => {
  console.log("lifx initialized");
});

const lightParser = z.object({ label: z.string(), id: z.string() });

export class LifxRemote {
  getLights = async () => {
    const lights: z.infer<typeof lightParser>[] = lifx
      .lights(undefined)
      .map(lightParser.parse);
    return lights;
  };

  turnOn = async () => {
    lifx.lights(undefined).forEach((light) => light.on());
  };

  turnOff = async () => {
    lifx.lights(undefined).forEach((light) => light.off());
  };

  workTime = async () => {
    lifx
      .lights(undefined)
      .forEach((light) =>
        light.color(
          Math.random() * 360,
          0,
          /corner/i.test(light.label) ? 30 : 70
        )
      );
  };

  movieTime = async () => {
    lifx
      .lights(undefined)
      .forEach((light) =>
        light.color(
          Math.random() * 360,
          100,
          /flood/i.test(light.label) ? 0 : 50,
          3500,
          3000
        )
      );
  };

  randomize = async () => {
    lifx
      .lights(undefined)
      .forEach((light) => light.color(Math.random() * 360, 100, 50));
  };

  set = async (
    name: string,
    hsl: [number, number, number],
    duration?: number
  ) => {
    lifx
      .lights(undefined)
      .filter((x) =>
        name
          .split(",")
          .some((y) => x.label.toLowerCase().includes(y.toLowerCase()))
      )
      .forEach((x) => x.color(...hsl, 3500, duration || 0));
  };
}

provide(LifxRemote, "lifx");

export default lifx;
