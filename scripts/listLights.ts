import { Client } from "lifx-lan-client";

const lifx = new Client();
lifx.init({}, () => {
  console.log("initialized");
  console.log(lifx.lights(undefined));
});
