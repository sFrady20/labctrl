import clsx from "clsx";
import Color from "color";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAsync } from "react-async-hook";
import type { LightingTheme, AnimatedPalette } from "@main/services/lifx/types";
import { MusicMode } from "./MusicMode";
import { useNavigate } from "react-router";
import { ReactSortable } from "react-sortablejs";
import { useLighting, useMusicMode, useScenes } from "@renderer/stores";
import { AnimatedPaletteEditor } from "@renderer/components/lighting";
import { Collapsible } from "@renderer/components/ui";

function PasteButton(props: { onPaste?: (theme: LightingTheme) => void }) {
  const { onPaste } = props;
  const [hasPasted, setPasted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const theme = JSON.parse(
            await navigator.clipboard.readText()
          ) as LightingTheme;
          theme.id = Math.random().toString(32).substring(7);
          onPaste?.(theme);
          setPasted(true);
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => setPasted(false), 1000);
        } catch (err) {
          console.error("Failed to paste theme:", err);
        }
      }}
    >
      <div
        className={clsx(hasPasted ? "i-bx-check text-green" : "i-bx-paste")}
      />
    </button>
  );
}

export function CopyButton(props: { theme: LightingTheme }) {
  const { theme } = props;
  const [hasCopied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  return (
    <button
      className="p-2 rounded-md hover:bg-gray-800"
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

function FavoriteButton(props: { isFavorite?: boolean; onToggle: () => void }) {
  return (
    <button
      className="p-2 rounded-md hover:bg-gray-800"
      onClick={(e) => {
        e.stopPropagation();
        props.onToggle();
      }}
    >
      <div
        className={clsx(
          props.isFavorite ? "i-bx-bxs-star text-yellow-500" : "i-bx-star"
        )}
      />
    </button>
  );
}

export default function LightingPage() {
  const [topic, setTopic] = useState("");
  const [showAnimationEditor, setShowAnimationEditor] = useState(false);

  const lighting = useLighting();
  const musicMode = useMusicMode();
  const scenes = useScenes();
  const navigate = useNavigate();

  // Load scenes on mount
  useEffect(() => {
    scenes.loadScenes();
  }, []);

  // Filtered themes based on search, category, and favorites
  const filteredThemes = useMemo(() => {
    let result = lighting.themes;

    // Search filter
    if (lighting.searchQuery) {
      const query = lighting.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          t.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (lighting.selectedCategory) {
      result = result.filter((t) => t.category === lighting.selectedCategory);
    }

    // Favorites filter
    if (lighting.showFavoritesOnly) {
      result = result.filter((t) => t.isFavorite);
    }

    return result;
  }, [
    lighting.themes,
    lighting.searchQuery,
    lighting.selectedCategory,
    lighting.showFavoritesOnly,
  ]);

  const categories = lighting.getCategories();

  // Activate theme on mount
  useEffect(() => {
    if (lighting.activeTheme) lighting.activateTheme(lighting.activeTheme);
  }, []);

  const generate = useAsync(
    async (topic) => {
      const result = await window.main.invoke("textToLightingTheme", topic);
      if (result.status === "success") lighting.addTheme(result.theme, "generated");
    },
    [topic],
    { executeOnMount: false, executeOnUpdate: false }
  );

  const alter = useAsync(
    async (theme: LightingTheme | undefined, topic: string) => {
      if (!theme) return;
      const result = await window.main.invoke(
        "alterLightingTheme",
        theme,
        topic
      );
      if (result.status === "success") lighting.addTheme(result.theme, "generated");
    },
    [lighting.activeTheme, topic],
    { executeOnMount: false, executeOnUpdate: false }
  );

  return (
    <div className="flex-1 flex flex-col space-y-4 w-full">
      <div className="space-y-4 sticky top-0 bg-gray-950 z-100 p-4">
        <div className="flex flex-row space-x-3">
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => window.main.invoke("turnLightsOn")}
            >
              <div className="i-bx-bxs-sun" />
            </button>
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => window.main.invoke("turnLightsOff")}
            >
              <div className="i-bx-bxs-moon" />
            </button>
          </div>
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <PasteButton onPaste={(t) => lighting.addTheme(t, "imported")} />
          </div>
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => setShowAnimationEditor(true)}
              title="Create animated palette"
            >
              <div className="i-bx-movie-play" />
            </button>
            {lighting.isAnimating && (
              <button
                className="b-none px-4 h-10 cursor-pointer bg-orange-900 hover:bg-orange-800 font-semibold flex items-center justify-center space-x-2"
                onClick={() => lighting.stopAnimation()}
                title="Stop animation"
              >
                <div className="i-bx-stop" />
              </button>
            )}
          </div>
          <input
            type="range"
            className="flex-1"
            value={lighting.relativeBrightness}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => {
              lighting.setRelativeBrightness(parseFloat(e.target.value));
            }}
          />
          <div className="flex flex-row b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
            <button
              className="b-none px-4 h-10 cursor-pointer bg-gray-900 hover:bg-gray-800 font-semibold flex items-center justify-center space-x-2"
              onClick={() => navigate("/settings")}
            >
              <div className="i-bx-dots-horizontal-rounded" />
            </button>
          </div>
        </div>

        <Collapsible
          title="AI Generate"
          icon="i-bx-magic-wand"
          defaultOpen={false}
          badge={
            (generate.loading || alter.loading) && (
              <div className="i-svg-spinners-3-dots-fade text-blue-500" />
            )
          }
        >
          <div className="flex flex-col">
            <textarea
              placeholder="Write in a topic to generate or an alteration to the current theme..."
              disabled={generate.loading || alter.loading}
              className="p-4 b-none bg-gray-800 text-[#eee] text-sm disabled:opacity-60 min-h-16"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="flex flex-row">
              <button
                className="flex-1 h-10 cursor-pointer bg-gray-900 font-semibold hover:bg-gray-800 flex items-center justify-center disabled:opacity-60 disabled:hover-bg-gray-900 disabled:cursor-default"
                disabled={generate.loading || alter.loading}
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
              <button
                className="flex-1 h-10 cursor-pointer bg-gray-900 font-semibold hover:bg-gray-800 flex items-center justify-center disabled:opacity-60 disabled:hover-bg-gray-900 disabled:cursor-default"
                disabled={
                  generate.loading || alter.loading || !lighting.activeTheme
                }
                onClick={async () => {
                  alter.execute(lighting.activeTheme, topic);
                }}
              >
                {alter.loading ? (
                  <div className="i-svg-spinners-3-dots-fade" />
                ) : (
                  "Alter"
                )}
              </button>
            </div>
          </div>
        </Collapsible>

        <Collapsible
          title="Music Mode"
          icon="i-bx-bxl-spotify"
          defaultOpen={true}
          badge={
            musicMode.isActive && (
              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">
                Active
              </span>
            )
          }
        >
          <MusicMode />
        </Collapsible>

        {/* Quick Scene Buttons */}
        {scenes.scenes.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2">
            {scenes.scenes.map((scene) => (
              <button
                key={scene.id}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium"
                onClick={() => scenes.activateScene(scene.id)}
              >
                <div className={scene.icon} />
                <span>{scene.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-row space-x-2">
          <div className="flex-1 flex flex-row items-center bg-gray-900 rounded-lg px-3 space-x-2">
            <div className="i-bx-search text-gray-500" />
            <input
              type="text"
              placeholder="Search palettes..."
              className="flex-1 h-10 bg-transparent b-none text-sm text-white placeholder:text-gray-500"
              value={lighting.searchQuery}
              onChange={(e) => lighting.setSearchQuery(e.target.value)}
            />
            {lighting.searchQuery && (
              <button
                className="p-1 hover:bg-gray-800 rounded"
                onClick={() => lighting.setSearchQuery("")}
              >
                <div className="i-bx-x text-gray-500" />
              </button>
            )}
          </div>
          <button
            className={clsx(
              "px-3 h-10 rounded-lg flex items-center justify-center",
              lighting.showFavoritesOnly
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-gray-900 hover:bg-gray-800"
            )}
            onClick={() =>
              lighting.setShowFavoritesOnly(!lighting.showFavoritesOnly)
            }
          >
            <div
              className={clsx(
                lighting.showFavoritesOnly ? "i-bx-bxs-star" : "i-bx-star"
              )}
            />
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2">
            <button
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium",
                lighting.selectedCategory === null
                  ? "bg-blue-500 text-white"
                  : "bg-gray-900 hover:bg-gray-800"
              )}
              onClick={() => lighting.setSelectedCategory(null)}
            >
              All ({lighting.themes.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  lighting.selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-900 hover:bg-gray-800"
                )}
                onClick={() => lighting.setSelectedCategory(category)}
              >
                {category} (
                {lighting.themes.filter((t) => t.category === category).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme List */}
      <ReactSortable
        className="flex flex-col space-y-1 px-6 pb-4"
        list={filteredThemes}
        setList={(newList) => {
          // Only update if not filtered (to preserve order)
          if (!lighting.searchQuery && !lighting.selectedCategory && !lighting.showFavoritesOnly) {
            lighting.setThemes(newList);
          }
        }}
        animation={150}
        disabled={!!lighting.searchQuery || !!lighting.selectedCategory || lighting.showFavoritesOnly}
      >
        {filteredThemes.map((theme) => {
          const isAnimated = "type" in theme && (theme as AnimatedPalette).type === "animated";
          const isActive = lighting.activeTheme?.id === theme.id;
          const isCurrentlyAnimating = isActive && lighting.isAnimating;

          return (
          <div
            key={theme.id}
            className="flex justify-between items-center rounded-lg px-2 h-11 space-x-3 hover:bg-gray-900 cursor-pointer group"
            onClick={() => {
              lighting.activateTheme(theme);
              musicMode.deactivate(false);
            }}
          >
            {isActive && (
              <div className={clsx(
                isCurrentlyAnimating
                  ? "i-bx-loader-alt animate-spin text-blue-500"
                  : "i-bx-bxs-check-circle text-green-500"
              )} />
            )}
            {isAnimated && !isActive && (
              <div className="i-bx-movie-play text-purple-500" title="Animated" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {theme.name}
                {isAnimated && (
                  <span className="ml-2 text-xs text-purple-400">Animated</span>
                )}
              </div>
              {theme.category && (
                <div className="text-xs text-gray-500">{theme.category}</div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {theme.instructions.map((instr, j) => (
                <div
                  key={j}
                  className="rounded-full w-2 h-2"
                  style={{
                    backgroundColor: new Color(
                      [instr[1], instr[2], instr[3]].map(parseFloat),
                      "hsv"
                    ).hex(),
                  }}
                />
              ))}
            </div>
            <div className="hidden group-hover:flex items-center">
              <FavoriteButton
                isFavorite={theme.isFavorite}
                onToggle={() => lighting.toggleFavorite(theme.id)}
              />
              <CopyButton theme={theme} />
              <button
                className="p-2 rounded-md hover:bg-red-950"
                onClick={(e) => {
                  e.stopPropagation();
                  lighting.removeTheme(theme.id);
                }}
              >
                <div className="i-bx-trash text-red-500" />
              </button>
            </div>
          </div>
          );
        })}
      </ReactSortable>

      {/* Empty state */}
      {filteredThemes.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-2 pb-20">
          <div className="i-bx-palette text-4xl" />
          <div className="text-sm">
            {lighting.searchQuery || lighting.selectedCategory || lighting.showFavoritesOnly
              ? "No palettes match your filters"
              : "No palettes yet. Generate one above!"}
          </div>
        </div>
      )}

      {/* Animation Editor Modal */}
      {showAnimationEditor && (
        <AnimatedPaletteEditor
          baseTheme={lighting.activeTheme}
          onSave={(palette) => {
            lighting.addTheme(palette, "manual");
            setShowAnimationEditor(false);
          }}
          onCancel={() => setShowAnimationEditor(false)}
        />
      )}
    </div>
  );
}
