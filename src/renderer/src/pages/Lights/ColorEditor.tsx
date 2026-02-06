import { useState } from "react";
import Color from "color";
import { useLights } from "@renderer/stores";

interface Props {
  lightId: string;
  hue: number;
  saturation: number;
  brightness: number;
  kelvin: number;
  relativeBrightness: number;
  groupBrightness: number;
  onClose: () => void;
}

export function ColorEditor({
  lightId,
  hue: initialHue,
  saturation: initialSaturation,
  brightness: initialBrightness,
  kelvin: initialKelvin,
  relativeBrightness,
  groupBrightness,
  onClose,
}: Props) {
  const lights = useLights();

  const [hue, setHue] = useState(initialHue);
  const [saturation, setSaturation] = useState(initialSaturation);
  const [brightness, setBrightness] = useState(initialBrightness);
  const [kelvin, setKelvin] = useState(initialKelvin);

  const previewColor = new Color([hue, saturation, brightness], "hsv").hex();

  const handleApply = () => {
    lights.setSingleLight(
      lightId,
      hue,
      saturation,
      brightness,
      kelvin,
      relativeBrightness,
      groupBrightness,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-200 flex items-end justify-center">
      <div className="bg-[#0a0a0a] rounded-t-2xl w-full max-w-md border-t border-x border-[#1a1a1a] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-white">Edit Color</h3>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-[#1a1a1a] transition-colors"
            onClick={onClose}
          >
            <div className="i-bx-x" />
          </button>
        </div>

        {/* Color preview circle */}
        <div className="flex justify-center py-4">
          <div
            className="w-20 h-20 rounded-full border-2 border-[#1a1a1a]"
            style={{ backgroundColor: previewColor }}
          />
        </div>

        {/* Sliders */}
        <div className="px-4 space-y-4">
          {/* Hue */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500">Hue</label>
              <span className="text-xs text-neutral-600">
                {Math.round(hue)}&deg;
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => setHue(parseFloat(e.target.value))}
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500">Saturation</label>
              <span className="text-xs text-neutral-600">
                {Math.round(saturation)}%
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={0}
              max={100}
              value={saturation}
              onChange={(e) => setSaturation(parseFloat(e.target.value))}
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500">Brightness</label>
              <span className="text-xs text-neutral-600">
                {Math.round(brightness)}%
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={0}
              max={100}
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
            />
          </div>

          {/* Kelvin */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500">
                Kelvin
                <span className="text-neutral-700 ml-1">warm &mdash; cool</span>
              </label>
              <span className="text-xs text-neutral-600">{kelvin}K</span>
            </div>
            <input
              type="range"
              className="w-full"
              min={1500}
              max={9000}
              step={100}
              value={kelvin}
              onChange={(e) => setKelvin(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 px-4 pt-5 pb-4">
          <button
            className="flex-1 h-10 rounded-lg bg-[#111] hover:bg-[#1a1a1a] text-sm font-medium text-neutral-400 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white transition-colors"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
