import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useKeyboardShortcuts } from "@renderer/hooks";
import { useLighting, useLights, useClaude } from "@renderer/stores";

const tabs = [
  { icon: "i-bx-grid-alt", label: "Home", path: "/dashboard" },
  { icon: "i-bx-bulb", label: "Lights", path: "/lights" },
  { icon: "i-bx-palette", label: "Palettes", path: "/palettes" },
  { icon: "i-bx-cog", label: "Settings", path: "/settings" },
];

/** Tiny inline usage bar for the global header */
function MiniUsageBar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 90
      ? "bg-red-500"
      : value >= 75
        ? "bg-orange-500"
        : "bg-neutral-600";

  return (
    <div
      className="flex items-center space-x-1"
      title={`${label}: ${Math.round(value)}%`}
    >
      <div className="w-6 h-1 bg-[#222] rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full", color)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function DefaultLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const lighting = useLighting();
  const lights = useLights();
  const claude = useClaude();

  useKeyboardShortcuts();

  // Check Claude connection on mount so usage is available for the bars
  useEffect(() => {
    claude.checkConnection();
  }, []);

  const hasInfoRow = lighting.activeTheme || claude.usage;

  return (
    <div className="flex-1 flex flex-col w-full h-[100svh]">
      {/* Content area */}
      <div
        className={clsx(
          "flex-1 overflow-y-auto",
          hasInfoRow ? "pb-[104px]" : "pb-[82px]",
        )}
      >
        <Outlet />
      </div>

      {/* Global control bar — fixed above the tab bar */}
      <div
        className={clsx(
          "fixed left-0 right-0 z-50 bg-black border-t border-[#111]",
          hasInfoRow ? "bottom-14" : "bottom-14",
        )}
      >
        {/* Info row: palette name + Claude usage bars */}
        {hasInfoRow && (
          <div className="flex items-center justify-between px-3 pt-1.5 pb-0.5">
            <div className="flex items-center min-w-0 flex-1">
              {lighting.activeTheme && (
                <>
                  <div className="i-bx-palette text-[10px] text-neutral-600 mr-1" />
                  <span className="text-[10px] text-neutral-500 truncate">
                    {lighting.activeTheme.name}
                  </span>
                </>
              )}
            </div>
            {claude.usage && (
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <MiniUsageBar
                  value={claude.usage.fiveHour.utilization}
                  label="5hr"
                />
                <MiniUsageBar
                  value={claude.usage.sevenDay.utilization}
                  label="7d"
                />
              </div>
            )}
          </div>
        )}

        {/* Master brightness row */}
        <div className="flex items-center space-x-2 px-3 h-10">
          <button
            className="w-7 h-7 rounded-md bg-[#0a0a0a] hover:bg-[#1a1a1a] flex items-center justify-center transition-colors"
            onClick={() => window.main.invoke("turnLightsOn")}
          >
            <div className="i-bx-sun text-neutral-400 text-xs" />
          </button>
          <button
            className="w-7 h-7 rounded-md bg-[#0a0a0a] hover:bg-[#1a1a1a] flex items-center justify-center transition-colors"
            onClick={() => window.main.invoke("turnLightsOff")}
          >
            <div className="i-bx-moon text-neutral-400 text-xs" />
          </button>
          <input
            type="range"
            className="flex-1"
            value={lighting.relativeBrightness}
            min={0}
            max={1}
            step={0.01}
            onMouseDown={() => lights.setEditing(true)}
            onMouseUp={() => lights.setEditing(false)}
            onTouchStart={() => lights.setEditing(true)}
            onTouchEnd={() => lights.setEditing(false)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              lighting.setRelativeBrightness(value);
              lights.reapplyBrightness(value);
            }}
          />
          <span className="text-[10px] text-neutral-500 w-6 text-right tabular-nums">
            {Math.round(lighting.relativeBrightness * 100)}%
          </span>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-black border-t border-[#1a1a1a] flex items-center justify-around px-2">
        {tabs.map(({ icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              className={clsx(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer transition-colors",
                isActive
                  ? "text-white"
                  : "text-neutral-600 hover:text-neutral-400",
              )}
              onClick={() => navigate(path)}
            >
              <div className={clsx(icon, "text-xl")} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
