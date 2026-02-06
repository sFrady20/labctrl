import { useState } from "react";
import clsx from "clsx";
import Color from "color";
import { useLights } from "@renderer/stores";
import { ColorEditor } from "./ColorEditor";
import type { LightState } from "@main/services/lifx/types";

interface Props {
  light: LightState;
  relativeBrightness: number;
  groupBrightness: number;
}

export function LightCard({
  light,
  relativeBrightness,
  groupBrightness,
}: Props) {
  const lights = useLights();
  const [showColorEditor, setShowColorEditor] = useState(false);

  const colorHex = new Color(
    [light.hue, light.saturation, light.brightness],
    "hsv",
  ).hex();

  const brightnessPercent = Math.round(light.brightness);

  return (
    <>
      <div className="bg-[#0a0a0a] rounded-xl p-3 space-y-2 border border-[#1a1a1a]">
        {/* Top row: label, online dot, power toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div
              className={clsx(
                "w-2 h-2 rounded-full flex-shrink-0",
                light.online ? "bg-green-500" : "bg-neutral-700",
              )}
            />
            <span className="text-sm font-medium text-white truncate">
              {light.label}
            </span>
          </div>
          <button
            className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              light.power
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-[#111] text-neutral-600 hover:bg-[#1a1a1a]",
            )}
            onClick={() => {
              if (light.power) {
                window.main.invoke("turnLightsOff");
              } else {
                window.main.invoke("turnLightsOn");
              }
            }}
          >
            <div className="i-bx-power-off text-sm" />
          </button>
        </div>

        {/* Color swatch + brightness slider row */}
        <div className="flex items-center space-x-3">
          {/* Color swatch — opens color editor */}
          <button
            className="w-8 h-8 rounded-lg flex-shrink-0 border border-[#1a1a1a] transition-colors hover:border-neutral-500 cursor-pointer"
            style={{ backgroundColor: colorHex }}
            onClick={() => setShowColorEditor(true)}
          />

          {/* Brightness slider — controls individual brightness */}
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="range"
              className="flex-1"
              min={0}
              max={100}
              value={brightnessPercent}
              onMouseDown={() => lights.setEditing(true)}
              onMouseUp={() => lights.setEditing(false)}
              onTouchStart={() => lights.setEditing(true)}
              onTouchEnd={() => lights.setEditing(false)}
              onChange={(e) => {
                const newBrightness = parseInt(e.target.value);
                lights.setSingleLight(
                  light.id,
                  light.hue,
                  light.saturation,
                  newBrightness,
                  light.kelvin,
                  relativeBrightness,
                  groupBrightness,
                );
              }}
            />
            <span className="text-[10px] text-neutral-500 w-7 text-right">
              {brightnessPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Color Editor Modal */}
      {showColorEditor && (
        <ColorEditor
          lightId={light.id}
          hue={light.hue}
          saturation={light.saturation}
          brightness={light.brightness}
          kelvin={light.kelvin}
          relativeBrightness={relativeBrightness}
          groupBrightness={groupBrightness}
          onClose={() => setShowColorEditor(false)}
        />
      )}
    </>
  );
}
