import { ipcMain } from "electron";

export function provide<T>(Class: new () => T, channel: string) {
  Object.entries(new Class()).forEach(([key, value]) =>
    typeof value === "function"
      ? ipcMain.handle(`${channel}.${key}`, (e, ...args) => value(...args))
      : null
  );
}
