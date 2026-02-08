import { ElectronAPI } from "@electron-toolkit/preload";
import type { MainAPI } from "@main/index";

declare global {
  interface Window {
    electron: ElectronAPI;
    main: {
      invoke: <P extends keyof MainAPI>(
        p: P,
        ...params: Parameters<MainAPI[P]>
      ) => Promise<ReturnType<MainAPI[P]>>;
    };
    windowControls: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      onMaximizedChange: (callback: (maximized: boolean) => void) => () => void;
    };
  }
}
