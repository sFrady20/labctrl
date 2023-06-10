import clsx from "clsx";
import { create } from "zustand";
import type { LightingTheme, Song } from "@main/services/Lifx/types";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { parseCronExpression } from "cron-schedule";
import { CopyButton, useLighting } from ".";
import Color from "color";

type CronScheduleTimer = ReturnType<(typeof scheduler)["setInterval"]>;

const musicModeCron = parseCronExpression("*/15 * * * * *");

//@ts-ignore
window.onSpotifyWebPlaybackSDKReady = () => {
  //@ts-ignore
  const player = new Spotify.Player({
    name: "labctrl",
    getOAuthToken: async (cb) => {
      cb(await window.main.invoke("getSpotifyAccessToken"));
    },
    volume: 0.5,
  });

  player.addListener("ready", ({ device_id }) => {
    console.log("Spotify ready with Device ID", device_id);
  });

  player.addListener("not_ready", ({ device_id }) => {
    console.log("Device ID has gone offline", device_id);
  });

  player.addListener("initialization_error", ({ message }) => {
    console.error(`Spotify initialization_error:`, message);
  });

  player.addListener("authentication_error", ({ message }) => {
    console.error(`Spotify authentication_error:`, message);
  });

  player.addListener("account_error", ({ message }) => {
    console.error(`Spotify account_error:`, message);
  });

  player.addListener("player_state_changed", ({ message }) => {
    console.error(`Spotify account_error: ${message}`);
  });

  player.connect();
  useMusicMode.setState({ spotifyPlayer: player });
};

export const useMusicMode = create<{
  isBusy: boolean;
  isActive: boolean;
  interval?: CronScheduleTimer | undefined;
  playing?: Song;
  activate: (onSuccess: (theme: LightingTheme) => void) => void;
  deactivate: () => void;
  spotifyPlayer: any;
}>((set, get) => ({
  isBusy: false,
  isActive: false,
  interval: undefined,
  playing: undefined,
  spotifyPlayer: undefined,
  activate: (onSuccess) => {
    set({
      isActive: true,
      interval: scheduler.setInterval(musicModeCron, async () => {
        if (get().isBusy) return;

        try {
          set({ isBusy: true });
          const song = await window.main.invoke("getCurrentSpotifySong");

          if (!song) throw new Error("No song playing");

          set({ playing: song });

          if (song.id === useLighting.getState().activeTheme?.spotifySongId)
            throw new Error("Song theme already active");

          const result = await window.main.invoke("songToLightingTheme", song);

          if (result.status === "error")
            throw new Error(`Theme creation error: ${result.message}`);

          onSuccess(result.theme);
        } catch (err: any) {
          console.error(err.meessage);
        } finally {
          set({ isBusy: false });
        }
      }),
    });
  },
  deactivate: () => {
    const activeInterval = get().interval;
    if (activeInterval) scheduler.clearTimeoutOrInterval(get().interval);
    set({ isActive: false, isBusy: false, playing: undefined });
  },
}));

import.meta.hot?.on("vite:beforeUpdate", () => {
  useMusicMode.getState().deactivate();
});

export function MusicMode(props: {}) {
  const lighting = useLighting();
  const musicMode = useMusicMode();

  return (
    <div className="rounded-lg overflow-hidden">
      <div
        className={clsx(
          "bg-gray-900 px-3 h-20 b-1 b-solid b-gray-900 flex flex-row items-center space-x-3 group"
        )}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div
            className="flex items-center justify-center w-14 h-14 bg-gray-950 rounded-md bg-cover"
            style={{
              backgroundImage: musicMode.playing
                ? `url(${musicMode.playing.images[0]})`
                : undefined,
            }}
          >
            {!musicMode.playing && (
              <div className="i-bx-bxl-spotify text-[#1db954] text-[32px]" />
            )}
          </div>
          {musicMode.playing ? (
            <div className="space-y-1">
              <div className="font-semibold text-sm">{`${musicMode.playing.title}`}</div>
              <div className="text-xs">{musicMode.playing.artist}</div>
            </div>
          ) : (
            <div className="font-semibold">Music mode</div>
          )}
        </div>
        <div className="space-x-1 flex">
          <div
            className="w-8 h-8 hover:bg-gray-800 rounded-md flex items-center justify-center cursor-pointer"
            onClick={async () => {
              console.log(await musicMode.spotifyPlayer.getCurrentState());
              musicMode.spotifyPlayer.togglePlay();
            }}
          >
            <div className={musicMode.playing ? "i-bx-pause" : "i-bx-play"} />
          </div>
          <div
            className="w-8 h-8 hover:bg-gray-800 rounded-md flex items-center justify-center cursor-pointer"
            onClick={() => {
              window.main.invoke("toggleSongPlayingOnSpotify", true);
            }}
          >
            <div className="i-bx-skip-next" />
          </div>
        </div>
        <div
          className={clsx(
            "flex flex-row space-x-2 h-11 w-11 items-center justify-center rounded-md",
            musicMode.isBusy
              ? "cursor-wait opacity-60"
              : "cursor-pointer hover:bg-gray-800"
          )}
          onClick={() =>
            musicMode.isBusy
              ? undefined
              : musicMode.isActive
              ? musicMode.deactivate()
              : musicMode.activate(lighting.activateTheme)
          }
        >
          <div
            className={clsx(
              "text-[24px]",
              musicMode.isBusy
                ? "i-svg-spinners-3-dots-fade"
                : musicMode.isActive
                ? "i-bx-checkbox-checked"
                : "i-bx-checkbox text-[24px",
              {
                "text-green-500": musicMode.isActive && !musicMode.isBusy,
              }
            )}
          />
        </div>
      </div>
      {lighting.activeTheme &&
        musicMode.playing &&
        lighting.activeTheme.spotifySongId === musicMode.playing.id && (
          <div className="bg-black px-4 h-11 flex flex-row items-center group space-x-2">
            <div className="flex-1 text-xs font-semibold">
              {lighting.activeTheme.name}
            </div>
            <div className="flex flex-row space-x-1">
              {lighting.activeTheme.instructions.map((x, i) => (
                <div
                  key={i}
                  className="rounded-full w-2 h-2"
                  style={{
                    backgroundColor: new Color(
                      [x[1], x[2], x[3]].map(parseFloat),
                      "hsv"
                    ).hex(),
                  }}
                />
              ))}
            </div>
            <div className="flex-row space-x-2 hidden group-hover:flex">
              <CopyButton theme={lighting.activeTheme} />
            </div>
          </div>
        )}
    </div>
  );
}
