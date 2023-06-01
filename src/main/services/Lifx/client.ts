import { Client } from "lifx-lan-client";

const lifx = new Client();
lifx.init({}, () => {
  console.log("lifx initialized");
});

export default lifx;
