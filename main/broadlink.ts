import { Broadlink } from "broadlink-rm-ts";
import { provide } from "./util/provide";

const broadlink = new Broadlink();

broadlink.on("deviceReady", (device) => {
  console.log("DEVICE READY");
  device
    .sweepFrequency()
    .then(() => device.confirmFrequency())
    .then((buf) => {
      console.log("RF code", buf.toString("hex"));
    })
    .catch((reason) => console.log);
});

broadlink.discover();

export class BroadlinkRemote {
  sweep = async () => {};
}

provide(BroadlinkRemote, "broadlink");
