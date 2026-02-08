import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type { MainAPI } from "@main/index";

// Custom APIs for renderer
const mainProxy = {
  invoke: async <T extends keyof MainAPI>(
    property: T,
    ...args: Parameters<MainAPI[T]>
  ) => await ipcRenderer.invoke(`remote__${property}`, ...args),
};

// Window control API
const windowControls = {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke("window:isMaximized"),
  onMaximizedChange: (callback: (maximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, maximized: boolean) =>
      callback(maximized);
    ipcRenderer.on("window:maximized-changed", handler);
    return () => {
      ipcRenderer.removeListener("window:maximized-changed", handler);
    };
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("main", mainProxy);
    contextBridge.exposeInMainWorld("windowControls", windowControls);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
  // @ts-ignore (define in dts)
  window.windowControls = windowControls;
}
