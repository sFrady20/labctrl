import Store from "electron-store";
import { AIModelConfig, DEFAULT_MODEL_PRESETS } from "./types";

interface AISettingsSchema {
  activeModelId: string;
  customModels: AIModelConfig[];
}

const store = new Store<AISettingsSchema>({
  name: "ai-settings",
  defaults: {
    activeModelId: "gpt-4.1-mini",
    customModels: [],
  },
});

export function getActiveModelId(): string {
  return store.get("activeModelId");
}

export function setActiveModelId(modelId: string): void {
  store.set("activeModelId", modelId);
}

export function getActiveModel(): AIModelConfig {
  const activeId = getActiveModelId();
  const allModels = getAllModels();
  return allModels.find((m) => m.id === activeId) || DEFAULT_MODEL_PRESETS[0];
}

export function getAllModels(): AIModelConfig[] {
  const customModels = store.get("customModels");
  return [...DEFAULT_MODEL_PRESETS, ...customModels];
}

export function getCustomModels(): AIModelConfig[] {
  return store.get("customModels");
}

export function addCustomModel(model: AIModelConfig): void {
  const customModels = store.get("customModels");
  store.set("customModels", [...customModels, model]);
}

export function removeCustomModel(modelId: string): void {
  const customModels = store.get("customModels");
  store.set(
    "customModels",
    customModels.filter((m) => m.id !== modelId)
  );
}

export function updateCustomModel(
  modelId: string,
  updates: Partial<AIModelConfig>
): void {
  const customModels = store.get("customModels");
  store.set(
    "customModels",
    customModels.map((m) => (m.id === modelId ? { ...m, ...updates } : m))
  );
}
