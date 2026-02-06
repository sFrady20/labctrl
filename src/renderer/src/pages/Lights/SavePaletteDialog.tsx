import { useState } from "react";
import type { LightState, LightingTheme } from "@main/services/lifx/types";

interface Props {
  lightStates: LightState[];
  activePaletteName?: string;
  activeThemeId?: string;
  onSave: (theme: LightingTheme, updateExisting: boolean) => void;
  onCancel: () => void;
}

export function SavePaletteDialog({
  lightStates,
  activePaletteName,
  activeThemeId,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState(activePaletteName ?? "Custom Palette");

  const buildTheme = (): LightingTheme => ({
    id: Math.random().toString(32).substring(7),
    name,
    instructions: lightStates.map((l) => [
      l.lifxId,
      String(l.hue),
      String(l.saturation),
      String(l.brightness),
      String(l.kelvin),
      "300",
    ]),
    source: "manual",
    createdAt: Date.now(),
  });

  return (
    <div className="fixed inset-0 bg-black/90 z-200 flex items-end justify-center">
      <div className="bg-[#0a0a0a] rounded-t-2xl w-full max-w-md border-t border-x border-[#1a1a1a] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-white">Save as Palette</h3>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-[#1a1a1a] transition-colors"
            onClick={onCancel}
          >
            <div className="i-bx-x" />
          </button>
        </div>

        {/* Name input */}
        <div className="px-4 pt-2 pb-4">
          <label className="block text-xs text-neutral-500 mb-1">
            Palette Name
          </label>
          <input
            type="text"
            className="w-full h-10 px-3 bg-[#111] rounded-lg text-sm text-white border border-[#1a1a1a] placeholder:text-neutral-600"
            placeholder="My Palette"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Light preview */}
        <div className="px-4 pb-4">
          <div className="text-xs text-neutral-600 mb-1">
            {lightStates.length} light{lightStates.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 px-4 pb-4">
          <button
            className="flex-1 h-10 rounded-lg bg-[#111] hover:bg-[#1a1a1a] text-sm font-medium text-neutral-400 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white transition-colors disabled:opacity-40"
            disabled={!name.trim()}
            onClick={() => onSave(buildTheme(), false)}
          >
            Save as New
          </button>
          <button
            className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-medium text-white transition-colors disabled:opacity-40"
            disabled={!activeThemeId || !name.trim()}
            onClick={() => onSave(buildTheme(), true)}
          >
            Update Current
          </button>
        </div>
      </div>
    </div>
  );
}
