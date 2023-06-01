import Color from "color";
import { useState } from "react";
import { useAsync } from "react-async-hook";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = { name: string; instructions: string[][] };

type LightingStore = {
  themes: Theme[];
  addTheme: (theme: Theme) => void;
  removeTheme: (name: string) => void;
};

export const useLightingStore = create(
  persist<LightingStore>(
    (set) => ({
      themes: [],
      addTheme: (theme) => set((x) => ({ ...x, themes: [...x.themes, theme] })),
      removeTheme: (name) =>
        set((x) => ({ ...x, themes: x.themes.filter((x) => x.name !== name) })),
    }),
    {
      name: "lighting-store",
    }
  )
);

export default function HomePage() {
  const [topic, setTopic] = useState("");

  const { themes, addTheme, removeTheme } = useLightingStore();

  const generate = useAsync(
    async (topic) => {
      const result = await window.main.invoke("textToLights", topic);
      if (result.status === "success") addTheme(result);
    },
    [topic],
    { executeOnMount: false, executeOnUpdate: false }
  );

  return (
    <div className="flex flex-col space-y-4 w-full px-4">
      <div className="flex flex-row b-1 b-gray-300 b-solid bg-gray-50 rounded-lg overflow-hidden">
        <button
          className="flex-1 b-none py-2 cursor-pointer bg-gray-100 hover:bg-gray-200 font-semibold flex items-center justify-center space-x-2"
          onClick={() => window.main.invoke("turnLightsOn")}
        >
          <div className="i-ion-sunny" />
          <div>On</div>
        </button>
        <button
          className="flex-1 b-none py-2 cursor-pointer bg-gray-100 hover:bg-gray-200 font-semibold flex items-center justify-center space-x-2"
          onClick={() => window.main.invoke("turnLightsOff")}
        >
          <div className="i-ion-moon" />
          <div>Off</div>
        </button>
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
          className="flex-1 b-none py-3 cursor-pointer bg-gray-100 font-semibold hover:bg-gray-200 flex items-center justify-center"
          disabled={generate.loading}
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
      </div>

      <div className="flex flex-col space-y-1">
        {themes.map((x, i) => (
          <div
            key={i}
            className="flex justify-between items-center b-1 b-gray-300 b-solid rounded-lg p-4 space-x-5 hover:bg-gray-50 cursor-pointer group"
            onClick={() => window.main.invoke("setLightingTheme", x)}
          >
            <div className="text-sm flex-1">{x.name}</div>
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
            <div className="hidden group-hover:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTheme(x.name);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
