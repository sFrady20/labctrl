import clsx from "clsx";
import Color from "color";
import { useLights } from "@renderer/stores";
import { LightCard } from "./LightCard";
import { useState } from "react";
import type { LightState, LightGroup } from "@main/services/lifx/types";

interface Props {
  group: LightGroup;
  lights: LightState[];
  relativeBrightness: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GroupCard({
  group,
  lights,
  relativeBrightness,
  onEdit,
  onDelete,
}: Props) {
  const lightsStore = useLights();
  const [expanded, setExpanded] = useState(false);

  // Group brightness is a 0-1 dimmer stored on the group itself
  const groupBrightness = group.brightness ?? 1;
  const groupBrightnessPercent = Math.round(groupBrightness * 100);
  const isAnyOn = lights.some((l) => l.power);

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-3 h-12 space-x-3">
        {/* Expand toggle */}
        <button
          className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div
            className={clsx(
              "i-bx-chevron-down transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {/* Group name + count */}
        <div className="flex-1 flex items-center space-x-2 min-w-0">
          <span className="text-sm font-medium text-white truncate">
            {group.name}
          </span>
          <span className="text-[10px] text-neutral-600 bg-[#111] px-1.5 py-0.5 rounded-full">
            {lights.length}
          </span>
        </div>

        {/* Color swatches */}
        <div className="flex items-center space-x-1">
          {lights.slice(0, 8).map((l) => (
            <div
              key={l.id}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: new Color(
                  [l.hue, l.saturation, l.brightness],
                  "hsv",
                ).hex(),
              }}
            />
          ))}
          {lights.length > 8 && (
            <span className="text-[10px] text-neutral-600">
              +{lights.length - 8}
            </span>
          )}
        </div>

        {/* Power + Edit + Delete buttons */}
        <div className="flex items-center space-x-1">
          {/* Power toggle */}
          <button
            className={clsx(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
              isAnyOn
                ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-[#1a1a1a]",
            )}
            onClick={(e) => {
              e.stopPropagation();
              const lightIds = lights.map((l) => l.id);
              window.main.invoke("setLightsPower", lightIds, !isAnyOn);
            }}
          >
            <div className="i-bx-power-off text-xs" />
          </button>
          {onEdit && (
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-[#1a1a1a] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <div className="i-bx-edit-alt text-xs" />
            </button>
          )}
          {onDelete && (
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <div className="i-bx-trash text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Group brightness slider — acts as a group-level dimmer */}
      <div className="px-3 pb-2 flex items-center space-x-2">
        <div className="i-bx-sun text-[10px] text-neutral-600" />
        <input
          type="range"
          className="flex-1"
          min={0}
          max={100}
          value={groupBrightnessPercent}
          onMouseDown={() => lightsStore.setEditing(true)}
          onMouseUp={() => lightsStore.setEditing(false)}
          onTouchStart={() => lightsStore.setEditing(true)}
          onTouchEnd={() => lightsStore.setEditing(false)}
          onChange={(e) => {
            const newGroupBrightness = parseInt(e.target.value) / 100;
            lightsStore.setGroupBrightness(
              group.id,
              newGroupBrightness,
              relativeBrightness,
            );
          }}
        />
        <span className="text-[10px] text-neutral-500 w-7 text-right">
          {groupBrightnessPercent}%
        </span>
      </div>

      {/* Expanded: individual light cards */}
      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {lights.map((light) => (
            <LightCard
              key={light.id}
              light={light}
              relativeBrightness={relativeBrightness}
              groupBrightness={groupBrightness}
            />
          ))}
          {lights.length === 0 && (
            <div className="text-xs text-neutral-600 text-center py-4">
              No lights in this group
            </div>
          )}
        </div>
      )}
    </div>
  );
}
