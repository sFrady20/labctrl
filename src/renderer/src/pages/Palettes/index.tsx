import clsx from "clsx";
import Color from "color";
import { useState, useEffect, useMemo } from "react";
import { useAsync } from "react-async-hook";
import type { LightingTheme, AnimatedPalette } from "@main/services/lifx/types";
import { ReactSortable } from "react-sortablejs";
import { useLighting, useMusicMode } from "@renderer/stores";
import { AnimatedPaletteEditor } from "@renderer/components/lighting";
import { Collapsible } from "@renderer/components/ui";

function PasteButton(props: { onPaste?: (theme: LightingTheme) => void }) {
  const { onPaste } = props;
  const [hasPasted, setPasted] = useState(false);
  const intervalRef = useState<NodeJS.Timeout | undefined>(undefined);

  return (
    <button
      className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors text-neutral-400"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const theme = JSON.parse(
            await navigator.clipboard.readText(),
          ) as LightingTheme;
          theme.id = Math.random().toString(32).substring(7);
          onPaste?.(theme);
          setPasted(true);
          if (intervalRef[0]) clearInterval(intervalRef[0]);
          const t = setInterval(() => setPasted(false), 1000);
          intervalRef[1](t);
        } catch (err) {
          console.error("Failed to paste theme:", err);
        }
      }}
    >
      <div
        className={clsx(hasPasted ? "i-bx-check text-green-500" : "i-bx-paste")}
      />
    </button>
  );
}

function CopyButton(props: { theme: LightingTheme }) {
  const { theme } = props;
  const [hasCopied, setCopied] = useState(false);
  const intervalRef = useState<NodeJS.Timeout | undefined>(undefined);

  return (
    <button
      className="p-2 rounded-md hover:bg-[#1a1a1a] transition-colors"
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(JSON.stringify(theme));
        setCopied(true);
        if (intervalRef[0]) clearInterval(intervalRef[0]);
        const t = setInterval(() => setCopied(false), 1000);
        intervalRef[1](t);
      }}
    >
      <div
        className={clsx(
          hasCopied ? "i-bx-check text-green-500" : "i-bx-copy",
          "text-neutral-500",
        )}
      />
    </button>
  );
}

function FavoriteButton(props: { isFavorite?: boolean; onToggle: () => void }) {
  return (
    <button
      className="p-2 rounded-md hover:bg-[#1a1a1a] transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        props.onToggle();
      }}
    >
      <div
        className={clsx(
          props.isFavorite
            ? "i-bx-bxs-star text-yellow-500"
            : "i-bx-star text-neutral-600",
        )}
      />
    </button>
  );
}

