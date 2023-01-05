import { app, BrowserWindow } from "electron";
import serve from "electron-serve";
import Window from "./lib/window";
import "./lifx";
import "./broadlink";
import { provide } from "./util/provide";
import Store from "electron-store";

const store = new Store();

const isProd: boolean = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = new Window("main", {
    width: 1000,
    height: 600,
    autoHideMenuBar: true,
    transparent: true,
    movable: true,
    resizable: true,
    frame: false,
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home.html");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

export class AppRemote {
  quit = async () => {
    BrowserWindow.getAllWindows().forEach((win) => win.close());
    app.quit();
  };
}
provide(AppRemote, "app");

app.on("window-all-closed", () => {
  app.quit();
});
