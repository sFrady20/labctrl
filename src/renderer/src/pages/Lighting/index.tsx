import clsx from "clsx";
import Color from "color";
import { useState, useRef, useEffect } from "react";
import { useAsync } from "react-async-hook";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import debounce from "lodash/debounce";
import type { LightingTheme } from "@main/services/Lifx/types";
import { MusicMode, useMusicMode } from "./MusicMode";
import { useNavigate } from "react-router";
import { ReactSortable } from "react-sortablejs";

const debouncedSetLightingTheme = debounce(
  (theme: LightingTheme, relativeBrightness?: number) => {
    window.main.invoke("setLightingTheme", theme, {
      relativeBrightness,
    });
  },
  300,
  { trailing: true }
);

type LightingStore = {
  activeTheme?: LightingTheme;
  activateTheme: (theme: LightingTheme) => void;
  themes: LightingTheme[];
  addTheme: (theme: LightingTheme) => void;
  removeTheme: (name: string) => void;
  setThemes: (theme: LightingTheme[]) => void;
  relativeBrightness: number;
  setRelativeBrightness: (number: number) => void;
};

export const useLighting = create(
  persist<LightingStore>(
    (set, get) =>
      ({
        activeTheme: undefined,
        activateTheme: (theme) => {
          window.main.invoke("setLightingTheme", theme, {
            relativeBrightness: get().relativeBrightness,
          });
          set((x) => ({ ...x, activeTheme: theme }));
        },
        themes: [],
        addTheme: (theme) =>
          set((x) => ({ ...x, themes: [...x.themes, theme] })),
        removeTheme: (id) =>
          set((x) => ({ ...x, themes: x.themes.filter((x) => x.id !== id) })),
        setThemes: (themes) => set((x) => ({ ...x, themes })),
        relativeBrightness: 0.5,
        setRelativeBrightness: (value) => {
          set((x) => ({ ...x, relativeBrightness: value }));
          const activeTheme = get().activeTheme;
          if (!activeTheme) return;
          debouncedSetLightingTheme(activeTheme, value);
        },
      } satisfies LightingStore),
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

export function CopyButton(props: { theme: LightingTheme }) {
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

export default function LightingPage() {
  const [topic, setTopic] = useState("");

  const lighting = useLighting();
  const musicMode = useMusicMode();
  const navigate = useNavigate();

  //activate theme on mount
  useEffect(() => {
    if (lighting.activeTheme) lighting.activateTheme(lighting.activeTheme);
  }, []);

  const generate = useAsync(
    async (topic) => {
      const result = await window.main.invoke("textToLightingTheme", topic);
      if (result.status === "success") lighting.addTheme(result.theme);
    },
    [topic],
    { executeOnMount: false, executeOnUpdate: false }
  );

  const alter = useAsync(
    async (theme: LightingTheme | undefined, topic: string) => {
      if (!theme) return;
      const result = await window.main.invoke(
        "alterLightingTheme",
        theme,
        topic
      );
      if (result.status === "success") lighting.addTheme(result.theme);
    },
    [lighting.activeTheme, topic],
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
            <PasteButton onPaste={lighting.addTheme} />
          </div>
          <input
            type="range"
            className="flex-1"
            value={lighting.relativeBrightness}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => {
              lighting.setRelativeBrightness(parseFloat(e.target.value));
            }}
          />
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => navigate("/settings")}
            >
              <div className="i-bx-dots-horizontal-rounded" />
            </button>
          </div>
        </div>

        <div className="flex flex-col b-1 b-gray-900 b-solid  rounded-lg overflow-hidden">
          <textarea
            placeholder="Write in a topic to generate or an alteration to the current theme..."
            disabled={generate.loading || alter.loading}
            className="p-4 b-none rounded-t-lg bg-gray-800 text-[#eee] text-sm disabled:opacity-60"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="flex flex-row">
            <button
              className="flex-1 h-10 cursor-pointer bg-gray-900 font-semibold hover:bg-gray-800 flex items-center justify-center disabled:opacity-60 disabled:hover-bg-gray-900 disabled:cursor-default"
              disabled={generate.loading || alter.loading}
              onClick={async () => {
                generate.execute(topic);
              }}
            >
              {generate.loading ? (
                <div className="i-svg-spinners-3-dots-fade" />
              ) : (
                "Generate"
              )}
            </button>
            <button
              className="flex-1 h-10 cursor-pointer bg-gray-900 font-semibold hover:bg-gray-800 flex items-center justify-center disabled:opacity-60 disabled:hover-bg-gray-900 disabled:cursor-default"
              disabled={
                generate.loading || alter.loading || !lighting.activeTheme
              }
              onClick={async () => {
                alter.execute(lighting.activeTheme, topic);
              }}
            >
              {alter.loading ? (
                <div className="i-svg-spinners-3-dots-fade" />
              ) : (
                "Alter"
              )}
            </button>
          </div>
        </div>

        <MusicMode />
      </div>

      <ReactSortable
        className="flex flex-col space-y-1 px-6 pb-4"
        list={lighting.themes}
        setList={lighting.setThemes}
        animation={150}
      >
        {lighting.themes.map((x, i) => (
          <div
            key={i}
            className="flex justify-between items-center rounded-lg px-2 h-11 space-x-3 hover:bg-gray-900 cursor-pointer group"
            onClick={() => {
              lighting.activateTheme(x);
              musicMode.deactivate();
            }}
          >
            {lighting.activeTheme?.id === x.id && (
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
                  lighting.removeTheme(x.id);
                }}
              >
                <div className="i-bx-trash text-red-500 " />
              </button>
            </div>
          </div>
        ))}
      </ReactSortable>
    </div>
  );
}