export default function PalettesPage() {
  const [topic, setTopic] = useState("");
  const [showAnimationEditor, setShowAnimationEditor] = useState(false);

  const lighting = useLighting();
  const musicMode = useMusicMode();

  // Activate theme on mount
  useEffect(() => {
    if (lighting.activeTheme) lighting.activateTheme(lighting.activeTheme);
  }, []);

  // Filtered themes
  const filteredThemes = useMemo(() => {
    let result = lighting.themes;
    if (lighting.searchQuery) {
      const query = lighting.searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          t.category?.toLowerCase().includes(query),
      );
    }
    if (lighting.selectedCategory) {
      result = result.filter((t) => t.category === lighting.selectedCategory);
    }
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

  const generate = useAsync(
    async (topic) => {
      const result = await window.main.invoke("textToLightingTheme", topic);
      if (result.status === "success")
        lighting.addTheme(result.theme, "generated");
    },
    [topic],
    { executeOnMount: false, executeOnUpdate: false },
  );

  const alter = useAsync(
    async (theme: LightingTheme | undefined, topic: string) => {
      if (!theme) return;
      const result = await window.main.invoke(
        "alterLightingTheme",
        theme,
        topic,
      );
      if (result.status === "success")
        lighting.addTheme(result.theme, "generated");
    },
    [lighting.activeTheme, topic],
    { executeOnMount: false, executeOnUpdate: false },
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Sticky header area */}
      <div className="sticky top-0 bg-black z-40 p-4 space-y-3">
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <PasteButton onPaste={(t) => lighting.addTheme(t, "imported")} />
          <button
            className="h-8 px-3 rounded-lg bg-[#0a0a0a] hover:bg-[#111] flex items-center space-x-1.5 transition-colors text-sm"
            onClick={() => setShowAnimationEditor(true)}
          >
            <div className="i-bx-movie-play text-neutral-400" />
          </button>
          {lighting.isAnimating && (
            <button
              className="h-8 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 flex items-center space-x-1.5 transition-colors text-sm text-orange-500"
              onClick={() => lighting.stopAnimation()}
            >
              <div className="i-bx-stop" />
            </button>
          )}
        </div>

        {/* AI Generate */}
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
              placeholder="Topic to generate, or alteration to current theme..."
              disabled={generate.loading || alter.loading}
              className="p-4 bg-[#0a0a0a] text-white text-sm disabled:opacity-60 min-h-16 border-none resize-none"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="flex flex-row">
              <button
                className="flex-1 h-10 cursor-pointer bg-[#0a0a0a] font-semibold hover:bg-[#111] flex items-center justify-center disabled:opacity-60 disabled:cursor-default transition-colors text-sm"
                disabled={generate.loading || alter.loading}
                onClick={() => generate.execute(topic)}
              >
                {generate.loading ? (
                  <div className="i-svg-spinners-3-dots-fade" />
                ) : (
                  "Generate"
                )}
              </button>
              <button
                className="flex-1 h-10 cursor-pointer bg-[#0a0a0a] font-semibold hover:bg-[#111] flex items-center justify-center disabled:opacity-60 disabled:cursor-default transition-colors text-sm"
                disabled={
                  generate.loading || alter.loading || !lighting.activeTheme
                }
                onClick={() => alter.execute(lighting.activeTheme, topic)}
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

        {/* Search and Filter */}
        <div className="flex flex-row space-x-2">
          <div className="flex-1 flex flex-row items-center bg-[#0a0a0a] rounded-lg px-3 space-x-2">
            <div className="i-bx-search text-neutral-600" />
            <input
              type="text"
              placeholder="Search palettes..."
              className="flex-1 h-9 bg-transparent border-none text-sm text-white placeholder:text-neutral-600"
              value={lighting.searchQuery}
              onChange={(e) => lighting.setSearchQuery(e.target.value)}
            />
            {lighting.searchQuery && (
              <button
                className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
                onClick={() => lighting.setSearchQuery("")}
              >
                <div className="i-bx-x text-neutral-600" />
              </button>
            )}
          </div>
          <button
            className={clsx(
              "px-3 h-9 rounded-lg flex items-center justify-center transition-colors",
              lighting.showFavoritesOnly
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-[#0a0a0a] hover:bg-[#111] text-neutral-500",
            )}
            onClick={() =>
              lighting.setShowFavoritesOnly(!lighting.showFavoritesOnly)
            }
          >
            <div
              className={clsx(
                lighting.showFavoritesOnly ? "i-bx-bxs-star" : "i-bx-star",
              )}
            />
          </button>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-row flex-wrap gap-1.5">
            <button
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                lighting.selectedCategory === null
                  ? "bg-blue-500 text-white"
                  : "bg-[#0a0a0a] hover:bg-[#111] text-neutral-400",
              )}
              onClick={() => lighting.setSelectedCategory(null)}
            >
              All ({lighting.themes.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  lighting.selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-[#0a0a0a] hover:bg-[#111] text-neutral-400",
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
        className="flex flex-col space-y-0.5 px-4 pb-4"
        list={filteredThemes}
        setList={(newList) => {
          if (
            !lighting.searchQuery &&
            !lighting.selectedCategory &&
            !lighting.showFavoritesOnly
          ) {
            lighting.setThemes(newList);
          }
        }}
        animation={150}
        disabled={
          !!lighting.searchQuery ||
          !!lighting.selectedCategory ||
          lighting.showFavoritesOnly
        }
      >
        {filteredThemes.map((theme) => {
          const isAnimated =
            "type" in theme && (theme as AnimatedPalette).type === "animated";
          const isActive = lighting.activeTheme?.id === theme.id;
          const isCurrentlyAnimating = isActive && lighting.isAnimating;

          return (
            <div
              key={theme.id}
              className={clsx(
                "flex justify-between items-center rounded-lg px-3 h-11 space-x-3 cursor-pointer group transition-colors",
                isActive ? "bg-[#0a0a0a]" : "hover:bg-[#0a0a0a]",
              )}
              onClick={() => {
                lighting.activateTheme(theme);
                musicMode.deactivate(false);
              }}
            >
              {isActive && (
                <div
                  className={clsx(
                    isCurrentlyAnimating
                      ? "i-bx-loader-alt animate-spin text-blue-500"
                      : "i-bx-bxs-check-circle text-green-500",
                    "flex-shrink-0",
                  )}
                />
              )}
              {isAnimated && !isActive && (
                <div className="i-bx-movie-play text-purple-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {theme.name}
                  {isAnimated && (
                    <span className="ml-2 text-xs text-purple-400">
                      Animated
                    </span>
                  )}
                </div>
                {theme.category && (
                  <div className="text-[10px] text-neutral-600">
                    {theme.category}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-0.5">
                {theme.instructions.map((instr, j) => (
                  <div
                    key={j}
                    className="rounded-full w-2 h-2"
                    style={{
                      backgroundColor: new Color(
                        [instr[1], instr[2], instr[3]].map(parseFloat),
                        "hsv",
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
                  className="p-2 rounded-md hover:bg-red-500/10 transition-colors"
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
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 space-y-2 pb-20">
          <div className="i-bx-palette text-4xl" />
          <div className="text-sm">
            {lighting.searchQuery ||
            lighting.selectedCategory ||
            lighting.showFavoritesOnly
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
