import clsx from "clsx";
import Color from "color";
import { useState, useRef, useEffect } from "react";
import { useAsync } from "react-async-hook";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import debounce from "lodash/debounce";

type Theme = { id: string; name: string; instructions: string[][] };

type LightingStore = {
  activeTheme?: Theme;
  activateTheme: (theme: Theme) => void;
  themes: Theme[];
  addTheme: (theme: Theme) => void;
  removeTheme: (name: string) => void;
  relativeBrightness: number;
  setRelativeBrightness: (number: number) => void;
};

const debouncedSetLightingTheme = debounce(
  (theme: Theme, relativeBrightness?: number) => {
    window.main.invoke("setLightingTheme", theme, {
      relativeBrightness,
    });
  },
  300,
  { trailing: true }
);

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
    }),
    {
      name: "lighting-store",
    }
  )
);

function PasteButton(props: { onPaste?: (theme: Theme) => void }) {
  const { onPaste } = props;
  const [hasPasted, setPasted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="b-none px-4 h-10 cursor-pointer bg-gray-100 hover:bg-gray-200 font-semibold flex items-center justify-center space-x-2"
      onClick={async (e) => {
        e.stopPropagation();
        const theme = JSON.parse(await navigator.clipboard.readText()) as Theme;
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

function CopyButton(props: { theme: Theme }) {
  const { theme } = props;
  const [hasCopied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="p-2 rounded-md hover:bg-gray-100"
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

  useEffect(() => {
    if (activeTheme) activateTheme(activeTheme);
  }, []);

  const generate = useAsync(
    async (topic, relativeBrightness) => {
      const result = await window.main.invoke("textToLights", topic, {
        relativeBrightness,
      });
      if (result.status === "success") addTheme(result);
    },
    [topic, relativeBrightness],
    { executeOnMount: false, executeOnUpdate: false }
  );

  return (
    <div className="flex-1 flex flex-col space-y-4 w-full p-4">
      <div className="flex flex-row space-x-3">
        <div className="flex flex-row b-1 b-gray-300 b-solid bg-gray-50 rounded-lg overflow-hidden">
          <button
            className="b-none px-4 h-10 cursor-pointer bg-gray-100 hover:bg-gray-200 font-semibold flex items-center justify-center space-x-2"
            onClick={() => window.main.invoke("turnLightsOn")}
          >
            <div className="i-bx-bxs-sun" />
          </button>
          <button
            className="b-none px-4 h-10 cursor-pointer bg-gray-100 hover:bg-gray-200 font-semibold flex items-center justify-center space-x-2"
            onClick={() => window.main.invoke("turnLightsOff")}
          >
            <div className="i-bx-bxs-moon" />
          </button>
        </div>
        <div className="flex flex-row b-1 b-gray-300 b-solid bg-gray-50 rounded-lg overflow-hidden">
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

      <div className="flex flex-col b-1 b-gray-300 b-solid bg-gray-50 rounded-lg overflow-hidden">
        <textarea
          disabled={generate.loading}
          className="p-4 b-none rounded-t-lg"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <div className="h-0 b-0 b-t-1 b-solid b-gray-300 w-full" />
        <button
          className="h-10 cursor-pointer bg-gray-100 font-semibold hover:bg-gray-200 flex items-center justify-center"
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

      <div className="flex flex-col space-y-1">
        {themes.map((x, i) => (
          <div
            key={i}
            className="flex justify-between items-center b-1 b-gray-300 b-solid rounded-lg px-2 h-11 space-x-3 hover:bg-gray-50 cursor-pointer group"
            onClick={() => {
              activateTheme(x);
            }}
          >
            <div className="text-sm font-medium flex-1">{x.name}</div>
            <div className="flex items-center space-x-1">
              {x.instructions.map((x, i) => (
                <div
                  key={i}
                  className="rounded-full w-2 h-2"
                  style={{
                    backgroundColor: new Color(
                      `hsl(${x[1]},${x[2]}%,${x[3]}%)`
                    ).hex(),
                  }}
                />
              ))}
            </div>
            <div className="hidden group-hover:block ">
              <CopyButton theme={x} />
              <button
                className="p-2 rounded-md hover:bg-red-100"
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
