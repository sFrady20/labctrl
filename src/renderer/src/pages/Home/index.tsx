import clsx from "clsx";
import Color from "color";
import { useState, useRef, useEffect } from "react";
import { useAsync } from "react-async-hook";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import debounce from "lodash/debounce";
import type { LightingTheme } from "@main/services/Lifx/types";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { parseCronExpression } from "cron-schedule";

type CronScheduleTimer = ReturnType<(typeof scheduler)["setInterval"]>;

const musicModeCron = parseCronExpression("*/15 * * * * *");
let musicModeInterval: CronScheduleTimer | undefined = undefined;

const debouncedSetLightingTheme = debounce(
  (theme: LightingTheme, relativeBrightness?: number) => {
    window.main.invoke("setLightingTheme", theme, {
      relativeBrightness,
    });
  },
  300,
  { trailing: true }
);

const useMusicMode = create<{
  isBusy: boolean;
  isActive: boolean;
  interval?: CronScheduleTimer | undefined;
  activate: (onSuccess: (theme: LightingTheme) => void) => void;
  deactivate: () => void;
}>((set, get) => ({
  isBusy: false,
  isActive: false,
  interval: undefined,
  activate: (onSuccess) => {
    set({
      isActive: true,
      interval: scheduler.setInterval(musicModeCron, async () => {
        if (get().isBusy) return;

        try {
          set({ isBusy: true });
          const song = await window.main.invoke("getCurrentSpotifySong");

          if (!song) throw new Error("No song playing");

          console.log(
            "TESTING SONG ID",
            song.id,
            useLightingStore.getState().activeTheme?.spotifySongId
          );

          if (
            song.id === useLightingStore.getState().activeTheme?.spotifySongId
          )
            throw new Error("Song theme already active");

          const result = await window.main.invoke("songToLightingTheme", song);

          if (result.status === "error")
            throw new Error(`Theme creation error: ${result.message}`);

          onSuccess(result.theme);
        } catch (err: any) {
          console.log(err.meessage);
        } finally {
          set({ isBusy: false });
        }
      }),
    });
  },
  deactivate: () => {
    scheduler.clearTimeoutOrInterval(get().interval);
    set({ isActive: false, isBusy: false });
  },
}));

type LightingStore = {
  activeTheme?: LightingTheme;
  activateTheme: (theme: LightingTheme) => void;
  themes: LightingTheme[];
  addTheme: (theme: LightingTheme) => void;
  removeTheme: (name: string) => void;
  relativeBrightness: number;
  setRelativeBrightness: (number: number) => void;
  musicMode: boolean;
  isMusicModeBusy: boolean;
  toggleMusicMode: (to?: boolean, options?: { onTick?: () => void }) => void;
};

export const useLightingStore = create(
  persist<LightingStore>(
    (set, get) => ({
      activeTheme: undefined,
      activateTheme: (theme) => {
        window.main.invoke("setLightingTheme", theme, {
          relativeBrightness: get().relativeBrightness,
        });
        set((x) => ({ ...x, activeTheme: theme }));
      },
      themes: [],
      addTheme: (theme) => set((x) => ({ ...x, themes: [...x.themes, theme] })),
      removeTheme: (id) =>
        set((x) => ({ ...x, themes: x.themes.filter((x) => x.id !== id) })),
      relativeBrightness: 0.5,
      setRelativeBrightness: (value) => {
        set((x) => ({ ...x, relativeBrightness: value }));
        const activeTheme = get().activeTheme;
        if (!activeTheme) return;
        debouncedSetLightingTheme(activeTheme, value);
      },
      musicMode: false,
      isMusicModeBusy: false,
      toggleMusicMode: async (to?: boolean) => {
        const current = get().musicMode;
        const next = to === undefined ? !current : to;
        if (next) {
          useMusicMode.getState().activate(get().activateTheme);
        } else if (musicModeInterval) {
          useMusicMode.getState().deactivate();
        }
        set((x) => ({ ...x, musicMode: next }));
      },
    }),
    {
      name: "lighting-store",
    }
  )
);

function PasteButton(props: { onPaste?: (theme: LightingTheme) => void }) {
  const { onPaste } = props;
  const [hasPasted, setPasted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
      onClick={async (e) => {
        e.stopPropagation();
        const theme = JSON.parse(
          await navigator.clipboard.readText()
        ) as LightingTheme;
        theme.id = Math.random().toString(32).substring(7);
        onPaste?.(theme);
        setPasted(true);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setPasted(false), 1000);
      }}
    >
      <div
        className={clsx(hasPasted ? "i-bx-check text-green" : "i-bx-paste")}
      />
    </button>
  );
}

