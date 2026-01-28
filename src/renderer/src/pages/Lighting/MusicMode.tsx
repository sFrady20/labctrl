import clsx from "clsx";
import Color from "color";
import { useState, useRef } from "react";
import { useLighting, useMusicMode } from "@renderer/stores";
import { CopyButton } from ".";
import type { LightingTheme } from "@main/services/Lifx/types";

function SaveButton(props: { theme: LightingTheme; onSave: (theme: LightingTheme) => void }) {
  const { theme, onSave } = props;
  const [hasSaved, setSaved] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="p-2 rounded-md hover:bg-gray-800"
      onClick={(e) => {
        e.stopPropagation();
        onSave(theme);
        setSaved(true);
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setSaved(false), 1000);
      }}
    >
      <div
        className={clsx(hasSaved ? "i-bx-check text-green" : "i-bx-save")}
      />
    </button>
  );
}

export function MusicMode() {
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
              <div className="font-semibold text-sm">{musicMode.playing.title}</div>
              <div className="text-xs">{musicMode.playing.artist}</div>
            </div>
          ) : (
            <div className="font-semibold">Music mode</div>
          )}
        </div>
        <div className="space-x-1 flex">
          <div
            className="w-8 h-8 hover:bg-gray-800 rounded-md flex items-center justify-center cursor-pointer"
            onClick={() => {
              window.main.invoke(
                "toggleSongPlayingOnSpotify",
                !musicMode.playing?.isPlaying
              );
            }}
          >
            <div className={musicMode.playing?.isPlaying ? "i-bx-pause" : "i-bx-play"} />
          </div>
          <div
            className="w-8 h-8 hover:bg-gray-800 rounded-md flex items-center justify-center cursor-pointer"
            onClick={() => {
              window.main.invoke("skipToNextSongOnSpotify");
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
            <div className="flex-row space-x-1 flex">
              {!lighting.themes.some((t) => t.id === lighting.activeTheme?.id) && (
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
