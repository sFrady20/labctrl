import clsx from "clsx";
import Color from "color";
import { useState, useRef } from "react";
import { useLighting, useMusicMode } from "@renderer/stores";
import type { LightingTheme } from "@main/services/lifx/types";

function SaveButton(props: {
  theme: LightingTheme;
  onSave: (theme: LightingTheme) => void;
}) {
  const { theme, onSave } = props;
  const [hasSaved, setSaved] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onSave(theme);
        setSaved(true);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setSaved(false), 1000);
      }}
    >
      <div
        className={clsx(hasSaved ? "i-bx-check text-green-500" : "i-bx-save")}
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
      className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(JSON.stringify(theme));
        setCopied(true);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setCopied(false), 1000);
      }}
    >
      <div
        className={clsx(hasCopied ? "i-bx-check text-green-500" : "i-bx-copy")}
      />
    </button>
  );
}

export function MusicMode() {
  const lighting = useLighting();
  const musicMode = useMusicMode();

  return (
    <div className="rounded-xl overflow-hidden">
      <div
        className={clsx(
          "bg-[#0a0a0a] px-3 h-20 border border-[#1a1a1a] flex flex-row items-center space-x-3 group",
        )}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div
            className="flex items-center justify-center w-14 h-14 bg-black rounded-lg bg-cover"
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
              <div className="font-semibold text-sm text-white">
                {musicMode.playing.title}
              </div>
              <div className="text-xs text-neutral-500">
                {musicMode.playing.artist}
              </div>
            </div>
          ) : (
            <div className="font-semibold text-white">Music mode</div>
          )}
        </div>
        <div className="space-x-1 flex">
          <div
            className="w-8 h-8 hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            onClick={() => {
              window.main.invoke(
                "toggleSongPlayingOnSpotify",
                !musicMode.playing?.isPlaying,
              );
            }}
          >
            <div
              className={
                musicMode.playing?.isPlaying ? "i-bx-pause" : "i-bx-play"
              }
            />
          </div>
          <div
            className="w-8 h-8 hover:bg-[#1a1a1a] rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            onClick={() => {
              window.main.invoke("skipToNextSongOnSpotify");
            }}
          >
            <div className="i-bx-skip-next" />
          </div>
        </div>
        <div
          className={clsx(
            "flex flex-row space-x-2 h-11 w-11 items-center justify-center rounded-lg transition-colors",
            musicMode.isBusy
              ? "cursor-wait opacity-60"
              : "cursor-pointer hover:bg-[#1a1a1a]",
          )}
          onClick={() =>
            musicMode.isBusy
              ? undefined
              : musicMode.isActive
                ? musicMode.deactivate()
                : musicMode.activate()
          }
        >
          <div
            className={clsx(
              "text-[24px]",
              musicMode.isBusy
                ? "i-svg-spinners-3-dots-fade"
                : musicMode.isActive
                  ? "i-bx-checkbox-checked"
                  : "i-bx-checkbox",
              {
                "text-green-500": musicMode.isActive && !musicMode.isBusy,
              },
            )}
          />
        </div>
      </div>
      {lighting.activeTheme &&
        musicMode.playing &&
        lighting.activeTheme.spotifySongId === musicMode.playing.id && (
          <div className="bg-black px-4 h-11 flex flex-row items-center group space-x-2 border-t border-[#1a1a1a]">
            <div className="flex-1 text-xs font-semibold text-white">
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
                      "hsv",
                    ).hex(),
                  }}
                />
              ))}
            </div>
            <div className="flex-row space-x-1 flex">
              {!lighting.themes.some(
                (t) => t.id === lighting.activeTheme?.id,
              ) && (
                <SaveButton
                  theme={lighting.activeTheme}
                  onSave={(theme) => {
                    lighting.addTheme({
                      ...theme,
                      id: Math.random().toString(32).substring(7),
                    });
                  }}
                />
              )}
              <CopyButton theme={lighting.activeTheme} />
            </div>
          </div>
        )}
    </div>
  );
}