function CopyButton(props: { theme: LightingTheme }) {
  const { theme } = props;
  const [hasCopied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="p-2 rounded-md hover:bg-gray-800"
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(JSON.stringify(theme));
        setCopied(true);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setCopied(false), 1000);
      }}
    >
      <div
        className={clsx(hasCopied ? "i-bx-check text-green" : "i-bx-copy")}
      />
    </button>
  );
}

export default function HomePage() {
  const [topic, setTopic] = useState("");

  const {
    relativeBrightness,
    themes,
    addTheme,
    removeTheme,
    activeTheme,
    activateTheme,
    setRelativeBrightness,
  } = useLightingStore();

  const musicMode = useMusicMode();

  //activate theme on mount
  useEffect(() => {
    if (activeTheme) activateTheme(activeTheme);
  }, []);

  const generate = useAsync(
    async (topic, relativeBrightness) => {
      const result = await window.main.invoke("textToLightingTheme", topic);
      if (result.status === "success") addTheme(result.theme);
    },
    [topic, relativeBrightness],
    { executeOnMount: false, executeOnUpdate: false }
  );

  return (
    <div className="flex-1 flex flex-col space-y-4 w-full">
      <div className="space-y-4 sticky top-0 bg-gray-950 z-100 p-4">
        <div className="flex flex-row space-x-3">
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => window.main.invoke("turnLightsOn")}
            >
              <div className="i-bx-bxs-sun" />
            </button>
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => window.main.invoke("turnLightsOff")}
            >
              <div className="i-bx-bxs-moon" />
            </button>
          </div>
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <PasteButton onPaste={addTheme} />
          </div>
          <input
            type="range"
            className="flex-1"
            value={relativeBrightness}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => {
              setRelativeBrightness(parseFloat(e.target.value));
            }}
          />
        </div>

        <div className="flex flex-col b-1 b-gray-900 b-solid  rounded-lg overflow-hidden">
          <textarea
            disabled={generate.loading}
            className="p-4 b-none rounded-t-lg bg-gray-800 text-[#eee]"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="h-0 b-0 b-t-1 b-solid b-gray-900 w-full" />
          <button
            className="h-10 cursor-pointer bg-gray-900 font-semibold hover:bg-gray-800 flex items-center justify-center"
            disabled={generate.loading}
            onClick={async () => {
              generate.execute(topic, relativeBrightness);
            }}
          >
            {generate.loading ? (
              <div className="i-svg-spinners-3-dots-fade" />
            ) : (
              "Generate"
            )}
          </button>
        </div>

        <div
          className={clsx(
            "bg-gray-800 px-3 h-11 rounded-lg b-1 b-solid b-gray-900 flex flex-row items-center",
            musicMode.isBusy
              ? "cursor-wait opacity-60"
              : "cursor-pointer hover:bg-gray-700"
          )}
          onClick={() =>
            musicMode.isBusy
              ? undefined
              : musicMode.isActive
              ? musicMode.deactivate()
              : musicMode.activate(activateTheme)
          }
        >
          <div className="flex flex-row items-center space-x-2 flex-1">
            <div className="i-bx-bxl-spotify text-[#1db954] text-[24px]" />
            <div className="font-semibold">Music mode</div>
          </div>
          <div className="flex flex-row space-x-2">
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
      </div>

      <div className="flex flex-col space-y-1 px-6 pb-4">
        {themes.map((x, i) => (
          <div
            key={i}
            className="flex justify-between items-center b-1 b-gray-900 b-solid rounded-lg px-2 h-11 space-x-3 hover:bg-gray-900 cursor-pointer group"
            onClick={() => {
              activateTheme(x);
            }}
          >
            {activeTheme?.id === x.id && (
              <div className="i-bx-bxs-check-circle text-green-500" />
            )}
            <div className="text-sm font-medium flex-1">{x.name}</div>
            <div className="flex items-center space-x-1">
              {x.instructions.map((x, i) => (
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
            <div className="hidden group-hover:block ">
              <CopyButton theme={x} />
              <button
                className="p-2 rounded-md hover:bg-red-950"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTheme(x.id);
                }}
              >
                <div className="i-bx-trash text-red-500 " />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
