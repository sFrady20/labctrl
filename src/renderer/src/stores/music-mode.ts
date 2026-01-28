import { create } from "zustand";
import type { Song } from "@main/services/lifx/types";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { parseCronExpression } from "cron-schedule";
import { useLighting } from "./lighting";

type CronScheduleTimer = ReturnType<(typeof scheduler)["setInterval"]>;

const musicModeCron = parseCronExpression("*/15 * * * * *");

type MusicModeStore = {
  isBusy: boolean;
  isActive: boolean;
  interval?: CronScheduleTimer;
  playing?: Song;
  activate: () => void;
  deactivate: (restorePrevious?: boolean) => void;
  setPlaying: (song: Song | undefined) => void;
};

export const useMusicMode = create<MusicModeStore>((set, get) => ({
  isBusy: false,
  isActive: false,
  interval: undefined,
  playing: undefined,

  activate: () => {
    set({
      isActive: true,
      interval: scheduler.setInterval(musicModeCron, async () => {
        if (get().isBusy) return;

        try {
          set({ isBusy: true });
          const song = await window.main.invoke("getCurrentSpotifySong");

          if (!song) throw new Error("No song data");

          set({ playing: song });

          if (!song.isPlaying) throw new Error("Song is paused");

          if (song.id === useLighting.getState().activeTheme?.spotifySongId)
            throw new Error("Song theme already active");

          const result = await window.main.invoke("songToLightingTheme", song);

          if (result.status === "error")
            throw new Error(`Theme creation error: ${result.message}`);

          // Save previous theme on first music mode activation
          useLighting.getState().activateTheme(result.theme, true);
        } catch (err: any) {
          console.log(err.message);
        } finally {
          set({ isBusy: false });
        }
      }),
    });
  },

  deactivate: (restorePrevious = true) => {
    const activeInterval = get().interval;
    if (activeInterval) scheduler.clearTimeoutOrInterval(activeInterval);

    if (restorePrevious) {
      useLighting.getState().restorePreviousTheme();
    }

    set({ isActive: false, isBusy: false, playing: undefined, interval: undefined });
  },

  setPlaying: (song) => set({ playing: song }),
}));

// Clean up on hot module replacement
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    useMusicMode.getState().deactivate(false);
  });
}
