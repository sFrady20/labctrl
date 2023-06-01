import { app } from "electron";
import Main, { type InferMainAPI } from "./main";
import * as lifx from "./services/Lifx";

const main = new Main(
  {
    ...lifx,
    quit() {
      app.quit();
    },
  },
  { browser: { width: 420, height: 720 } }
);

export type MainAPI = InferMainAPI<typeof main>;
export default main;
