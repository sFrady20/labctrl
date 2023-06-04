import { OpenExternalOptions, app, shell } from "electron";
import Main, { type InferMainAPI } from "./main";
import * as lifx from "./services/Lifx";
import * as chatGPT from "./services/ChatGPT";
import * as spotify from "./services/Spotify";

const main = new Main(
  {
    ...lifx,
    ...chatGPT,
    ...spotify,
    openExternal(url: string, options?: OpenExternalOptions) {
      shell.openExternal(url, options);
    },
    quit() {
      app.quit();
    },
  },
  { browser: { width: 420, height: 720 } }
);

export type MainAPI = InferMainAPI<typeof main>;
export default main;
