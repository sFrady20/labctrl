import { useState, useMemo } from "react";
import clsx from "clsx";
import Color from "color";
import type {
  AnimatedPalette,
  AnimationEasing,
  LightingKeyframe,
  LightingTheme,
} from "@main/services/lifx/types";
import { useLighting } from "@renderer/stores";

interface Props {
  baseTheme?: LightingTheme;
  onSave: (palette: AnimatedPalette) => void;
  onCancel: () => void;
}

const EASING_OPTIONS: { value: AnimationEasing; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In-Out" },
];

const DURATION_PRESETS = [
  { value: 5000, label: "5s" },
  { value: 10000, label: "10s" },
  { value: 30000, label: "30s" },
  { value: 60000, label: "1m" },
  { value: 300000, label: "5m" },
];

export function AnimatedPaletteEditor({ baseTheme, onSave, onCancel }: Props) {
  const lighting = useLighting();

  const [name, setName] = useState(
    baseTheme ? `${baseTheme.name} (Animated)` : "New Animation",
  );
  const [duration, setDuration] = useState(10000);
  const [easing, setEasing] = useState<AnimationEasing>("linear");
  const [loop, setLoop] = useState(true);
  const [keyframes, setKeyframes] = useState<LightingKeyframe[]>(() => {
    if (baseTheme) {
      const shiftedInstructions = baseTheme.instructions.map((instr) => {
        const hue = parseFloat(instr[1]);
        const shiftedHue = (hue + 180) % 360;
        return [
          instr[0],
          String(shiftedHue),
          instr[2],
          instr[3],
          instr[4],
          instr[5],
        ];
      });
      return [
        { time: 0, instructions: baseTheme.instructions },
        { time: 0.5, instructions: shiftedInstructions },
      ];
    }
    return [];
  });

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState(0);

  const availableThemes = useMemo(() => lighting.themes, [lighting.themes]);

  const addKeyframeFromTheme = (theme: LightingTheme, time: number) => {
    const newKeyframe: LightingKeyframe = {
      time,
      instructions: theme.instructions,
    };
    setKeyframes((prev) =>
      [...prev, newKeyframe].sort((a, b) => a.time - b.time),
    );
  };

  const removeKeyframe = (index: number) => {
    if (keyframes.length <= 2) return;
    setKeyframes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateKeyframeTime = (index: number, time: number) => {
    setKeyframes((prev) =>
      prev
        .map((kf, i) => (i === index ? { ...kf, time } : kf))
        .sort((a, b) => a.time - b.time),
    );
  };

  const handlePreview = () => {
    if (keyframes.length < 2) return;
    const palette: AnimatedPalette = {
      id: "preview",
      name: "Preview",
      type: "animated",
      instructions: keyframes[0].instructions,
      keyframes,
      duration,
      easing,
      loop: true,
    };
    if (isPreviewing) {
      lighting.stopAnimation();
      setIsPreviewing(false);
    } else {
      lighting.startAnimation(palette);
      setIsPreviewing(true);
    }
  };

  const handleSave = () => {
    if (keyframes.length < 2) return;
    if (isPreviewing) {
      lighting.stopAnimation();
      setIsPreviewing(false);
    }
    const palette: AnimatedPalette = {
      id: Math.random().toString(32).substring(7),
      name,
      type: "animated",
      instructions: keyframes[0].instructions,
      keyframes,
      duration,
      easing,
      loop,
      category: "Animated",
      createdAt: Date.now(),
      source: "manual",
    };
    onSave(palette);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-200 p-4">
      <div className="bg-[#0a0a0a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[#1a1a1a]">
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center">
          <h2 className="text-lg font-semibold">Create Animated Palette</h2>
          <button
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
            onClick={onCancel}
          >
            <div className="i-bx-x" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Name</label>
            <input
              type="text"
              className="w-full h-10 px-3 bg-[#111] rounded-lg text-sm border border-[#1a1a1a]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm text-neutral-500 mb-1">
              Duration
            </label>
            <div className="flex space-x-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={clsx(
                    "flex-1 h-10 rounded-lg text-sm font-medium transition-colors",
                    duration === preset.value
                      ? "bg-blue-500 text-white"
                      : "bg-[#111] hover:bg-[#1a1a1a]",
                  )}
                  onClick={() => setDuration(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Easing & Loop */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm text-neutral-500 mb-1">
                Easing
              </label>
              <select
                className="w-full h-10 px-3 bg-[#111] rounded-lg text-sm border border-[#1a1a1a]"
                value={easing}
                onChange={(e) => setEasing(e.target.value as AnimationEasing)}
              >
                {EASING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 h-10 px-3 bg-[#111] rounded-lg cursor-pointer border border-[#1a1a1a]">
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                />
                <span className="text-sm">Loop</span>
              </label>
            </div>
          </div>

          {/* Keyframes Timeline */}
          <div>
            <label className="block text-sm text-neutral-500 mb-2">
              Keyframes ({keyframes.length})
            </label>
            <div className="relative h-16 bg-[#111] rounded-lg mb-2">
              <div className="absolute inset-x-4 top-1/2 h-0.5 bg-[#222] rounded -translate-y-1/2" />
              {keyframes.map((kf, index) => (
                <button
                  key={index}
                  className={clsx(
                    "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-colors",
                    selectedKeyframeIndex === index
                      ? "border-blue-500 bg-blue-500/30"
                      : "border-neutral-600 bg-[#1a1a1a]",
                  )}
                  style={{ left: `${kf.time * 100}%`, marginLeft: "1rem" }}
                  onClick={() => setSelectedKeyframeIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Keyframe list */}
            <div className="space-y-1">
              {keyframes.map((kf, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer",
                    selectedKeyframeIndex === index
                      ? "bg-[#111]"
                      : "hover:bg-[#0d0d0d]",
                  )}
                  onClick={() => setSelectedKeyframeIndex(index)}
                >
                  <span className="text-sm text-neutral-600 w-6">
                    {index + 1}
                  </span>
                  <div className="flex items-center space-x-1">
                    {kf.instructions.map((instr, j) => (
                      <div
                        key={j}
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: new Color(
                            [instr[1], instr[2], instr[3]].map(parseFloat),
                            "hsv",
                          ).hex(),
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    className="flex-1"
                    min={0}
                    max={1}
                    step={0.05}
                    value={kf.time}
                    onChange={(e) =>
                      updateKeyframeTime(index, parseFloat(e.target.value))
                    }
                  />
                  <span className="text-sm text-neutral-500 w-12 text-right">
                    {Math.round(kf.time * 100)}%
                  </span>
                  <button
                    className="p-1 hover:bg-red-500/10 rounded disabled:opacity-30 transition-colors"
                    disabled={keyframes.length <= 2}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKeyframe(index);
                    }}
                  >
                    <div className="i-bx-trash text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add keyframe from theme */}
          <div>
            <label className="block text-sm text-neutral-500 mb-2">
              Add Keyframe from Palette
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableThemes.slice(0, 20).map((theme) => (
                <button
                  key={theme.id}
                  className="flex items-center space-x-2 p-2 bg-[#111] hover:bg-[#1a1a1a] rounded-lg text-left transition-colors"
                  onClick={() => {
                    const lastTime =
                      keyframes.length > 0
                        ? keyframes[keyframes.length - 1].time
                        : 0;
                    const newTime = Math.min(1, lastTime + (1 - lastTime) / 2);
                    addKeyframeFromTheme(theme, newTime);
                  }}
                >
                  <div className="flex items-center space-x-1">
                    {theme.instructions.slice(0, 4).map((instr, j) => (
                      <div
                        key={j}
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: new Color(
                            [instr[1], instr[2], instr[3]].map(parseFloat),
                            "hsv",
                          ).hex(),
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1a1a1a] flex justify-between">
          <button
            className={clsx(
              "px-4 h-10 rounded-lg font-medium flex items-center space-x-2 transition-colors",
              isPreviewing
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-[#111] hover:bg-[#1a1a1a]",
            )}
            onClick={handlePreview}
            disabled={keyframes.length < 2}
          >
            <div className={isPreviewing ? "i-bx-stop" : "i-bx-play"} />
            <span>{isPreviewing ? "Stop" : "Preview"}</span>
          </button>
          <div className="flex space-x-2">
            <button
              className="px-4 h-10 bg-[#111] hover:bg-[#1a1a1a] rounded-lg font-medium transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50 transition-colors"
              onClick={handleSave}
              disabled={keyframes.length < 2 || !name.trim()}
            >
              Save Animation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
