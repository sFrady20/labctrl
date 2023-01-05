import { ipcRenderer } from "electron";
import { AppRemote } from "../../main/background";
import { LifxRemote } from "../../main/lifx";
import { BroadlinkRemote } from "../../main/broadlink";

function use<T extends object>(channel: string) {
  return new Proxy<T>({} as any, {
    get:
      (_, name) =>
      async (...args) =>
        await ipcRenderer.invoke(`${channel}.${String(name)}`, ...args),
  });
}

export const app = use<AppRemote>("app");
export const lifx = use<LifxRemote>("lifx");
export const broadlink = use<BroadlinkRemote>("broadlink");
