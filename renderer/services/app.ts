import { debounce } from "lodash";
import { proxy, subscribe } from "valtio";
import { lifx } from "./remote";

type AppState = {
  lights: {
    currentTheme: string;
    themes: {
      [name: string]: {
        filter: string;
        color: [number, number, number];
      }[];
    };
  };
  settings: {
    theme: string;
  };
};

class App {
  state: AppState;
  constructor() {
    //read state or set as default
    this.state = proxy<AppState>(
      (typeof localStorage !== "undefined" &&
        JSON.parse(localStorage.getItem("app_state"))) || {
        lights: {
          currentTheme: "default",
          themes: {
            default: [{ filter: "", color: [Math.random() * 360, 100, 70] }],
          },
        },
      }
    );
    //save state on changes
    subscribe(this.state, () => {
      localStorage.setItem("app_state", JSON.stringify(this.state));
    });

    const syncTheme = debounce(
      (theme: AppState["lights"]["themes"][number]) => {
        theme.forEach((x) => {
          lifx.set(x.filter, [...x.color]);
        });
      },
      400
    );

    //change colors automatically
    subscribe(this.state, async () => {
      const currentThemeName = this.state.lights.currentTheme;
      const currentTheme = this.state.lights.themes[currentThemeName];
      if (!currentTheme) {
        console.warn(`No theme found for "${currentThemeName}"`);
        return;
      }
      syncTheme(currentTheme);
    });
  }
}

const app = new App();
export default app;
