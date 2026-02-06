import { useEffect, useState } from "react";
import { useLights, useLighting } from "@renderer/stores";
import { LightCard } from "./LightCard";
import { GroupCard } from "./GroupCard";
import { GroupEditor } from "./GroupEditor";
import { SavePaletteDialog } from "./SavePaletteDialog";

export default function LightsPage() {
  const lights = useLights();
  const lighting = useLighting();
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [showSavePalette, setShowSavePalette] = useState(false);

  // Poll light states
  useEffect(() => {
    lights.pollLights();
    const interval = setInterval(() => {
      if (!lights.isEditing) {
        lights.pollLights();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get ungrouped lights
  const groupedLightIds = new Set(lights.groups.flatMap((g) => g.lightIds));
  const ungroupedLights = lights.lightStates.filter(
    (l) => !groupedLightIds.has(l.id),
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Action bar */}
      <div className="sticky top-0 bg-black z-40 px-4 py-2 flex items-center justify-between border-b border-[#0a0a0a]">
        <button
          className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center space-x-1 transition-colors"
          onClick={() => {
            setEditingGroup(null);
            setShowGroupEditor(true);
          }}
        >
          <div className="i-bx-plus text-sm" />
          <span>New Group</span>
        </button>
        {lights.hasManualEdits && (
          <button
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors"
            onClick={() => setShowSavePalette(true)}
          >
            <div className="i-bx-save text-sm" />
            <span>Save as Palette</span>
          </button>
        )}
      </div>

      {/* Light groups & individual lights */}
      <div className="flex-1 p-4 space-y-3">
        {/* Custom groups */}
        {lights.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            lights={lights.lightStates.filter((l) =>
              group.lightIds.includes(l.id),
            )}
            relativeBrightness={lighting.relativeBrightness}
            onEdit={() => {
              setEditingGroup(group.id);
              setShowGroupEditor(true);
            }}
            onDelete={() => lights.removeGroup(group.id)}
          />
        ))}

        {/* Ungrouped lights */}
        {ungroupedLights.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-neutral-600 uppercase tracking-wider px-1">
              Ungrouped
            </div>
            {ungroupedLights.map((light) => (
              <LightCard
                key={light.id}
                light={light}
                relativeBrightness={lighting.relativeBrightness}
                groupBrightness={1}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {lights.lightStates.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 space-y-2 py-20">
            <div className="i-bx-bulb text-3xl" />
            <div className="text-sm">No lights found</div>
            <div className="text-xs text-neutral-700">
              Make sure your LIFX lights are on the network
            </div>
          </div>
        )}
      </div>

      {/* Group Editor Modal */}
      {showGroupEditor && (
        <GroupEditor
          groupId={editingGroup}
          availableLights={lights.lightStates}
          existingGroups={lights.groups}
          onSave={(group) => {
            if (editingGroup) {
              lights.updateGroup(editingGroup, group);
            } else {
              lights.addGroup({
                ...group,
                id: Math.random().toString(32).substring(7),
                brightness: 1,
              });
            }
            setShowGroupEditor(false);
          }}
          onCancel={() => setShowGroupEditor(false)}
        />
      )}

      {/* Save Palette Dialog */}
      {showSavePalette && (
        <SavePaletteDialog
          lightStates={lights.lightStates}
          activePaletteName={lighting.activeTheme?.name}
          activeThemeId={lighting.activeTheme?.id}
          onSave={(theme, updateExisting) => {
            if (updateExisting && lighting.activeTheme) {
              lighting.updateTheme(lighting.activeTheme.id, {
                instructions: theme.instructions,
                name: theme.name,
              });
            } else {
              lighting.addTheme(theme, "manual");
            }
            lights.clearManualEdits();
            setShowSavePalette(false);
          }}
          onCancel={() => setShowSavePalette(false)}
        />
      )}
    </div>
  );
}
