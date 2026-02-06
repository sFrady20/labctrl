import { useState, useMemo } from "react";
import clsx from "clsx";
import type { LightState, LightGroup } from "@main/services/lifx/types";

interface Props {
  groupId: string | null;
  availableLights: LightState[];
  existingGroups: LightGroup[];
  onSave: (group: { name: string; lightIds: string[] }) => void;
  onCancel: () => void;
}

export function GroupEditor({
  groupId,
  availableLights,
  existingGroups,
  onSave,
  onCancel,
}: Props) {
  const editingGroup = useMemo(
    () => (groupId ? existingGroups.find((g) => g.id === groupId) : null),
    [groupId, existingGroups],
  );

  const [name, setName] = useState(editingGroup?.name ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(editingGroup?.lightIds ?? []),
  );

  const toggleLight = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim() || selectedIds.size === 0) return;
    onSave({ name: name.trim(), lightIds: Array.from(selectedIds) });
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-200 flex items-end justify-center">
      <div className="bg-[#0a0a0a] rounded-t-2xl w-full max-w-md border-t border-x border-[#1a1a1a] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-white">
            {groupId ? "Edit Group" : "New Group"}
          </h3>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-[#1a1a1a] transition-colors"
            onClick={onCancel}
          >
            <div className="i-bx-x" />
          </button>
        </div>

        {/* Name input */}
        <div className="px-4 pt-2 pb-3">
          <label className="block text-xs text-neutral-500 mb-1">
            Group Name
          </label>
          <input
            type="text"
            className="w-full h-10 px-3 bg-[#111] rounded-lg text-sm text-white border border-[#1a1a1a] placeholder:text-neutral-600"
            placeholder="e.g. Living Room"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Light checklist */}
        <div className="px-4 pb-2">
          <label className="block text-xs text-neutral-500 mb-2">
            Select Lights ({selectedIds.size})
          </label>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {availableLights.map((light) => {
              const isSelected = selectedIds.has(light.id);
              return (
                <button
                  key={light.id}
                  className={clsx(
                    "w-full flex items-center space-x-3 px-3 h-10 rounded-lg text-left transition-colors",
                    isSelected
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : "bg-[#111] border border-[#1a1a1a] hover:bg-[#1a1a1a]",
                  )}
                  onClick={() => toggleLight(light.id)}
                >
                  <div
                    className={clsx(
                      "text-lg",
                      isSelected
                        ? "i-bx-checkbox-checked text-blue-400"
                        : "i-bx-checkbox text-neutral-600",
                    )}
                  />
                  <div
                    className={clsx(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      light.online ? "bg-green-500" : "bg-neutral-700",
                    )}
                  />
                  <span className="text-sm text-white truncate">
                    {light.label}
                  </span>
                </button>
              );
            })}
            {availableLights.length === 0 && (
              <div className="text-xs text-neutral-600 text-center py-4">
                No lights available
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 px-4 pt-3 pb-4">
          <button
            className="flex-1 h-10 rounded-lg bg-[#111] hover:bg-[#1a1a1a] text-sm font-medium text-neutral-400 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white transition-colors disabled:opacity-40"
            disabled={!name.trim() || selectedIds.size === 0}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
